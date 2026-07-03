'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Compass, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface Listing {
  _id: string;
  title: string;
  rent: number;
  location: string;
}

interface MapProps {
  listings: Listing[];
  activeListingId?: string | null;
  onSelectListing?: (id: string) => void;
}

export default function InteractiveMap({ listings, activeListingId, onSelectListing }: MapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Generate deterministic coordinates for mock pins based on listing ID or name
  const getCoordinates = (id: string, title: string) => {
    let hash = 0;
    const key = id + title;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Limit to coordinates inside our 400x300 canvas box, leaving padding
    const x = 50 + Math.abs((hash * 31) % 300);
    const y = 50 + Math.abs((hash * 17) % 200);
    return { x, y };
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden glass-panel border border-slate-200/40 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-950 flex flex-col">
      
      {/* Map Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/30 shadow-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/30 shadow-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* Compass / Location HUD */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/30 shadow-md text-xs font-semibold text-slate-500">
        <Compass className="h-4 w-4 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
        <span>Map HUD Active</span>
      </div>

      {/* Canvas Map Wrapper */}
      <div className="flex-grow w-full relative overflow-hidden flex items-center justify-center p-8">
        <motion.div
          animate={{ scale: zoomLevel }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-[400px] h-[300px] relative rounded-xl border border-slate-300/20 dark:border-slate-800/40 bg-slate-100 dark:bg-[#0f1422] shadow-inner overflow-hidden flex-shrink-0"
        >
          {/* Mock Map Vector Grid/Illustration */}
          <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Draw water body */}
            <path d="M 0,250 C 100,220 200,280 400,240 L 400,300 L 0,300 Z" fill="#2563EB" opacity="0.3" />
            {/* Draw park */}
            <rect x="220" y="40" width="80" height="60" rx="10" fill="#22C55E" opacity="0.25" />
            <text x="240" y="75" className="text-[9px] fill-emerald-600 dark:fill-emerald-400 font-bold opacity-60">CENTRAL PARK</text>
            {/* Main roads */}
            <line x1="0" y1="150" x2="400" y2="150" stroke="currentColor" strokeWidth="6" opacity="0.5" />
            <line x1="180" y1="0" x2="180" y2="300" stroke="currentColor" strokeWidth="6" opacity="0.5" />
            <text x="10" y="145" className="text-[7px] tracking-widest opacity-60">BROADWAY ST</text>
            <text x="185" y="290" className="text-[7px] tracking-widest opacity-60 rotate-90 origin-bottom-left">5TH AVE</text>
          </svg>

          {/* Interactive Map Pins */}
          {listings.map(listing => {
            const { x, y } = getCoordinates(listing._id, listing.title);
            const isActive = activeListingId === listing._id;

            return (
              <div
                key={listing._id}
                style={{ left: `${x}px`, top: `${y}px` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin"
                onClick={() => onSelectListing && onSelectListing(listing._id)}
              >
                {/* Active Pulse rings */}
                {isActive && (
                  <span className="absolute -inset-2.5 bg-blue-500/30 rounded-full animate-ping" />
                )}

                {/* Map Pin Point */}
                <motion.div
                  animate={{ y: isActive ? -5 : 0 }}
                  className={`p-1.5 rounded-full shadow-lg border relative flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-blue-600 border-blue-400 text-white z-30 scale-110'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-500 hover:border-blue-500 hover:scale-105'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </motion.div>

                {/* Mini rent popup indicator */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 py-0.5 px-1.5 rounded bg-slate-900 text-white text-[9px] font-bold shadow-md opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none whitespace-nowrap ${isActive ? 'opacity-100 bg-blue-600 scale-105' : ''}`}>
                  ${listing.rent}/mo
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Map Legend */}
      <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200/20 text-[10px] text-slate-400 flex justify-between items-center">
        <span className="flex items-center gap-1">
          <Navigation className="h-3 w-3 text-blue-500" />
          <span>Interactive Vector Layout (Mock Google Map)</span>
        </span>
        <span>Map Scale: 1:5,000</span>
      </div>
    </div>
  );
}
