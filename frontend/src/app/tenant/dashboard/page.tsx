'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAssistant from '@/components/FloatingAssistant';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, interestsApi } from '@/services/api';
import { User, ClipboardList, Calendar, CheckCircle2, AlertCircle, Heart, Compass, Sparkles, RefreshCw, Layout, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [recommendedRooms, setRecommendedRooms] = useState<any[]>([]);
  const [wishlistRooms, setWishlistRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile completion calculation
  const getProfileCompletion = () => {
    if (!user) return 0;
    let score = 20; // registered
    if (user.avatar) score += 20;
    if (user.preferences?.location) score += 20;
    if (user.preferences?.budget) score += 20;
    if (user.preferences?.roomType !== 'Any') score += 20;
    return score;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch applications
      const apps = await interestsApi.getAll();
      setMyApplications(apps);

      // 2. Fetch all listings to filter recommendations & wishlist
      const listings = await listingsApi.getAll();

      // Recommended rooms: listings that fit budget and location
      const budgetMax = user?.preferences?.budget || 1200;
      const recs = listings.filter((l: any) => l.rent <= budgetMax && !l.isFilled).slice(0, 3);
      setRecommendedRooms(recs);

      // Wishlist rooms: load IDs from local storage
      if (typeof window !== 'undefined') {
        const wishlistIds = JSON.parse(localStorage.getItem('rentmate_wishlist') || '[]');
        const wish = listings.filter((l: any) => wishlistIds.includes(l._id));
        setWishlistRooms(wish);
      }
    } catch (e) {
      console.error('Failed to load Tenant dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    if (status === 'accepted') {
      return (
        <span className="bg-emerald-500/10 text-emerald-500 rounded px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 w-max">
          <CheckCircle2 className="h-3 w-3" />
          <span>Accepted</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="bg-red-500/10 text-red-500 rounded px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 w-max">
          <AlertCircle className="h-3 w-3" />
          <span>Declined</span>
        </span>
      );
    }
    return (
      <span className="bg-amber-500/10 text-amber-500 rounded px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 w-max">
        <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
        <span>Pending</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Tenant Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] relative">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 z-10 space-y-6">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Tenant Hub</h2>
            <p className="text-xs text-slate-400 font-semibold">Track applications, view compatibility ranks, and update settings.</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:underline uppercase tracking-wider"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Profile Completion Meter / Details row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Profile completion */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-3.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Profile Integrity</span>
              <span className="text-blue-500">{getProfileCompletion()}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${getProfileCompletion()}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Complete your matching preferences and add an avatar to boost compatibility calculation accuracy.
            </p>
            <button
              onClick={() => window.location.href = '/profile'}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-0.5 uppercase tracking-wider"
            >
              <span>Edit Preferences</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 2: Applications overview widget */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Submitted Requests</span>
              <div className="text-3xl font-extrabold tracking-tight">{myApplications.length}</div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Pending: {myApplications.filter(a => a.status === 'pending').length}</span>
            </div>
            <ClipboardList className="h-10 w-10 text-indigo-500 opacity-40" />
          </div>

          {/* Card 3: Move-in Calendar helper */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Move-in Date Target</span>
              <div className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200">
                {user?.preferences?.moveInDate || 'Not configured'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Preferences synced</span>
            </div>
            <Calendar className="h-10 w-10 text-cyan-500 opacity-40" />
          </div>

        </div>

        {/* Dynamic Applications Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/40 dark:border-slate-800/40">
          <div className="p-5 border-b border-slate-200/10 dark:border-slate-800/30 font-bold text-sm tracking-wide uppercase text-slate-400">
            My Room Applications
          </div>
          <div className="overflow-x-auto">
            {myApplications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active applications. Explore rooms in the gallery and click "Express Interest" to apply!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/50 dark:bg-slate-900/40 uppercase text-slate-400 text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Room Details</th>
                    <th className="p-4">Rent</th>
                    <th className="p-4">Move In</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/20 font-medium">
                  {myApplications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-100/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white">{app.listing?.title || 'Unknown Room'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{app.listing?.location}</div>
                      </td>
                      <td className="p-4 font-bold">${app.listing?.rent || 0}/mo</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{app.listing?.moveInDate}</td>
                      <td className="p-4">{getStatusBadge(app.status)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => window.location.href = `/listings/${app.listingId}`}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View Listing
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recommended Rooms Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Recommended Ranks */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200/40 dark:border-slate-800/40 space-y-4">
            <div className="flex items-center gap-1.5 pb-3 border-b border-slate-200/10 dark:border-slate-800/30">
              <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
              <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400">AI Compatibility Recommendations</h3>
            </div>
            
            {recommendedRooms.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Configure your budget and location preferences in profile settings to populate compatibility lists.
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedRooms.map(room => (
                  <div
                    key={room._id}
                    onClick={() => window.location.href = `/listings/${room._id}`}
                    className="flex justify-between items-center p-3 bg-slate-100/40 dark:bg-slate-800/20 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors border border-transparent hover:border-blue-500/20"
                  >
                    <div>
                      <div className="font-bold text-xs line-clamp-1">{room.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{room.location} • ${room.rent}/mo</div>
                    </div>
                    <span className="text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full px-2.5 py-1 font-bold">
                      Explore
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Wishlist Rooms */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200/40 dark:border-slate-800/40 space-y-4">
            <div className="flex items-center gap-1.5 pb-3 border-b border-slate-200/10 dark:border-slate-800/30">
              <Heart className="h-4.5 w-4.5 text-red-500 fill-red-500" />
              <h3 className="font-bold text-sm uppercase tracking-wide text-slate-400">Saved Rooms Wishlist</h3>
            </div>

            {wishlistRooms.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Your saved wishlist is empty. Tap the heart icon on room cards to add them here!
              </div>
            ) : (
              <div className="space-y-4">
                {wishlistRooms.map(room => (
                  <div
                    key={room._id}
                    onClick={() => window.location.href = `/listings/${room._id}`}
                    className="flex justify-between items-center p-3 bg-slate-100/40 dark:bg-slate-800/20 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors border border-transparent hover:border-red-500/20"
                  >
                    <div>
                      <div className="font-bold text-xs line-clamp-1">{room.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{room.location} • ${room.rent}/mo</div>
                    </div>
                    <span className="text-[10px] bg-red-500/10 text-red-500 rounded-full px-2.5 py-1 font-bold">
                      View Room
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      <FloatingAssistant />
      <Footer />
    </div>
  );
}
