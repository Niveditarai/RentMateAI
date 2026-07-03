'use client';

import React from 'react';
import { X, MapPin, Calendar, Home, CheckCircle2, Shield, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Listing {
  _id: string;
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
  ownerName: string;
  ownerAvatar?: string;
}

interface QuickViewProps {
  listing: Listing | null;
  onClose: () => void;
}

export default function QuickViewModal({ listing, onClose }: QuickViewProps) {
  if (!listing) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#F8FAFC] dark:bg-[#0B0F19] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200/50 dark:border-slate-800/60 z-10 flex flex-col md:flex-row max-h-[90vh] md:max-h-none"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/65 text-white hover:bg-slate-900/90 z-20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left: Image Carousel / Gallery (Simple) */}
          <div className="w-full md:w-1/2 h-56 md:h-auto relative bg-slate-950 flex-shrink-0">
            <img
              src={listing.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-blue-600 text-white rounded-lg px-2.5 py-1 font-bold text-sm">
              ${listing.rent}/mo
            </div>
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-[500px]">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold rounded-md px-2 py-0.5 w-max mb-2 uppercase tracking-wider">
              {listing.roomType}
            </span>
            
            <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-snug">
              {listing.title}
            </h3>

            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1.5 mb-4">
              <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span>{listing.location}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
              {listing.description}
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="bg-slate-100 dark:bg-slate-800/40 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Furnished</span>
                <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{listing.furnishedStatus}</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/40 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Available From</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{listing.moveInDate}</span>
              </div>
            </div>

            {/* Amenities List */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mb-6">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-2 font-semibold">Amenities</span>
                <div className="flex flex-wrap gap-1">
                  {listing.amenities.slice(0, 4).map((a, idx) => (
                    <span key={idx} className="bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-md capitalize font-medium">
                      {a}
                    </span>
                  ))}
                  {listing.amenities.length > 4 && (
                    <span className="text-[10px] text-slate-400">+{listing.amenities.length - 4} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Bottom Actions */}
            <button
              onClick={() => window.location.href = `/listings/${listing._id}`}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 btn-ripple mt-2"
            >
              View Full Details
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
