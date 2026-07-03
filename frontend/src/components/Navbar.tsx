'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { notificationsApi } from '@/services/api';
import { Bell, Sun, Moon, LogOut, User, MessageSquare, Shield, Home, Layout, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (e) {
      console.error('Failed to load notifications in Navbar', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll notifications every 10 seconds for simulated real-time checks
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'owner') return '/owner/dashboard';
    return '/tenant/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0]/30 dark:border-[#1E293B]/60 bg-[#F8FAFC]/75 dark:bg-[#0B0F19]/75 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
          <Home className="h-6 w-6 text-blue-600" />
          <span>RentMate <span className="text-cyan-500 font-medium">AI</span></span>
        </Link>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/listings" className={`text-sm font-medium hover:text-blue-500 transition-colors ${pathname === '/listings' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
            Find Rooms
          </Link>
          {user && (
            <>
              <Link href="/chat" className={`text-sm font-medium flex items-center gap-1.5 hover:text-blue-500 transition-colors ${pathname === '/chat' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                <MessageSquare className="h-4 w-4" /> Chats
              </Link>
              <Link href={getDashboardLink()} className={`text-sm font-medium flex items-center gap-1.5 hover:text-blue-500 transition-colors ${pathname.includes('dashboard') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                <Layout className="h-4 w-4" /> Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Buttons & Profile Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-xl overflow-hidden py-2 text-sm z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-200/30 dark:border-slate-800/60 flex items-center justify-between font-semibold">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-200/10 dark:divide-slate-800/20">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-400">No notifications</div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => markSingleRead(notif._id)}
                              className={`p-3 hover:bg-slate-100/10 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-500/5 font-medium' : ''}`}
                            >
                              <div className="text-xs text-slate-400 mb-0.5">{notif.title}</div>
                              <div className="text-slate-600 dark:text-slate-300 text-xs">{notif.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User avatar / profile button */}
              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 pl-2 border-l border-slate-200/30 dark:border-slate-800/60">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-blue-500/50 object-cover"
                  />
                  <div className="text-left">
                    <div className="text-xs font-semibold max-w-[80px] truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                  </div>
                </Link>

                <button 
                  onClick={logout}
                  className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">
                Login
              </Link>
              <Link href="/auth/signup" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all btn-ripple">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200/30 dark:border-slate-800/60 bg-[#F8FAFC] dark:bg-[#0B0F19] px-4 py-4 space-y-3 shadow-inner"
          >
            <Link href="/listings" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-medium text-slate-600 dark:text-slate-300">
              Find Rooms
            </Link>
            {user ? (
              <>
                <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-medium text-slate-600 dark:text-slate-300">
                  Chats
                </Link>
                <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-medium text-slate-600 dark:text-slate-300">
                  Dashboard
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-medium text-slate-600 dark:text-slate-300">
                  Edit Profile
                </Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-base font-medium text-red-500 flex items-center gap-2">
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 border border-slate-200/30 dark:border-slate-800/60 rounded-xl font-medium text-sm">
                  Login
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-blue-600 text-white rounded-xl font-medium text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
