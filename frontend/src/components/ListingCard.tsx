'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { aiApi } from '@/services/api';
import { Heart, Calendar, MapPin, Sparkles, Eye, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Listing {
  _id: string;
  id: string;
  title: string;
  description: string;
  rent: number;
  location: string;
  images: string[];
  roomType: string;
  furnishedStatus: string;
  amenities: string[];
  moveInDate: string;
  genderPreference: string;
  ownerId: string;
}

interface ListingCardProps {
  listing: Listing;
  onQuickView: (listing: Listing) => void;
}

export default function ListingCard({ listing, onQuickView }: ListingCardProps) {
  const { user } = useAuth();
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Load compatibility score if tenant is logged in
  useEffect(() => {
    const fetchScore = async () => {
      if (!user || user.role !== 'tenant') return;
      setLoadingMatch(true);
      try {
        const scoreData = await aiApi.getCompatibility(listing._id);
        setMatchScore(scoreData.score);
      } catch (e) {
        console.error('Error fetching compatibility in Card', e);
      } finally {
        setLoadingMatch(false);
      }
    };
    fetchScore();
  }, [user, listing]);

  // Load wishlist from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wishlist = JSON.parse(localStorage.getItem('rentmate_wishlist') || '[]');
      setIsFavorited(wishlist.includes(listing._id));
    }
  }, [listing]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const wishlist = JSON.parse(localStorage.getItem('rentmate_wishlist') || '[]');
    let updated;
    if (isFavorited) {
      updated = wishlist.filter((id: string) => id !== listing._id);
    } else {
      updated = [...wishlist, listing._id];
    }
    localStorage.setItem('rentmate_wishlist', JSON.stringify(updated));
    setIsFavorited(!isFavorited);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/20';
    if (score >= 60) return 'text-amber-500 border-amber-500/20';
    return 'text-rose-500 border-rose-500/20';
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-panel rounded-2xl overflow-hidden shadow-sm relative group flex flex-col h-full border border-slate-200/40 dark:border-slate-800/40"
    >
      {/* Image & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={listing.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Favorite Button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/45 backdrop-blur-md text-white hover:bg-slate-900/80 transition-colors z-10"
        >
          <Heart className={`h-4.5 w-4.5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {/* AI match circle badge */}
        {user?.role === 'tenant' && matchScore !== null && (
          <div className="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-slate-700/50 shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-wider">{matchScore}% Match</span>
          </div>
        )}

        {/* Listing rent badge */}
        <div className="absolute bottom-3 left-3 bg-blue-600/90 text-white rounded-lg px-2.5 py-1 font-bold text-sm tracking-wide">
          ${listing.rent}<span className="text-[10px] font-normal">/mo</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow space-y-3">
        {/* Title */}
        <h3 className="font-bold text-base tracking-tight text-slate-800 dark:text-white line-clamp-1">
          {listing.title}
        </h3>

        {/* Details row */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span className="truncate">{listing.location}</span>
          </span>
          <span className="flex items-center gap-1 justify-end">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>{listing.moveInDate}</span>
          </span>
          <span className="flex items-center gap-1">
            <Home className="h-3.5 w-3.5 text-cyan-500" />
            <span className="capitalize">{listing.roomType}</span>
          </span>
          <span className="text-right capitalize text-blue-500 font-medium">
            {listing.furnishedStatus}
          </span>
        </div>

        {/* Amenities Row */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5">
            {listing.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md capitalize font-medium">
                {amenity}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium flex items-center">
                +{listing.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Actions Row */}
        <div className="pt-4 border-t border-slate-200/10 dark:border-slate-800/30 flex gap-2">
          <button
            onClick={() => onQuickView(listing)}
            className="w-full flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-semibold py-2 rounded-xl transition-colors btn-ripple"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Quick View</span>
          </button>
          
          <button
            onClick={() => window.location.href = `/listings/${listing._id}`}
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 btn-ripple"
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
