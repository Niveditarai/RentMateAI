'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import { KeyRound, Mail, User, ShieldCheck, Eye, EyeOff, Sparkles, Check, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
  const { signup, verifyOtp } = useAuth();
  const router = useRouter();

  // Signup form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'owner' | 'admin'>('tenant');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Password strength state
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('Too Short');
  const [strengthChecks, setStrengthChecks] = useState<any>({
    length: false,
    hasUpper: false,
    hasLower: false,
    hasDigit: false,
    hasSpecial: false
  });

  // Calculate password strength in real-time
  const evaluatePassword = async (pass: string) => {
    setPassword(pass);
    if (!pass) {
      setStrengthScore(0);
      setStrengthLabel('Too Short');
      return;
    }

    try {
      const res = await authApi.checkPasswordStrength(pass);
      setStrengthScore(res.score);
      setStrengthLabel(res.strength);
      setStrengthChecks(res.checks);
    } catch (e) {
      // Local fallback calculation if API fails
      const length = pass.length >= 8;
      const hasUpper = /[A-Z]/.test(pass);
      const hasLower = /[a-z]/.test(pass);
      const hasDigit = /[0-9]/.test(pass);
      const hasSpecial = /[^A-Za-z0-9]/.test(pass);
      
      let score = 0;
      if (length) score++;
      if (hasUpper) score++;
      if (hasLower) score++;
      if (hasDigit) score++;
      if (hasSpecial) score++;

      let strength = 'Weak';
      if (score >= 4) strength = 'Strong';
      else if (score >= 2) strength = 'Medium';

      setStrengthScore(score);
      setStrengthLabel(strength);
      setStrengthChecks({ length, hasUpper, hasLower, hasDigit, hasSpecial });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (strengthScore < 3) {
      setError('Password must satisfy more criteria before submitting.');
      setLoading(false);
      return;
    }

    try {
      const res = await signup({ name, email, password, role });
      setSimulatedOtpCode(res.simulatedOtp || '123456');
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    if (!otpInput) {
      setOtpError('Please input verification code.');
      setOtpLoading(false);
      return;
    }

    try {
      await verifyOtp(otpInput, email);
      alert('Verification successful! You can now log in.');
      router.push('/auth/login');
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Helper colors for strength bar
  const getStrengthBarColor = () => {
    if (strengthScore <= 1) return 'bg-red-500';
    if (strengthScore <= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-[#0B0F19] relative overflow-hidden">
      {/* Glow Spots */}
      <div className="glow-spot top-1/3 left-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10"
      >
        {/* Title */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">
            Create Account
          </h2>
          <p className="text-xs text-slate-400 font-semibold">Join RentMate AI Matching Platform</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignupSubmit} className="space-y-4">
          
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                required
              />
            </div>
          </div>

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
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Must be strong..."
                value={password}
                onChange={e => evaluatePassword(e.target.value)}
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

            {/* Password strength bar */}
            {password && (
              <div className="space-y-1.5 pt-1">
                <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                    className={`h-full transition-all duration-300 ${getStrengthBarColor()}`}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold tracking-wider">
                  <span className="text-slate-400">Strength:</span>
                  <span className={strengthScore >= 4 ? 'text-emerald-500' : strengthScore >= 2 ? 'text-amber-500' : 'text-red-500'}>
                    {strengthLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Role select */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['tenant', 'owner', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 text-center rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all border ${
                    role === r
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-800/60 text-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/45 transition-all text-xs flex items-center justify-center gap-1.5 btn-ripple pt-3"
          >
            {loading ? 'Creating Account...' : 'Register'}
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
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>

      {/* OTP Verification Modal Overlay */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#F8FAFC] dark:bg-[#0B0F19] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10 space-y-4"
            >
              <div className="text-center space-y-2">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Verify Your Email</h3>
                <p className="text-xs text-slate-400">We sent a 6-digit OTP verification code to {email}</p>
              </div>

              {/* Simulated OTP Hint Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-3.5 text-xs text-center font-medium">
                🛡️ [Simulated Email OTP]: <span className="font-extrabold text-sm tracking-widest">{simulatedOtpCode}</span>
                <span className="block text-[9px] text-emerald-400 mt-1 uppercase font-semibold">Use this code to pass verification instantly</span>
              </div>

              {otpError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-3 rounded-lg text-center">
                  {otpError}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP (e.g. 123456)"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  className="w-full text-center tracking-widest font-mono font-bold text-lg border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 py-2.5 rounded-xl focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs"
                >
                  {otpLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
