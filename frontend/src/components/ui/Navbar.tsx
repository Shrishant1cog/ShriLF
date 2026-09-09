'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Leaf, Bell, User, LogOut, MessageSquare, MapPin } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const socket = useSocket();

  useEffect(() => {
    const stored = localStorage.getItem('fc_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on('new_notification', (data: any) => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off('new_notification');
    };
  }, [socket, user]);

  const handleLogout = () => {
    localStorage.removeItem('fc_token');
    localStorage.removeItem('fc_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <header className="bg-emerald-950 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-emerald-400">
          <Leaf className="w-6 h-6 text-emerald-400" />
          <span>FARM<span className="text-white">CONNECT</span></span>
        </a>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-emerald-100">
          <a href="/consumer/explore" className="hover:text-white transition-colors">Marketplace</a>
          <a href="/consumer/map" className="hover:text-white transition-colors flex items-center gap-1">
            <MapPin className="w-4 h-4" /> Near Me
          </a>
          {user?.role === 'FARMER' && (
            <a href="/farmer/dashboard" className="hover:text-white transition-colors">Farmer Hub</a>
          )}
          {user?.role === 'ADMIN' && (
            <a href="/admin/dashboard" className="text-amber-300 hover:text-amber-200 transition-colors">Admin Console</a>
          )}
        </nav>

        {/* User Auth controls */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-full font-bold border border-emerald-700">
                {user.role}
              </span>
              <div className="relative">
                <Bell className="w-5 h-5 text-emerald-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-stone-200 hidden sm:inline">{user.name}</span>
              <button
                onClick={handleLogout}
                className="p-1.5 text-stone-400 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="text-sm font-medium text-emerald-200 hover:text-white transition-colors"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                Register
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}