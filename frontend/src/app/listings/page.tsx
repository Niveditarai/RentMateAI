'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import InteractiveMap from '@/components/InteractiveMap';
import QuickViewModal from '@/components/QuickViewModal';
import { listingsApi } from '@/services/api';
import { Search, SlidersHorizontal, Map, Grid, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState(2500);
  const [roomType, setRoomType] = useState('Any');
  const [furnishedStatus, setFurnishedStatus] = useState('Any');
  const [genderPreference, setGenderPreference] = useState('Any');
  const [sortBy, setSortBy] = useState('newest');

  // Interactive Map / Quick View States
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [quickViewListing, setQuickViewListing] = useState<any | null>(null);
  const [mobileShowMap, setMobileShowMap] = useState(false);

  // Fetch Listings
  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await listingsApi.getAll();
      setListings(data);
      setFilteredListings(data);
    } catch (e) {
      console.error('Failed to load listings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Filter logic on front-end (or triggers reload, but front-end makes it instant and beautiful!)
  useEffect(() => {
    let result = [...listings];

    // Filter by location
    if (location) {
      const locLower = location.toLowerCase();
      result = result.filter(l => l.location.toLowerCase().includes(locLower) || l.title.toLowerCase().includes(locLower));
    }

    // Filter by budget
    result = result.filter(l => l.rent <= budget);

    // Filter by Room Type
    if (roomType !== 'Any') {
      result = result.filter(l => l.roomType === roomType);
    }

    // Filter by Furnished
    if (furnishedStatus !== 'Any') {
      result = result.filter(l => l.furnishedStatus === furnishedStatus);
    }

    // Filter by Gender
    if (genderPreference !== 'Any') {
      result = result.filter(l => l.genderPreference === genderPreference);
    }

    // Sort listings
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'rent_low_high') {
      result.sort((a, b) => a.rent - b.rent);
    } else if (sortBy === 'rent_high_low') {
      result.sort((a, b) => b.rent - a.rent);
    }

    setFilteredListings(result);
  }, [location, budget, roomType, furnishedStatus, genderPreference, sortBy, listings]);

  const handleResetFilters = () => {
    setLocation('');
    setBudget(2500);
    setRoomType('Any');
    setFurnishedStatus('Any');
    setGenderPreference('Any');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] relative">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Toggle between Grid/Map on Mobile */}
        <div className="lg:hidden flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setMobileShowMap(false)}
            className={`w-1/2 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold ${!mobileShowMap ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'}`}
          >
            <Grid className="h-4 w-4" />
            <span>List Grid</span>
          </button>
          <button
            onClick={() => setMobileShowMap(true)}
            className={`w-1/2 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold ${mobileShowMap ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'}`}
          >
            <Map className="h-4 w-4" />
            <span>Visual Map</span>
          </button>
        </div>

        {/* Sidebar Filter Panel */}
        <aside className="w-full lg:w-72 glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 self-start flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/10 dark:border-slate-800/30">
            <div className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight">
              <SlidersHorizontal className="h-4.5 w-4.5 text-blue-500" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[10px] uppercase font-bold text-blue-500 hover:underline flex items-center gap-0.5"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Location Keyword */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Downtown, Westside..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl text-xs focus:outline-none focus:border-blue-500 dark:text-white"
              />
            </div>
          </div>

          {/* Budget Range Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <span>Max Rent</span>
              <span className="text-blue-500 font-extrabold text-xs">${budget}/mo</span>
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

          {/* Room Type select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Room Configuration</label>
            <select
              value={roomType}
              onChange={e => setRoomType(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 text-xs focus:outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="Any">Any Type</option>
              <option value="private room">Private Room</option>
              <option value="shared room">Shared Room</option>
              <option value="entire flat">Entire Flat</option>
            </select>
          </div>

          {/* Furnishing Status select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Furnishing</label>
            <select
              value={furnishedStatus}
              onChange={e => setFurnishedStatus(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 text-xs focus:outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="Any">Any Status</option>
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Gender Preference select */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender Preference</label>
            <select
              value={genderPreference}
              onChange={e => setGenderPreference(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 text-xs focus:outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="Any">Any Gender</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
              <option value="mix">Mix Flat</option>
            </select>
          </div>

          {/* Sort selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/60 rounded-xl p-2 text-xs focus:outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="rent_low_high">Rent: Low to High</option>
              <option value="rent_high_low">Rent: High to Low</option>
            </select>
          </div>

        </aside>

        {/* Listings Display Grid */}
        <section className={`flex-grow flex flex-col gap-6 ${mobileShowMap ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Found {filteredListings.length} matching room{filteredListings.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-80 w-full rounded-2xl glass-panel shimmer-bg opacity-30" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
              <div className="text-3xl">📭</div>
              <h3 className="font-bold text-lg">No Listings Match Filters</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Adjust your sliders, locations, or clear filters to discover more premium co-living rentals.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredListings.map(listing => (
                <div
                  key={listing._id}
                  onMouseEnter={() => setActiveListingId(listing._id)}
                  onMouseLeave={() => setActiveListingId(null)}
                  className="h-full"
                >
                  <ListingCard
                    listing={listing}
                    onQuickView={l => setQuickViewListing(l)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Map View Panel */}
        <section className={`w-full lg:w-96 h-[300px] lg:h-[500px] shrink-0 sticky top-20 z-10 ${!mobileShowMap ? 'hidden lg:block' : 'block'}`}>
          <InteractiveMap
            listings={filteredListings}
            activeListingId={activeListingId}
            onSelectListing={id => {
              setActiveListingId(id);
              const found = filteredListings.find(l => l._id === id);
              if (found) setQuickViewListing(found);
            }}
          />
        </section>

      </main>

      {/* Quick View Modal */}
      {quickViewListing && (
        <QuickViewModal
          listing={quickViewListing}
          onClose={() => setQuickViewListing(null)}
        />
      )}

      <Footer />
    </div>
  );
}
