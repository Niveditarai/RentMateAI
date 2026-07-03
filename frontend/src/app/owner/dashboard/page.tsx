'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAssistant from '@/components/FloatingAssistant';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, interestsApi } from '@/services/api';
import { Plus, Edit2, Trash2, Check, X, ShieldAlert, Sparkles, RefreshCw, Layers, Users, MessageSquare, Bell, Coins, Eye, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OwnerDashboard() {
  const { user } = useAuth();

  // List States
  const [myListings, setMyListings] = useState<any[]>([]);
  const [tenantRequests, setTenantRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Listing creation form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState('');
  const [location, setLocation] = useState('');
  const [roomType, setRoomType] = useState('private room');
  const [furnishedStatus, setFurnishedStatus] = useState('furnished');
  const [moveInDate, setMoveInDate] = useState('');
  const [genderPreference, setGenderPreference] = useState('Any');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [tempAmenity, setTempAmenity] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch listings created by this owner
      const listings = await listingsApi.getAll({ ownerId: user.id });
      setMyListings(listings);

      // 2. Fetch tenant applications
      const requests = await interestsApi.getAll();
      setTenantRequests(requests);
    } catch (e) {
      console.error('Failed to load owner dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleAddAmenity = () => {
    if (tempAmenity.trim() && !amenities.includes(tempAmenity.trim().toLowerCase())) {
      setAmenities([...amenities, tempAmenity.trim().toLowerCase()]);
      setTempAmenity('');
    }
  };

  const handleRemoveAmenity = (name: string) => {
    setAmenities(amenities.filter(a => a !== name));
  };

  // Submit Listing Create
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!title || !description || !rent || !location || !moveInDate) {
      setFormError('Please fill in all required fields.');
      setFormLoading(false);
      return;
    }

    try {
      await listingsApi.create({
        title,
        description,
        rent: Number(rent),
        location,
        roomType,
        furnishedStatus,
        moveInDate,
        genderPreference,
        amenities,
        images
      });
      setShowAddModal(false);
      resetForm();
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create listing.');
    } finally {
      setFormLoading(false);
    }
  };

  // Trigger edit modal populated with active listing details
  const openEditModal = (listing: any) => {
    setEditingListingId(listing._id);
    setTitle(listing.title);
    setDescription(listing.description);
    setRent(listing.rent.toString());
    setLocation(listing.location);
    setRoomType(listing.roomType);
    setFurnishedStatus(listing.furnishedStatus);
    setMoveInDate(listing.moveInDate);
    setGenderPreference(listing.genderPreference);
    setAmenities(listing.amenities || []);
    setImages(listing.images || []);
    setShowEditModal(true);
  };

  const handleEditListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListingId) return;
    setFormError('');
    setFormLoading(true);

    try {
      await listingsApi.update(editingListingId, {
        title,
        description,
        rent: Number(rent),
        location,
        roomType,
        furnishedStatus,
        moveInDate,
        genderPreference,
        amenities,
        images
      });
      setShowEditModal(false);
      resetForm();
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update listing.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing permanently?')) return;
    try {
      await listingsApi.delete(id);
      fetchDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete listing.');
    }
  };

  // Toggle Filled Status
  const handleToggleFilled = async (id: string, isFilled: boolean) => {
    try {
      await listingsApi.toggleFilled(id, isFilled);
      // Reload lists
      fetchDashboardData();
    } catch (e: any) {
      alert(e.message || 'Error updating filled status.');
    }
  };

  // Manage Tenant Request Status (Accept / Reject)
  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await interestsApi.updateStatus(id, status);
      alert(`Tenant application marked as ${status}.`);
      fetchDashboardData();
    } catch (e: any) {
      alert(e.message || 'Error updating application status.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRent('');
    setLocation('');
    setRoomType('private room');
    setFurnishedStatus('furnished');
    setMoveInDate('');
    setGenderPreference('Any');
    setAmenities([]);
    setTempAmenity('');
    setImages([]);
    setEditingListingId(null);
  };

  // Compute total monthly revenue mockup from filled listings
  const getRevenue = () => {
    const filled = myListings.filter(l => l.isFilled);
    return filled.reduce((sum, l) => sum + l.rent, 0);
  };

  if (loading && myListings.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Landlord Hub...</span>
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
            <h2 className="text-2xl font-black tracking-tight uppercase">Landlord Hub</h2>
            <p className="text-xs text-slate-400 font-semibold">Post listings, monitor incoming tenant requests, and overview metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-500 uppercase tracking-wider transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Logs</span>
            </button>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/45 transition-all text-xs flex items-center gap-1.5 btn-ripple uppercase tracking-wider"
            >
              <Plus className="h-4 w-4" />
              <span>Create Listing</span>
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Card 1: Total Listings */}
          <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Listings</span>
              <div className="text-2xl font-black">{myListings.length}</div>
            </div>
            <Layers className="h-8 w-8 text-blue-500 opacity-40" />
          </div>

          {/* Card 2: Open Rooms */}
          <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Open</span>
              <div className="text-2xl font-black text-emerald-500">{myListings.filter(l => !l.isFilled).length}</div>
            </div>
            <CheckSquare className="h-8 w-8 text-emerald-500 opacity-40" />
          </div>

          {/* Card 3: Interested Tenants */}
          <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Applicants</span>
              <div className="text-2xl font-black text-indigo-500">{tenantRequests.length}</div>
            </div>
            <Users className="h-8 w-8 text-indigo-500 opacity-40" />
          </div>

          {/* Card 4: Chats active */}
          <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chats</span>
              <div className="text-2xl font-black text-cyan-500">
                {tenantRequests.filter(r => r.status === 'accepted').length}
              </div>
            </div>
            <MessageSquare className="h-8 w-8 text-cyan-500 opacity-40" />
          </div>

          {/* Card 5: Revenue */}
          <div className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between col-span-2 md:col-span-1">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Revenue</span>
              <div className="text-2xl font-black text-amber-500">${getRevenue()}</div>
            </div>
            <Coins className="h-8 w-8 text-amber-500 opacity-40" />
          </div>

        </div>

        {/* Interested Tenants section (Applications List) */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/40 dark:border-slate-800/40">
          <div className="p-5 border-b border-slate-200/10 dark:border-slate-800/30 font-bold text-sm tracking-wide uppercase text-slate-400 flex justify-between items-center">
            <span>Incoming Tenant Applications</span>
            <span className="bg-blue-600/10 text-blue-500 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
              {tenantRequests.filter(r => r.status === 'pending').length} Action Required
            </span>
          </div>

          <div className="overflow-x-auto">
            {tenantRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No interest requests received yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/50 dark:bg-slate-900/40 uppercase text-slate-400 text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Tenant</th>
                    <th className="p-4">Property</th>
                    <th className="p-4">Intro Note</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/20 font-medium">
                  {tenantRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-100/5 transition-colors">
                      <td className="p-4 flex items-center gap-2">
                        <img src={req.tenantAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.tenantName}`} alt={req.tenantName} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <div className="font-bold">{req.tenantName}</div>
                        </div>
                      </td>
                      <td className="p-4 font-bold">{req.listing?.title || 'Property'}</td>
                      <td className="p-4 max-w-xs truncate text-slate-500 dark:text-slate-400 italic">"{req.message}"</td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase font-bold tracking-wider rounded px-2 py-0.5 ${
                          req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' :
                          req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {req.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStatus(req._id, 'accepted')}
                              className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                              title="Accept & Start Chat"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req._id, 'rejected')}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              title="Decline Request"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          req.status === 'accepted' && (
                            <button
                              onClick={() => window.location.href = '/chat'}
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Chat</span>
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Listings Moderation List */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/40 dark:border-slate-800/40">
          <div className="p-5 border-b border-slate-200/10 dark:border-slate-800/30 font-bold text-sm tracking-wide uppercase text-slate-400">
            My Rooms Listed
          </div>
          
          <div className="overflow-x-auto">
            {myListings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                You have not listed any properties. Click "Create Listing" at the top to add a room!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/50 dark:bg-slate-900/40 uppercase text-slate-400 text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Title</th>
                    <th className="p-4">Rent</th>
                    <th className="p-4">Room Type</th>
                    <th className="p-4">Listing Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/20 font-medium">
                  {myListings.map((listing) => (
                    <tr key={listing._id} className="hover:bg-slate-100/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white">{listing.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{listing.location}</div>
                      </td>
                      <td className="p-4 font-bold">${listing.rent}/mo</td>
                      <td className="p-4 capitalize">{listing.roomType}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFilled(listing._id, !listing.isFilled)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            listing.isFilled
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/25'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/25'
                          }`}
                        >
                          {listing.isFilled ? 'Mark as Open' : 'Mark as Filled'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2.5">
                        <button
                          onClick={() => openEditModal(listing)}
                          className="text-xs text-blue-500 hover:text-blue-600 inline-flex items-center gap-0.5"
                          title="Edit Listing"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing._id)}
                          className="text-xs text-red-500 hover:text-red-600 inline-flex items-center gap-0.5"
                          title="Delete Listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* CREATE LISTING MODAL DIALOG */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#F8FAFC] dark:bg-[#0B0F19] w-full max-w-xl rounded-2xl p-6 shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/10 dark:border-slate-800/30">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">Post Room Listing</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="my-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateListing} className="space-y-4 overflow-y-auto flex-grow pr-1 pt-3 text-xs">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Listing Title *</label>
                  <input type="text" placeholder="e.g. Cozy Private Room in Downtown Loft" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Rent */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Monthly Rent ($) *</label>
                    <input type="number" placeholder="e.g. 850" value={rent} onChange={e => setRent(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                  </div>
                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Location / Suburb *</label>
                    <input type="text" placeholder="e.g. Downtown" value={location} onChange={e => setLocation(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Room Type */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Room Configuration</label>
                    <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none focus:border-blue-500 dark:text-white">
                      <option value="private room">Private Room</option>
                      <option value="shared room">Shared Room</option>
                      <option value="entire flat">Entire Flat</option>
                    </select>
                  </div>
                  {/* Furnished Status */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Furnishing</label>
                    <select value={furnishedStatus} onChange={e => setFurnishedStatus(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none focus:border-blue-500 dark:text-white">
                      <option value="furnished">Furnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Move-in Date */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Availability Date *</label>
                    <input type="text" placeholder="e.g. Aug 1, 2026" value={moveInDate} onChange={e => setMoveInDate(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                  </div>
                  {/* Gender preference */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gender Preference</label>
                    <select value={genderPreference} onChange={e => setGenderPreference(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none focus:border-blue-500 dark:text-white">
                      <option value="Any">Any Gender</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                      <option value="mix">Mix Flat</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Description *</label>
                  <textarea rows={3} placeholder="Describe room size, flatmate vibes, utility bills..." value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                </div>

                {/* Images Upload */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Room Pictures</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setImages(prev => [...prev, reader.result as string]);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600/20 cursor-pointer"
                  />
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200/30">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-650"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Amenities List</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. WiFi, Parking, Gym" value={tempAmenity} onChange={e => setTempAmenity(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAmenity(); } }} className="flex-grow border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none" />
                    <button type="button" onClick={handleAddAmenity} className="px-4 bg-slate-200 dark:bg-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-bold uppercase text-[10px]">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {amenities.map(a => (
                      <span key={a} onClick={() => handleRemoveAmenity(a)} className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md px-2 py-0.5 cursor-pointer hover:bg-red-500/15 hover:text-red-500 hover:border-red-500/20 transition-all font-semibold capitalize">
                        {a} ×
                      </span>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={formLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg mt-3 uppercase tracking-wider">
                  {formLoading ? 'Submitting...' : 'Post Listing'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT LISTING MODAL DIALOG */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#F8FAFC] dark:bg-[#0B0F19] w-full max-w-xl rounded-2xl p-6 shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/10 dark:border-slate-800/30">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">Update Listing</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="my-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleEditListingSubmit} className="space-y-4 overflow-y-auto flex-grow pr-1 pt-3 text-xs">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Listing Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Rent */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Monthly Rent ($) *</label>
                    <input type="number" value={rent} onChange={e => setRent(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                  </div>
                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Location / Suburb *</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Room Type */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Room Configuration</label>
                    <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none focus:border-blue-500 dark:text-white">
                      <option value="private room">Private Room</option>
                      <option value="shared room">Shared Room</option>
                      <option value="entire flat">Entire Flat</option>
                    </select>
                  </div>
                  {/* Furnished Status */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Furnishing</label>
                    <select value={furnishedStatus} onChange={e => setFurnishedStatus(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none focus:border-blue-500 dark:text-white">
                      <option value="furnished">Furnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Move-in Date */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Availability Date *</label>
                    <input type="text" value={moveInDate} onChange={e => setMoveInDate(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                  </div>
                  {/* Gender preference */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gender Preference</label>
                    <select value={genderPreference} onChange={e => setGenderPreference(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 focus:outline-none focus:border-blue-500 dark:text-white">
                      <option value="Any">Any Gender</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                      <option value="mix">Mix Flat</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Description *</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white" required />
                </div>

                {/* Images Upload */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Room Pictures</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setImages(prev => [...prev, reader.result as string]);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600/20 cursor-pointer"
                  />
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200/30">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-650"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Amenities List</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. WiFi, Parking, Gym" value={tempAmenity} onChange={e => setTempAmenity(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAmenity(); } }} className="flex-grow border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-2 rounded-xl focus:outline-none" />
                    <button type="button" onClick={handleAddAmenity} className="px-4 bg-slate-200 dark:bg-slate-800 rounded-xl hover:bg-slate-300 transition-colors font-bold uppercase text-[10px]">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {amenities.map(a => (
                      <span key={a} onClick={() => handleRemoveAmenity(a)} className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md px-2 py-0.5 cursor-pointer hover:bg-red-500/15 hover:text-red-500 hover:border-red-500/20 transition-all font-semibold capitalize">
                        {a} ×
                      </span>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={formLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg mt-3 uppercase tracking-wider">
                  {formLoading ? 'Saving Changes...' : 'Update Listing'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingAssistant />
      <Footer />
    </div>
  );
}
