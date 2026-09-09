'use client';

import React, { useState } from 'react';
import { fetchApi } from '../../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('ramesh.mandya@farmconnect.org');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('fc_token', res.data.token);
      localStorage.setItem('fc_user', JSON.stringify(res.data.user));

      if (res.data.user.role === 'FARMER') {
        window.location.href = '/farmer/dashboard';
      } else if (res.data.user.role === 'ADMIN') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/consumer/explore';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200 shadow-xl">
        <h2 className="text-2xl font-black text-stone-900 text-center">Welcome Back</h2>
        <p className="text-sm text-stone-500 text-center mt-1 mb-6">Log in to your FarmConnect profile</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-stone-100">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 text-center">Quick Demo Login Presets</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setEmail('ramesh.mandya@farmconnect.org'); setPassword('Password@123'); }}
              className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
            >
              Farmer
            </button>
            <button
              onClick={() => { setEmail('priya.bengaluru@gmail.com'); setPassword('Password@123'); }}
              className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
            >
              Consumer
            </button>
            <button
              onClick={() => { setEmail('admin@farmconnect.org'); setPassword('Password@123'); }}
              className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}