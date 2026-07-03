'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAssistant from '@/components/FloatingAssistant';
import { listingsApi } from '@/services/api';
import { Sparkles, MessageSquare, Shield, ArrowRight, Star, Heart, CheckCircle2, ChevronRight, Activity, Calendar, MapPin, Users, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetVal, setBudgetVal] = useState(1500);
  const [demoScore, setDemoScore] = useState(85);

  // Load featured listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await listingsApi.getAll();
        setFeaturedListings(data.slice(0, 3));
      } catch (e) {
        console.error('Error loading featured listings', e);
      }
    };
    fetchListings();
  }, []);

  // Update demo score interactively
  useEffect(() => {
    // Basic fun calculation: score depends on budget slider value
    const baseScore = 60;
    const offset = Math.min(40, Math.round((budgetVal / 2000) * 40));
    setDemoScore(baseScore + offset);
  }, [budgetVal]);

  const testimonials = [
    {
      name: "Sophia Chen",
      role: "Tenant",
      text: "RentMate AI found me a private room under my $1000 budget in Downtown, and matched me with a flatmate who shares my hobby for hiking and clean layouts. A 92% match score that actually worked!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      name: "Marcus Brodie",
      role: "Property Owner",
      text: "As a landlord, managing applications used to be a nightmare. Now RentMate screens applicants for compatibility, and I can accept interest in one click. Room was filled in 3 days!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 z-10">
        {/* Glow Spots */}
        <div className="glow-spot top-1/4 left-1/10" />
        <div className="glow-spot top-1/2 right-1/10" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0) 70%)' }} />

        {/* Text Area */}
        <div className="w-full md:w-1/2 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Roommate Matcher</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05]"
          >
            Find the Perfect Room. <br />
            Find the Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">Flatmate.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-base max-w-lg leading-relaxed"
          >
            RentMate AI matches renters with landlords and compatible flatmates based on real-time budget, lifestyle, location, and move-in criteria. Beautiful, simple, and secured by JWT profiles.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <input
              type="text"
              placeholder="Search locations e.g. Downtown..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md focus:border-transparent dark:text-white"
            />
            <button
              onClick={() => window.location.href = `/listings?location=${encodeURIComponent(searchQuery)}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/45 transition-all text-sm flex items-center justify-center gap-1 btn-ripple"
            >
              <span>Explore</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        </div>

        {/* Hero Interactive visual illustration */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="glass-panel p-6 rounded-2xl w-full max-w-md relative shadow-xl border border-slate-200/40 dark:border-slate-800/40"
          >
            {/* Top match header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/10 dark:border-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-semibold text-slate-400">Match Analyzer</span>
              </div>
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>

            {/* Match Circle */}
            <div className="py-6 flex flex-col items-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="6" fill="transparent" />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-blue-500"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={339.29}
                    animate={{ strokeDashoffset: 339.29 - (339.29 * demoScore) / 100 }}
                    transition={{ type: 'spring', damping: 20 }}
                  />
                </svg>
                <div className="text-center">
                  <span className="text-3xl font-black tracking-tight">{demoScore}%</span>
                  <span className="block text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
                </div>
              </div>

              {/* Slider simulation */}
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Simulate Budget</span>
                  <span>${budgetVal}/mo</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="50"
                  value={budgetVal}
                  onChange={e => setBudgetVal(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-slate-100/50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/20 text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-center font-medium">
              "Based on budget criteria, your compatibility match score calculates at {demoScore}%. Adjust slider above to simulate!"
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="bg-slate-100/40 dark:bg-[#070b13] border-y border-slate-200/10 dark:border-slate-800/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-blue-500">98%</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Success Matches</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-cyan-500">12k+</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verified Rooms</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-indigo-500">50k+</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Tenants</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-emerald-500">0.8s</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Match Latency</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Simplifying Co-living</span>
          <h2 className="text-3xl font-bold tracking-tight">How RentMate Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/20 text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">1. Create Your Profile</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Register as a Tenant, Landlord, or Admin. Define your monthly budget, preferred location, and flatmate specifications.
            </p>
          </div>
          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/20 text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">2. AI Matches & Ranks</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Our Compatibility Engine computes instant rankings using Gemini API prompts. Review explanation tags for every listing.
            </p>
          </div>
          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/20 text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">3. Connect & Move In</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Express interest in room listings. When the owner accepts, a real-time messaging channel launches automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 bg-slate-100/30 dark:bg-[#070b13] border-y border-slate-200/10 dark:border-slate-800/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Handpicked Choices</span>
              <h2 className="text-3xl font-bold tracking-tight">Featured Listings</h2>
            </div>
            <Link href="/listings" className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
              <span>View All Listings</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredListings.length === 0 ? (
              // Loading skeletons
              [1, 2, 3].map(i => (
                <div key={i} className="h-80 w-full rounded-2xl glass-panel shimmer-bg opacity-40" />
              ))
            ) : (
              featuredListings.map(listing => (
                <div key={listing._id} className="h-full">
                  {/* Basic card shell for listing */}
                  <div className="glass-panel rounded-2xl overflow-hidden shadow-sm relative group flex flex-col h-full border border-slate-200/40 dark:border-slate-800/40">
                    <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-lg px-2.5 py-1 font-bold text-xs">
                        ${listing.rent}/mo
                      </div>
                    </div>
                    <div className="p-4 space-y-2.5 flex flex-col flex-grow">
                      <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-white line-clamp-1">{listing.title}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        <span>{listing.location}</span>
                      </div>
                      <div className="flex-grow" />
                      <button
                        onClick={() => window.location.href = `/listings/${listing._id}`}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md btn-ripple"
                      >
                        View Room
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Real Success Stories</span>
          <h2 className="text-3xl font-bold tracking-tight">Trust by Thousands</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((test, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-200/20 text-left flex flex-col md:flex-row gap-4 items-start">
              <img src={test.avatar} alt={test.name} className="w-14 h-14 rounded-full border border-blue-500 object-cover flex-shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs italic leading-relaxed">"{test.text}"</p>
                <div className="font-bold text-xs">{test.name} <span className="text-slate-400 font-medium font-sans">({test.role})</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-100/30 dark:bg-[#070b13] border-y border-slate-200/10 dark:border-slate-800/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">FAQ Desk</span>
            <h2 className="text-3xl font-bold tracking-tight">Got Questions?</h2>
          </div>

          <div className="text-left space-y-4">
            <div className="glass-panel p-5 rounded-xl">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-2">Is the AI compatibility calculation secure?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Absolutely. Compatibility evaluations are performed locally or securely relayed to the Gemini API without exposing credentials or payment logs. The result is calculated instantly.
              </p>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-2">What if I do not connect a MongoDB server?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                RentMate AI features an integrated database fallback service. It will spin up local JSON file persistence logs, so the application runs offline automatically!
              </p>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-2">How does the real-time chat sync?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We leverage WebSockets (Socket.io Client) for real-time messaging, typing indicators, and read states. Messages are saved in database collections for historical queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating AI chat assistant */}
      <FloatingAssistant />

      <Footer />
    </div>
  );
}
