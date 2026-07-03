'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAssistant from '@/components/FloatingAssistant';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usersApi } from '@/services/api';
import { Moon, Sun, Bell, ShieldAlert, KeyRound, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Notification toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete account loading
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    setPasswordLoading(true);

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in both password fields.');
      setPasswordLoading(false);
      return;
    }

    try {
      await usersApi.updatePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('🚨 WARNING: Deleting your account will permanently wipe your profile, listings, active applications, notifications, and chats. This action is irreversible. Proceed?')) return;
    setDeleteLoading(true);

    try {
      await usersApi.deleteAccount();
      alert('Your RentMate account has been deleted successfully. Goodbye!');
      logout();
    } catch (e: any) {
      alert(e.message || 'Error executing account deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <Navbar />

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 z-10 space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Account Settings</h2>
          <p className="text-xs text-slate-400 font-semibold">Manage system themes, notification updates, passwords, and visibility status.</p>
        </div>

        {/* 1. Theme Configuration Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-white">System Appearance</h4>
            <p className="text-slate-400">Toggle between dark mode (recommended for luxury visual) and light mode.</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 py-2 px-4 rounded-xl font-bold uppercase transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-500" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Notification Configuration Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/10 dark:border-slate-800/30 pb-2">
            <Bell className="h-4.5 w-4.5" />
            <span>Notification Settings</span>
          </div>

          {/* Email notifications */}
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="font-bold block">Email Notifications</span>
              <span className="text-slate-400 text-[10px]">Receive matching alerts, chat logs, and verification checks.</span>
            </div>
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={e => setEmailNotif(e.target.checked)}
              className="h-5 w-5 rounded border-slate-350 dark:border-slate-800 accent-blue-500"
            />
          </div>

          {/* Push notifications */}
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="font-bold block">Push Notifications (UI Only)</span>
              <span className="text-slate-400 text-[10px]">Display instant badges when compatibility scores recalculate.</span>
            </div>
            <input
              type="checkbox"
              checked={pushNotif}
              onChange={e => setPushNotif(e.target.checked)}
              className="h-5 w-5 rounded border-slate-350 dark:border-slate-800 accent-blue-500"
            />
          </div>
        </div>

        {/* 3. Password Reset Form */}
        <form onSubmit={handlePasswordChange} className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 border-b border-[#E2E8F0]/10 dark:border-[#1E293B]/30 pb-2">
            <KeyRound className="h-4.5 w-4.5" />
            <span>Update Password</span>
          </div>

          {passwordSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-2 px-3 rounded-lg">
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 py-2 px-3 rounded-lg flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Show/Hide password switch */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[10px] uppercase font-bold text-blue-500 hover:underline"
            >
              {showPassword ? 'Hide Passwords' : 'Show Passwords'}
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              {passwordLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
              <span>Save Password</span>
            </button>
          </div>
        </form>

        {/* 4. Delete Account Alert Card */}
        <div className="glass-panel p-6 rounded-2xl border border-red-500/20 shadow-md relative overflow-hidden bg-red-500/5 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-red-500 flex items-center justify-center sm:justify-start gap-1">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>Danger Zone</span>
            </h4>
            <p className="text-slate-400">Permanently close and delete your RentMate AI profile. Wipes all data.</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2.5 px-4 rounded-xl font-bold uppercase transition-colors shadow-lg shadow-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>

      </main>

      <FloatingAssistant />
      <Footer />
    </div>
  );
}
