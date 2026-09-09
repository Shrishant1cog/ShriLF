'use client';

import React, { useEffect, useState } from 'react';
import { ProductCard } from '../../../components/cards/ProductCard';
import { fetchApi } from '../../../lib/api';

export default function ExploreMarketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => console.warn('Location permission denied')
      );
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (district) params.append('district', district);
      if (organicOnly) params.append('organic', 'true');
      if (userLocation) {
        params.append('userLat', String(userLocation.lat));
        params.append('userLon', String(userLocation.lon));
        params.append('sortBy', 'nearest');
      }

      const res = await fetchApi(`/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [district, organicOnly, userLocation]);

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Direct Farm Produce</h1>
        <p className="text-stone-600 text-sm mt-1">
          Support local cultivators in Karnataka. Direct farm-to-kitchen transparent pricing.
        </p>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm mb-8 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[280px] flex gap-2">
          <input
            type="text"
            placeholder="Search crops (e.g. Tomato, Ragi, Banana)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
          />
          <button
            onClick={loadProducts}
            className="px-5 py-2.5 bg-emerald-800 text-white font-medium rounded-xl text-sm hover:bg-emerald-900 transition-colors"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
          >
            <option value="">All Districts</option>
            <option value="Mandya">Mandya</option>
            <option value="Mysuru">Mysuru</option>
            <option value="Tumakuru">Tumakuru</option>
            <option value="Dharwad">Dharwad</option>
            <option value="Belagavi">Belagavi</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>

          <label className="flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={organicOnly}
              onChange={(e) => setOrganicOnly(e.target.checked)}
              className="rounded text-emerald-700 focus:ring-emerald-600 h-4 w-4"
            />
            Organic Only
          </label>

          <button
            onClick={requestLocation}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
              userLocation
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
            }`}
          >
            {userLocation ? '📍 Sorted by Distance' : '📍 Enable Distance Sort'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-80 bg-stone-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
          <p className="text-stone-500 text-lg">No harvest listings match your selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}