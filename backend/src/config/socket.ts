import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { dbService } from './db';

// Keep track of active users by mapping userId to socketId
const onlineUsers = new Map<string, string>();

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow any client connection during development
      methods: ['GET', 'POST']
    }
  });

  console.log('🔌 Socket.io server initialized');

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // User joins with their ID
    socket.on('join', (userId: string) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        console.log(`👤 User ${userId} joined on socket ${socket.id}`);
        // Broadcast that user is online
        io.emit('userStatusUpdate', { userId, status: 'online' });
      }
    });

    // Handle typing status updates
    socket.on('typing', (data: { chatId: string; senderId: string; recipientId: string; isTyping: boolean }) => {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('typingUpdate', {
          chatId: data.chatId,
          senderId: data.senderId,
          isTyping: data.isTyping
        });
      }
    });

    // Real-time Chat Messaging
    socket.on('sendMessage', async (data: { chatId: string; senderId: string; text: string; recipientId: string }) => {
      const { chatId, senderId, text, recipientId } = data;

      try {
        // Enforce websocket chat gate: verify chat room exists and sender is participant (starts only after owner accepts)
        const chat = await dbService.getCollection('chats').findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat room not authorized or does not exist.' });
          return;
        }
        if (!chat.participants.includes(senderId)) {
          socket.emit('error', { message: 'You are not authorized in this chat conversation.' });
          return;
        }

        // Persist message to database
        const message = await dbService.getCollection('messages').create({
          chatId,
          senderId,
          text,
          readBy: [senderId]
        });

        // Update the last message time in the chat log
        await dbService.getCollection('chats').findByIdAndUpdate(chatId, {
          updatedAt: new Date().toISOString()
        });

        // Send confirmation back to sender
        socket.emit('messageSent', message);

        // Relay message to recipient if online
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('messageReceived', message);
        } else {
          // Recipient is offline, create an offline notification
          const sender = await dbService.getCollection('users').findById(senderId);
          await dbService.getCollection('notifications').create({
            userId: recipientId,
            title: 'New Message (Offline)',
            message: `${sender?.name || 'Someone'} sent you a message.`,
            type: 'new_message',
            read: false,
            metaData: { chatId, senderId }
          });
        }
      } catch (error) {
        console.error('Error handling socket sendMessage:', error);
        socket.emit('error', { message: 'Message delivery failed' });
      }
    });

    // Handle Seen Status receipt relays
    socket.on('markAsSeen', async (data: { chatId: string; readerId: string; senderId: string }) => {
      const { chatId, readerId, senderId } = data;
      try {
        const messages = await dbService.getCollection('messages').find({ chatId });
        for (const msg of messages) {
          if (!msg.readBy.includes(readerId)) {
            await dbService.getCollection('messages').findByIdAndUpdate(msg._id, {
              $push: { readBy: readerId }
            });
          }
        }

        // Notify sender that reader marked messages as seen
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageSeenUpdate', { chatId, readerId });
        }
      } catch (error) {
        console.error('Error handling socket markAsSeen:', error);
      }
    });

    // Check online status of users
    socket.on('checkUserStatus', (userIds: string[]) => {
      const statuses = userIds.map(id => ({
        userId: id,
        status: onlineUsers.has(id) ? 'online' : 'offline'
      }));
      socket.emit('usersStatusResponse', statuses);
    });

    // Disconnect
    socket.on('disconnect', () => {
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        console.log(`👤 User ${disconnectedUserId} disconnected`);
        io.emit('userStatusUpdate', { userId: disconnectedUserId, status: 'offline' });
      }
    });
  });

  return io;
};
