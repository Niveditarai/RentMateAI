'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAssistant from '@/components/FloatingAssistant';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, interestsApi, aiApi } from '@/services/api';
import { MapPin, Calendar, Home, CheckCircle2, ChevronLeft, Sparkles, MessageSquare, Heart, RefreshCw, Send, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListingDetailsPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  // Loading / Detail States
  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Matching States
  const [compatibility, setCompatibility] = useState<any | null>(null);
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);

  // Interest Action States
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [interestStatus, setInterestStatus] = useState<string | null>(null);
  const [interestMsg, setInterestMsg] = useState("Hey! I'm interested in renting this room. I find it compatible with my preferences.");
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);

  // Wishlist
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch listing details
  const fetchListingData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listingsApi.getById(id);
      setListing(data);

      // Check if user has already expressed interest
      if (user && user.role === 'tenant') {
        const interests = await interestsApi.getAll();
        const found = interests.find((i: any) => i.listingId === id);
        if (found) {
          setHasExpressedInterest(true);
          setInterestStatus(found.status);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Listing not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListingData();
  }, [id, user]);

  // Fetch compatibility score
  useEffect(() => {
    const fetchCompatibility = async () => {
      if (!listing || !user || user.role !== 'tenant') return;
      setLoadingCompatibility(true);
      try {
        const compData = await aiApi.getCompatibility(listing._id);
        setCompatibility(compData);
      } catch (e) {
        console.error('Error fetching compatibility details', e);
      } finally {
        setLoadingCompatibility(false);
      }
    };
    fetchCompatibility();
  }, [listing, user]);

  // Wishlist configuration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wishlist = JSON.parse(localStorage.getItem('rentmate_wishlist') || '[]');
      setIsFavorited(wishlist.includes(id));
    }
  }, [id]);

  const toggleWishlist = () => {
    if (typeof window === 'undefined') return;
    const wishlist = JSON.parse(localStorage.getItem('rentmate_wishlist') || '[]');
    let updated;
    if (isFavorited) {
      updated = wishlist.filter((item: string) => item !== id);
    } else {
      updated = [...wishlist, id];
    }
    localStorage.setItem('rentmate_wishlist', JSON.stringify(updated));
    setIsFavorited(!isFavorited);
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInterest(true);
    try {
      const res = await interestsApi.express(listing._id, interestMsg);
      setHasExpressedInterest(true);
      setInterestStatus('pending');
      setShowInterestModal(false);
      
      // Celebrate with premium confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2563EB', '#06B6D4', '#22C55E']
      });
      alert(res.message || 'Interest expressed successfully!');
    } catch (err: any) {
      alert(err.message || 'Error expressing interest.');
    } finally {
      setSubmittingInterest(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Listing Profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 text-center p-4">
          <div className="text-4xl">⚠️</div>
          <h3 className="font-bold text-lg">Listing Unavailable</h3>
          <p className="text-xs text-slate-400 max-w-sm">{error || 'This listing has been deleted or archived.'}</p>
          <button onClick={() => router.push('/listings')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors">
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] relative">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 z-10 space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => router.push('/listings')}
          className="flex items-center gap-1 text-xs text-slate-400 font-bold hover:text-blue-500 transition-colors uppercase tracking-wider"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to marketplace</span>
        </button>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl overflow-hidden shadow-md max-h-[450px]">
          <div className="md:col-span-2 h-[300px] md:h-[450px] relative bg-slate-900">
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            <button
              onClick={toggleWishlist}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-900/95 transition-colors"
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
          </div>
          <div className="hidden md:flex flex-col gap-4 h-[450px] overflow-hidden">
            <div className="h-1/2 bg-slate-900 overflow-hidden relative">
              <img src={listing.images[1] || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'} alt={listing.title} className="w-full h-full object-cover" />
            </div>
            <div className="h-1/2 bg-slate-900 overflow-hidden relative">
              <img src={listing.images[2] || 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80'} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Info Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-500/10 text-blue-500 font-bold rounded px-2.5 py-0.5 uppercase tracking-wider">
                  {listing.roomType}
                </span>
                <span className="text-[10px] bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold rounded px-2.5 py-0.5 uppercase tracking-wider">
                  {listing.furnishedStatus}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{listing.title}</h2>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>{listing.location}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span>Available: {listing.moveInDate}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Home className="h-4 w-4 text-cyan-500" />
                  <span className="capitalize">Gender: {listing.genderPreference} Preference</span>
                </span>
              </div>

              <hr className="border-slate-200/10 dark:border-slate-800/30" />

              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">About This Room</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              <hr className="border-slate-200/10 dark:border-slate-800/30" />

              {/* Amenities Grid */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Amenities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.amenities?.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Compatibility Dashboard Panel (Only for Tenant role) */}
            {user?.role === 'tenant' && (
              <div className="glass-panel p-6 rounded-2xl border border-blue-500/20 shadow-md relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                {/* Glow bar */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 to-cyan-400" />
                
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-blue-500/10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">RentMate AI compatibility score</h3>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                    Gemini Screened
                  </span>
                </div>

                {loadingCompatibility ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Calculating compatibility...</span>
                  </div>
                ) : compatibility ? (
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    
                    {/* Circle Gauge */}
                    <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="62" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="6" fill="transparent" />
                        <motion.circle
                          cx="72"
                          cy="72"
                          r="62"
                          className={getScoreColor(compatibility.score)}
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={389.56}
                          initial={{ strokeDashoffset: 389.56 }}
                          animate={{ strokeDashoffset: 389.56 - (389.56 * compatibility.score) / 100 }}
                          transition={{ duration: 1 }}
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-3xl font-black tracking-tight">{compatibility.score}%</span>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">Compatibility</span>
                      </div>
                    </div>

                    {/* Breakdown & Explanation */}
                    <div className="flex-grow space-y-4 text-xs">
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{compatibility.explanation}"
                      </p>

                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Parameters breakdown</span>
                        
                        {/* Budget Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                            <span>Rent Fit</span>
                            <span>{compatibility.breakdown?.budget || 0}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${compatibility.breakdown?.budget || 0}%` }} />
                          </div>
                        </div>

                        {/* Location Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                            <span>Location Alignment</span>
                            <span>{compatibility.breakdown?.location || 0}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500" style={{ width: `${compatibility.breakdown?.location || 0}%` }} />
                          </div>
                        </div>

                        {/* Room Type Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                            <span>Room Configuration</span>
                            <span>{compatibility.breakdown?.roomType || 0}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${compatibility.breakdown?.roomType || 0}%` }} />
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    No compatibility score calculated. Adjust your preferences profile to update.
                  </div>
                )}
              </div>
            )}

            {/* Review Section mockup */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">Reviews & Verification</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">Dave K.</span>
                    <span className="text-slate-400">June 2026</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Great clean space. The owner was extremely communicative and helped with move-in logistics. Highly recommended!
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Action card */}
          <div className="space-y-6">
            
            {/* Rent & Request Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-5">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pricing</span>
                <div className="text-3xl font-extrabold tracking-tight">
                  ${listing.rent}<span className="text-sm font-normal text-slate-400">/month</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs py-2 border-y border-slate-200/10 dark:border-slate-800/30">
                <span className="text-slate-400">Status</span>
                <span className={`font-bold capitalize ${listing.isFilled ? 'text-red-500' : 'text-emerald-500'}`}>
                  {listing.isFilled ? 'FILLED (Closed)' : 'OPEN (Accepting)'}
                </span>
              </div>

              {user ? (
                user.role === 'tenant' ? (
                  !listing.isFilled ? (
                    hasExpressedInterest ? (
                      <div className="space-y-3">
                        <div className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider">
                          <Check className="h-4.5 w-4.5" />
                          <span>Interest Expressed ({interestStatus})</span>
                        </div>
                        {interestStatus === 'accepted' && (
                          <button
                            onClick={() => router.push('/chat')}
                            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md btn-ripple uppercase tracking-wider"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>Go to chat room</span>
                          </button>
                        )}
                        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                          Your application has been logged. {interestStatus === 'pending' ? 'Wait for owner approval to open chats.' : 'Start messaging now!'}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowInterestModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/45 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1 btn-ripple"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Express Interest</span>
                      </button>
                    )
                  ) : (
                    <div className="w-full text-center py-2.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl uppercase tracking-wider">
                      Listing Closed
                    </div>
                  )
                ) : (
                  // Owner or Admin
                  <div className="space-y-2.5">
                    <button
                      onClick={() => {
                        if (user.role === 'owner' && user.id === listing.ownerId) {
                          router.push('/owner/dashboard');
                        } else if (user.role === 'admin') {
                          router.push('/admin/dashboard');
                        } else {
                          alert('This listing belongs to another landlord.');
                        }
                      }}
                      className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-700/60 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors dark:text-white"
                    >
                      Manage Listing
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <span>Login to Apply</span>
                </button>
              )}
            </div>

            {/* Owner profile card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Listed By Landlord</span>
              
              <div className="flex items-center gap-3">
                <img
                  src={listing.ownerAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${listing.ownerName}`}
                  alt={listing.ownerName}
                  className="w-11 h-11 rounded-full border border-blue-500 object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">{listing.ownerName}</h4>
                  <div className="flex items-center gap-0.5 text-[10px] text-emerald-500 font-semibold uppercase tracking-widest mt-0.5">
                    <span>Verified Owner</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Express Interest Modal */}
      <AnimatePresence>
        {showInterestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInterestModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#F8FAFC] dark:bg-[#0B0F19] w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10 space-y-4 text-xs"
            >
              <div className="text-center space-y-2">
                <Sparkles className="h-10 w-10 text-blue-500 mx-auto" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Apply to Rent</h3>
                <p className="text-slate-400">Introduce yourself to {listing.ownerName}. A solid note boosts match approval rates!</p>
              </div>

              <form onSubmit={handleInterestSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Application Message</label>
                  <textarea
                    rows={4}
                    value={interestMsg}
                    onChange={e => setInterestMsg(e.target.value)}
                    className="w-full border border-slate-200/30 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/40 p-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white text-xs leading-relaxed"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInterestModal(false)}
                    className="py-2.5 border border-slate-200/30 dark:border-slate-800/60 rounded-xl font-bold uppercase transition-colors text-[10px] tracking-wider text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInterest}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all text-[10px] tracking-wider uppercase flex items-center justify-center gap-1"
                  >
                    {submittingInterest ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
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
