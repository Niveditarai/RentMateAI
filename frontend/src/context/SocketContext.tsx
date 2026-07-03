'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: { [userId: string]: 'online' | 'offline' };
  emitSendMessage: (data: { chatId: string; senderId: string; text: string; recipientId: string }) => void;
  emitTyping: (data: { chatId: string; senderId: string; recipientId: string; isTyping: boolean }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ [userId: string]: 'online' | 'offline' }>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect socket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.io backend');
      newSocket.emit('join', user.id);
    });

    newSocket.on('userStatusUpdate', (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: data.status
      }));
    });

    newSocket.on('usersStatusResponse', (statuses: Array<{ userId: string; status: 'online' | 'offline' }>) => {
      const updates: { [userId: string]: 'online' | 'offline' } = {};
      statuses.forEach(s => {
        updates[s.userId] = s.status;
      });
      setOnlineUsers(prev => ({
        ...prev,
        ...updates
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const emitSendMessage = (data: { chatId: string; senderId: string; text: string; recipientId: string }) => {
    if (socket) {
      socket.emit('sendMessage', data);
    }
  };

  const emitTyping = (data: { chatId: string; senderId: string; recipientId: string; isTyping: boolean }) => {
    if (socket) {
      socket.emit('typing', data);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, emitSendMessage, emitTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
