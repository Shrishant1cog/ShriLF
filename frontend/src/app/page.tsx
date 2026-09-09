import Link from 'next/link';
import { Sprout, ShieldCheck, Zap, ArrowRight, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-emerald-950 text-white py-24 px-4 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-800/60 text-emerald-300 border border-emerald-700">
            <Sprout className="w-4 h-4" /> Karnataka Direct Agri-Bridge
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Direct Farm Produce at <span className="text-emerald-400 underline decoration-emerald-500/50">Farmer Listed Prices</span>
          </h1>
          <p className="text-stone-300 max-w-2xl mx-auto text-base sm:text-lg">
            Empowering cultivators from Mandya, Mysuru, and Dharwad to sell directly to consumers without middleman markups.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/consumer/explore"
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg"
            >
              Browse Live Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/consumer/map"
              className="px-6 py-3.5 bg-emerald-900/60 hover:bg-emerald-900 text-white font-bold rounded-xl border border-emerald-700 transition-colors flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> View Map
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-stone-900">Verified Direct Pricing</h3>
          <p className="text-stone-600 text-sm">
            All prices are explicitly labeled as <b>Farmer Listed Prices</b>, ensuring complete transparency and zero speculative retail inflation.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-stone-900">Instant Real-Time Sync</h3>
          <p className="text-stone-600 text-sm">
            When a farmer adjusts harvest prices or batch availability from the field, marketplace cards update live without page reloads.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-stone-900">Hyper-Local Distance Engine</h3>
          <p className="text-stone-600 text-sm">
            Find the closest organic growers and native ragi, tomato, and banana plantations with client-side OpenStreetMap distance calculations.
          </p>
        </div>
      </section>
    </div>
  );
}