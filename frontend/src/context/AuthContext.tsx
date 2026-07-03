'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, usersApi } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'tenant' | 'owner' | 'admin';
  avatar: string;
  isVerified: boolean;
  preferences?: {
    budget: number;
    location: string;
    moveInDate: string;
    roomType: string;
    lifestyle: string[];
    furnished: string;
    genderPreference: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  signup: (userData: any) => Promise<any>;
  verifyOtp: (otp: string, email: string) => Promise<any>;
  logout: () => void;
  updateUserPreferences: (preferences: any) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem('rentmate_token');
      const storedUser = localStorage.getItem('rentmate_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Fetch fresh profile in background
        try {
          const freshUser = await usersApi.getProfile();
          setUser(freshUser);
          localStorage.setItem('rentmate_user', JSON.stringify(freshUser));
        } catch (e) {
          console.error('Failed to refresh user profile on init:', e);
          // If token is invalid, log out
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const data = await authApi.login(credentials);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('rentmate_token', data.token);
      localStorage.setItem('rentmate_user', JSON.stringify(data.user));
      
      // Redirect to correct dashboard
      if (data.user.role === 'admin') router.push('/admin/dashboard');
      else if (data.user.role === 'owner') router.push('/owner/dashboard');
      else router.push('/tenant/dashboard');

      return data;
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setLoading(true);
    try {
      const data = await authApi.signup(userData);
      // We don't auto login because they need OTP validation, but we pre-set credentials
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('rentmate_token', data.token);
      localStorage.setItem('rentmate_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp: string, email: string) => {
    try {
      const data = await authApi.verifyOtp({ otp, email });
      if (user) {
        const updatedUser = { ...user, isVerified: true };
        setUser(updatedUser);
        localStorage.setItem('rentmate_user', JSON.stringify(updatedUser));
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rentmate_token');
    localStorage.removeItem('rentmate_user');
    router.push('/');
  };

  const updateUserPreferences = async (preferences: any) => {
    try {
      const data = await usersApi.updateProfile({ preferences });
      setUser(data.user);
      localStorage.setItem('rentmate_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      const freshUser = await usersApi.getProfile();
      setUser(freshUser);
      localStorage.setItem('rentmate_user', JSON.stringify(freshUser));
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        verifyOtp,
        logout,
        updateUserPreferences,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
