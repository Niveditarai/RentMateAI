'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAssistant from '@/components/FloatingAssistant';
import { useAuth } from '@/context/AuthContext';
import { adminApi, listingsApi } from '@/services/api';
import { Users, Shield, Layers, ClipboardList, Trash2, X, RefreshCw, Activity, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [listingsList, setListingsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminApi.getStats();
      setStats(statsRes);

      const usersRes = await adminApi.getUsers();
      setUsersList(usersRes);

      const listingsRes = await listingsApi.getAll();
      setListingsList(listingsRes);
    } catch (e) {
      console.error('Failed to load admin dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      alert('You cannot delete yourself, admin!');
      return;
    }
    if (!confirm('Are you sure you want to delete this user and all their associated data permanently?')) return;
    try {
      await adminApi.deleteUser(id);
      alert('User deleted.');
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Error deleting user.');
    }
  };

  const handleSuspendListing = async (id: string) => {
    if (!confirm('Are you sure you want to suspend/delete this listing permanently?')) return;
    try {
      // Direct delete listing as admin
      await listingsApi.delete(id);
      alert('Listing deleted from platform.');
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Error deleting listing.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Admin Panel...</span>
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
            <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Admin Control Center</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold">Monitor platform health, registrations metrics, and moderate accounts.</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-500 uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Stats</span>
          </button>
        </div>

        {/* Metrics Overview Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Card 1: Users */}
            <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Members</span>
                <div className="text-2xl font-black">{stats.counts.totalUsers}</div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">Tenants: {stats.counts.tenants} • Owners: {stats.counts.owners}</span>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-40" />
            </div>

            {/* Card 2: Listings */}
            <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Listings Posted</span>
                <div className="text-2xl font-black text-cyan-500">{stats.counts.totalListings}</div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">Open: {stats.counts.openListings} • Filled: {stats.counts.filledListings}</span>
              </div>
              <Layers className="h-8 w-8 text-cyan-500 opacity-40" />
            </div>

            {/* Card 3: Applications */}
            <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Interests Exchanged</span>
                <div className="text-2xl font-black text-indigo-500">{stats.counts.totalInterests}</div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">Active applications</span>
              </div>
              <ClipboardList className="h-8 w-8 text-indigo-500 opacity-40" />
            </div>

            {/* Card 4: Status */}
            <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Platform Server</span>
                <div className="text-2xl font-black text-emerald-500">UP</div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">Database: Active</span>
              </div>
              <CheckSquare className="h-8 w-8 text-emerald-500 opacity-40" />
            </div>

          </div>
        )}

        {/* Recharts Analytics Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Registrations */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>Account Registrations (Monthly)</span>
              </div>
              <div className="h-48 w-full text-slate-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.charts.registrations}>
                    <defs>
                      <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="currentColor" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0b0f19', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#regGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Applications */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Activity className="h-4 w-4 text-indigo-500" />
                <span>Applications Exchanged (Monthly)</span>
              </div>
              <div className="h-48 w-full text-slate-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.charts.applications}>
                    <defs>
                      <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="currentColor" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0b0f19', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#appGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* Moderation Panels (Users vs Listings) */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/40 dark:border-slate-800/40">
          
          {/* Moderation Tabs */}
          <div className="flex border-b border-slate-200/10 dark:border-slate-800/30">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'users' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              User Accounts ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'listings' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Listings ({listingsList.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'users' ? (
              usersList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No users registered on platform.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/50 dark:bg-slate-900/40 uppercase text-slate-400 text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Verification</th>
                      <th className="p-4 text-right">Moderate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/20 font-medium">
                    {usersList.map((usr) => (
                      <tr key={usr._id} className="hover:bg-slate-100/5 transition-colors">
                        <td className="p-4 flex items-center gap-2">
                          <img src={usr.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${usr.name}`} alt={usr.name} className="w-7 h-7 rounded-full object-cover" />
                          <span className="font-bold">{usr.name}</span>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{usr.email}</td>
                        <td className="p-4 capitalize">{usr.role}</td>
                        <td className="p-4">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${usr.isVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {usr.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(usr._id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              listingsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No listings active on platform.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/50 dark:bg-slate-900/40 uppercase text-slate-400 text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Property</th>
                      <th className="p-4">Landlord</th>
                      <th className="p-4">Rent</th>
                      <th className="p-4">Room Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Moderate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/20 font-medium">
                    {listingsList.map((lst) => (
                      <tr key={lst._id} className="hover:bg-slate-100/5 transition-colors">
                        <td className="p-4">
                          <div className="font-bold">{lst.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{lst.location}</div>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{lst.ownerName}</td>
                        <td className="p-4 font-bold">${lst.rent}/mo</td>
                        <td className="p-4 capitalize">{lst.roomType}</td>
                        <td className="p-4">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${lst.isFilled ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {lst.isFilled ? 'Filled' : 'Open'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSuspendListing(lst._id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"
                            title="Suspend/Delete Listing"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

      </main>

      <FloatingAssistant />
      <Footer />
    </div>
  );
}
