'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import { KeyRound, Mail, ShieldAlert, Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [simulatedResetOtp, setSimulatedResetOtp] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please provide email and password.');
      setLoading(false);
      return;
    }

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await authApi.forgotPassword(forgotEmail);
      setSimulatedResetOtp(res.simulatedOtp || '123456');
      setForgotSuccess(res.message || 'OTP code generated.');
    } catch (err: any) {
      setForgotError(err.message || 'Error executing reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-[#0B0F19] relative overflow-hidden">
      {/* Glow Spot */}
      <div className="glow-spot top-1/4 right-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10"
      >
        {/* Logo/Title */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-400 font-semibold">Sign in to your RentMate account</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[9px] uppercase font-bold tracking-wider text-blue-500 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 accent-blue-500"
            />
            <label htmlFor="rememberMe" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider cursor-pointer">
              Remember Me
            </label>
          </div>

          {/* CTA Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/45 transition-all text-xs flex items-center justify-center gap-1.5 btn-ripple pt-3"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        {/* Google login mockup */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/10 dark:border-slate-800/40" />
          </div>
          <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest">
            <span className="bg-[#F8FAFC] dark:bg-[#0B0F19] px-2 text-slate-400">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('Google authentication is in simulation mode.')}
          className="w-full flex items-center justify-center gap-2 border border-slate-200/30 dark:border-slate-800/60 hover:bg-slate-100/10 py-2.5 rounded-xl text-xs font-semibold transition-colors dark:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.74 14.96 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.6 2.8C6.01 7.15 8.79 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58l3.67 2.84c2.14-1.97 3.78-4.87 3.78-8.57z"
            />
            <path
              fill="#FBBC05"
              d="M5.1 14.7c-.25-.75-.39-1.55-.39-2.38 0-.83.14-1.63.39-2.38L1.5 7.14C.54 9.07 0 11.23 0 13.5c0 2.27.54 4.43 1.5 6.36l3.6-2.82z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.02.68-2.33 1.09-4.29 1.09-3.21 0-5.99-2.11-6.9-5.26l-3.6 2.82C3.39 20.35 7.35 23 12 23z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-xs text-slate-400 mt-6 font-semibold">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#F8FAFC] dark:bg-[#0B0F19] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10 space-y-4 text-xs"
            >
              <div className="text-center space-y-2">
                <HelpCircle className="h-10 w-10 text-blue-500 mx-auto" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Recover Password</h3>
                <p className="text-slate-400">Enter your email below to simulate sending a recovery OTP code.</p>
              </div>

              {forgotError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 py-2 px-3 rounded-lg text-center font-medium">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="space-y-2.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-2 px-3 rounded-lg text-center font-medium">
                    {forgotSuccess}
                  </div>
                  <div className="bg-blue-600/10 border border-blue-600/20 text-blue-500 p-3 rounded-xl text-center font-semibold">
                    🛡️ [Simulated Recovery OTP]: <span className="font-extrabold tracking-widest text-sm text-blue-600">{simulatedResetOtp}</span>
                  </div>
                </div>
              )}

              {!forgotSuccess && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Enter email e.g. john@example.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2.5 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all"
                  >
                    {forgotLoading ? 'Processing...' : 'Send Recovery OTP'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
