'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { listingsApi } from '@/services/api';
import { MessageCircle, X, Send, Sparkles, User, Bot, HelpCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function FloatingAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi there! I'm RentMate AI, your dedicated roommate coach. Ask me about matching tips, local average budgets, or click one of the quick suggestions below to start!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load listings dynamically to reference in recommendations
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingsApi.getAll();
        setListings(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchListings();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    "Suggest rooms in my budget",
    "How does the Match Engine work?",
    "Show top locations",
    "Coliving tips"
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      let reply = "I'm processing that. Let me look at the RentMate matching databases...";
      const normText = text.toLowerCase();

      if (normText.includes('budget') || normText.includes('rooms') || normText.includes('recommend')) {
        const budgetLimit = user?.preferences?.budget || 1200;
        const matchingListings = listings.filter(l => l.rent <= budgetLimit && !l.isFilled);

        if (matchingListings.length > 0) {
          reply = `Based on your budget of $${budgetLimit}, I found ${matchingListings.length} great matches! For example: "${matchingListings[0].title}" in ${matchingListings[0].location} for $${matchingListings[0].rent}/mo. You can find these on the 'Find Rooms' search page!`;
        } else {
          reply = `I don't see any listings directly below your budget preference of $${budgetLimit} right now, but there are some excellent choices in the listings gallery starting around $1400. You might want to adjust your preferences profile!`;
        }
      } else if (normText.includes('how') || normText.includes('compatibility') || normText.includes('engine') || normText.includes('match')) {
        reply = "Our AI Compatibility Engine compares your profile criteria (budget limits, preferred locations, preferred room configurations, and gender preference) against active listings. It computes a unified score between 0-100% and outputs a detailed breakdown so you can understand the fit instantly.";
      } else if (normText.includes('location') || normText.includes('place') || normText.includes('area')) {
        reply = "Currently, the most trending locations on RentMate AI are Downtown (average rent $1200/mo), Westside ($950/mo), and Academic Quarter ($800/mo). Check out the listings map to filter by these hubs!";
      } else if (normText.includes('coliving') || normText.includes('tip') || normText.includes('rental')) {
        reply = "Here's a top co-living tip: Always meet your potential flatmates virtually or physically before signing! Use our built-in Real-Time Chat to align on lifestyle factors like cleaning duties, noise levels, and guest rules.";
      } else {
        reply = `Interesting question! As an AI assistant, I recommend checking out our active dashboards to view interested tenants, list your rooms, or search and chat in real-time. Let me know if you want me to suggest specific listings!`;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="w-96 h-[500px] glass-panel rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden border border-slate-200/40 dark:border-slate-800/40"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-200 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm">RentMate AI Coach</h3>
                  <p className="text-[10px] text-cyan-100 font-medium">Online Roommate Expert</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/10 flex-shrink-0">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl rounded-tl-none p-3 text-xs flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 z-10">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[10px] bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full px-2.5 py-1 flex items-center gap-1 transition-colors"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-3 border-t border-slate-200/10 dark:border-slate-800/40 flex gap-2 items-center bg-white/5"
            >
              <input
                type="text"
                placeholder="Ask RentMate Coach..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-grow bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors btn-ripple"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-blue-500/30 transition-all border border-blue-400/20 relative"
        aria-label="Ask AI Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-cyan-400 w-3 h-3 rounded-full border-2 border-white dark:border-[#0B0F19] animate-ping" />
          </>
        )}
      </motion.button>
    </div>
  );
}
