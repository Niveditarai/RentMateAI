'use client';

import React, { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { chatsApi, usersApi } from '@/services/api';
import { Send, Smile, Paperclip, RefreshCw, Circle, User, Bot, AlertCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, onlineUsers, emitSendMessage, emitTyping } = useSocket();

  // Chat lists states
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message input states
  const [inputText, setInputText] = useState('');
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load chats
  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const data = await chatsApi.getAll();
      setChats(data);
      if (data.length > 0) {
        setSelectedChat(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  // Load messages when selectedChat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      setLoadingMessages(true);
      setIsRecipientTyping(false);
      try {
        const data = await chatsApi.getMessages(selectedChat._id);
        setMessages(data);

        // Emit markAsSeen on socket when message logs load
        if (socket && user) {
          const recipient = selectedChat.participants.find((p: string) => p !== user.id);
          socket.emit('markAsSeen', {
            chatId: selectedChat._id,
            readerId: user.id,
            senderId: recipient
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedChat]);

  // Setup Socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for incoming messages
    socket.on('messageReceived', (message: any) => {
      // If message belongs to active chat, append it
      if (selectedChat && message.chatId === selectedChat._id) {
        setMessages(prev => [...prev, message]);
        setIsRecipientTyping(false);

        // Emit markAsSeen receipt back to sender
        socket.emit('markAsSeen', {
          chatId: selectedChat._id,
          readerId: user.id,
          senderId: message.senderId
        });
      }

      // Refresh chat list to update last messages
      fetchChats();
    });

    // Listen for typing events
    socket.on('typingUpdate', (data: { chatId: string; senderId: string; isTyping: boolean }) => {
      if (selectedChat && data.chatId === selectedChat._id && data.senderId !== user.id) {
        setIsRecipientTyping(data.isTyping);
      }
    });

    // Listen for read receipt seen updates
    socket.on('messageSeenUpdate', (data: { chatId: string; readerId: string }) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setMessages(prev => prev.map(msg => {
          if (msg.readBy && !msg.readBy.includes(data.readerId)) {
            return {
              ...msg,
              readBy: [...msg.readBy, data.readerId]
            };
          }
          return msg;
        }));
      }
    });

    return () => {
      socket.off('messageReceived');
      socket.off('typingUpdate');
      socket.off('messageSeenUpdate');
    };
  }, [socket, selectedChat, user]);

  // Scroll to bottom helper
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecipientTyping]);

  // Handle typing emitter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!selectedChat || !user) return;

    const recipient = selectedChat.participants.find((p: string) => p !== user.id);
    if (!recipient) return;

    // Emit typing status: true
    emitTyping({
      chatId: selectedChat._id,
      senderId: user.id,
      recipientId: recipient,
      isTyping: true
    });

    // Clear old timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing status: false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping({
        chatId: selectedChat._id,
        senderId: user.id,
        recipientId: recipient,
        isTyping: false
      });
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat || !user) return;

    const recipientId = selectedChat.participants.find((p: string) => p !== user.id);
    if (!recipientId) return;

    // Emit sendMessage on Socket
    emitSendMessage({
      chatId: selectedChat._id,
      senderId: user.id,
      text: inputText,
      recipientId
    });

    // Optimistically add message log to view
    const optMessage = {
      _id: Date.now().toString(),
      chatId: selectedChat._id,
      senderId: user.id,
      text: inputText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMessage]);
    setInputText('');

    // Clear typing timeout and emit false immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping({
      chatId: selectedChat._id,
      senderId: user.id,
      recipientId,
      isTyping: false
    });
  };

  const getRecipientDetails = (chat: any) => {
    if (!chat || !user) return { name: 'Flatmate', avatar: '', role: 'tenant' };
    return chat.participantDetails.find((p: any) => p.id !== user.id) || { name: 'Flatmate', avatar: '', role: 'tenant' };
  };

  const getOnlineStatus = (userId: string) => {
    return onlineUsers[userId] === 'online' ? 'online' : 'offline';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex gap-6 h-[calc(100vh-140px)] z-10">
        
        {/* Left: Chat room list */}
        <aside className="w-80 glass-panel rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-200/10 dark:border-slate-800/30 font-bold uppercase tracking-wider text-xs text-slate-400">
            Conversations
          </div>
          
          <div className="flex-grow overflow-y-auto divide-y divide-slate-200/10 dark:divide-slate-800/20">
            {loadingChats ? (
              <div className="p-8 text-center text-slate-400 text-xs flex justify-center gap-2 items-center">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading active chats...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active conversations. Reach out to room listings to start chatting!
              </div>
            ) : (
              chats.map((chat) => {
                const recipient = getRecipientDetails(chat);
                const isSelected = selectedChat?._id === chat._id;
                const status = getOnlineStatus(recipient.id);

                return (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 cursor-pointer flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-blue-600/10 dark:bg-blue-600/5 font-semibold border-l-4 border-blue-500' : 'hover:bg-slate-100/5'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img src={recipient.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${recipient.name}`} alt={recipient.name} className="w-9 h-9 rounded-full object-cover" />
                      <Circle className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0B0F19] fill-current ${
                        status === 'online' ? 'text-emerald-500' : 'text-slate-400'
                      }`} />
                    </div>

                    <div className="flex-grow text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{recipient.name}</span>
                        <span className="text-[9px] text-slate-400 capitalize">{recipient.role}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {chat.lastMessage?.text || 'No messages yet...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Message Window */}
        <section className="flex-grow glass-panel rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Message Window Header */}
              <div className="p-4 border-b border-slate-200/10 dark:border-slate-800/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={getRecipientDetails(selectedChat).avatar} className="w-9 h-9 rounded-full object-cover" />
                    <Circle className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0B0F19] fill-current ${
                      getOnlineStatus(getRecipientDetails(selectedChat).id) === 'online' ? 'text-emerald-500' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800 dark:text-white">
                      {getRecipientDetails(selectedChat).name}
                    </h3>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">
                      {getOnlineStatus(getRecipientDetails(selectedChat).id) === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message list container */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSender = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2.5 ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isSender
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span className="block text-[8px] text-right mt-1 opacity-70">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isSender && msg.readBy && msg.readBy.length > 1 && ' • Seen'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Recipient Typing indicator */}
                {isRecipientTyping && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl rounded-tl-none p-3 text-xs flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                
                <div ref={scrollRef} />
              </div>

              {/* Message inputs form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/10 dark:border-slate-800/40 flex gap-2 items-center bg-white/5">
                <button type="button" onClick={() => alert('Attachments simulation.')} className="p-2 text-slate-400 hover:text-slate-200">
                  <Paperclip className="h-4.5 w-4.5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-grow bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <button type="button" onClick={() => alert('Emoji keyboard simulation.')} className="p-2 text-slate-400 hover:text-slate-200">
                  <Smile className="h-4.5 w-4.5" />
                </button>
                <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-ripple">
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col justify-center items-center text-center p-6 text-slate-400 space-y-3">
              <MessageSquare className="h-10 w-10 text-slate-500 opacity-40 animate-pulse" />
              <h4 className="font-bold text-sm">Select a Conversation</h4>
              <p className="text-xs max-w-xs leading-relaxed">
                Choose an active flatmate chat thread from the left bar to exchange real-time updates.
              </p>
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}
