'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAssistant from '@/components/FloatingAssistant';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/services/api';
import { User, Mail, Compass, Sparkles, RefreshCw, Layers, CheckSquare, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();

  // Form profile fields state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [budget, setBudget] = useState(1200);
  const [location, setLocation] = useState('');
  const [roomType, setRoomType] = useState('Any');
  const [furnished, setFurnished] = useState('Any');
  const [genderPreference, setGenderPreference] = useState('Any');
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [tempHobby, setTempHobby] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      
      const prefs = (user.preferences as any) || {};
      setBudget(prefs.budget || 1200);
      setLocation(prefs.location || '');
      setRoomType(prefs.roomType || 'Any');
      setFurnished(prefs.furnished || 'Any');
      setGenderPreference(prefs.genderPreference || 'Any');
      setLifestyle(prefs.lifestyle || []);
    }
  }, [user]);

  const handleAddHobby = () => {
    if (tempHobby.trim() && !lifestyle.includes(tempHobby.trim().toLowerCase())) {
      setLifestyle([...lifestyle, tempHobby.trim().toLowerCase()]);
      setTempHobby('');
    }
  };

  const handleRemoveHobby = (hobbyName: string) => {
    setLifestyle(lifestyle.filter(h => h !== hobbyName));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    try {
      await usersApi.updateProfile({
        name,
        avatar,
        preferences: {
          budget,
          location,
          roomType,
          furnished,
          genderPreference,
          lifestyle
        }
      });
      await refreshProfile();
      setSuccessMsg('Profile settings updated successfully! AI compatibility matching values refreshed.');
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <Navbar />

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 z-10 space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Profile Settings</h2>
          <p className="text-xs text-slate-400 font-semibold">Update your co-living preferences to fine-tune compatibility scoring.</p>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs py-2.5 px-3 rounded-xl">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2.5 px-3 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Settings form card */}
        <form onSubmit={handleProfileUpdate} className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-5 text-xs">
          
          {/* Top basic name & avatar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-slate-200/10 dark:border-slate-800/30">
            <img src={avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`} alt={name} className="w-16 h-16 rounded-full border-2 border-blue-500 object-cover" />
            
            <div className="space-y-1.5 flex-grow w-full">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Account Avatar Seed</label>
              <input
                type="text"
                placeholder="Dicebear seed word..."
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none dark:text-white font-bold" required />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider opacity-60">Email Address (Read Only)</label>
              <input type="email" value={user?.email || ''} className="w-full border border-slate-200/20 dark:border-slate-800/30 bg-slate-100/40 dark:bg-slate-850 p-2 rounded-xl focus:outline-none opacity-50 dark:text-white" disabled />
            </div>
          </div>

          <hr className="border-slate-200/10 dark:border-slate-800/30" />

          {/* AI Match Preferences Header */}
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-blue-500">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>AI compatibility preferences</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Budget */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                <span>Monthly Budget</span>
                <span className="text-blue-500 font-extrabold">${budget}</span>
              </div>
              <input
                type="range"
                min="300"
                max="2500"
                step="50"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Location Preference */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Preferred Location</label>
              <input
                type="text"
                placeholder="e.g. Downtown"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none dark:text-white"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Room Type */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Preferred Room Type</label>
              <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none dark:text-white">
                <option value="Any">Any Config</option>
                <option value="private room">Private Room</option>
                <option value="shared room">Shared Room</option>
                <option value="entire flat">Entire Flat</option>
              </select>
            </div>

            {/* Furnished status */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Preferred Furnishing</label>
              <select value={furnished} onChange={e => setFurnished(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none dark:text-white">
                <option value="Any">Any Furnishing</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Gender Preference */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gender Preference</label>
              <select value={genderPreference} onChange={e => setGenderPreference(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none dark:text-white">
                <option value="Any">Any Gender</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
                <option value="mix">Mix Flat</option>
              </select>
            </div>

          </div>

          {/* Lifestyle / Hobbies list */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Lifestyle Hobbies (Match Engine Sync)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. hiking, reading, coding, gaming"
                value={tempHobby}
                onChange={e => setTempHobby(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddHobby(); } }}
                className="flex-grow border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none"
              />
              <button type="button" onClick={handleAddHobby} className="px-4 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold uppercase text-[9px]">Add</button>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {lifestyle.map(h => (
                <span key={h} onClick={() => handleRemoveHobby(h)} className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md px-2 py-0.5 cursor-pointer hover:bg-red-500/15 hover:text-red-500 hover:border-red-500/20 transition-all font-semibold capitalize">
                  {h} ×
                </span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg mt-4 uppercase tracking-wider">
            {loading ? 'Saving Preferences...' : 'Save Settings'}
          </button>

        </form>

      </main>

      <FloatingAssistant />
      <Footer />
    </div>
  );
}
