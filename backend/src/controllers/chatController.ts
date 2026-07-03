import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbService } from '../config/db';

// Get all chat rooms for a user
export const getChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const chats = await dbService.getCollection('chats').find();

    // Filter chats where user is a participant
    const myChats = chats.filter(chat => chat.participants.includes(userId));

    // Fetch the last message for each chat to display in the list
    for (const chat of myChats) {
      const messages = await dbService.getCollection('messages').find({ chatId: chat._id });
      // Sort by creation date descending
      messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      chat.lastMessage = messages.length > 0 ? messages[0] : null;
    }

    // Sort chats by last message time
    myChats.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    return res.json(myChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({ message: 'Error fetching chats' });
  }
};

// Get messages in a chat
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    // Check if chat exists and user is a participant
    const chat = await dbService.getCollection('chats').findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to view these messages.' });
    }

    const messages = await dbService.getCollection('messages').find({ chatId });
    // Sort ascending for chronological view
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Mark messages as read by current user
    for (const msg of messages) {
      if (msg.senderId !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
        const readBy = msg.readBy || [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          await dbService.getCollection('messages').findByIdAndUpdate(msg._id, { readBy });
        }
      }
    }

    return res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Send Message (REST Endpoint)
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId, text } = req.body;
    const senderId = req.user?.id;

    if (!chatId || !text) {
      return res.status(400).json({ message: 'Chat ID and message text are required.' });
    }

    const chat = await dbService.getCollection('chats').findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({ message: 'Not authorized to post to this chat.' });
    }

    const message = await dbService.getCollection('messages').create({
      chatId,
      senderId,
      text,
      readBy: [senderId!]
    });

    // Notify other participant of the new message
    const recipientId = chat.participants.find((p: string) => p !== senderId);
    if (recipientId) {
      await dbService.getCollection('notifications').create({
        userId: recipientId,
        title: 'New Message',
        message: `${req.user?.name} sent you a message.`,
        type: 'new_message',
        read: false,
        metaData: { chatId, senderId: senderId! }
      });
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Error sending message' });
  }
};
