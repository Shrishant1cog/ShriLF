'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '../../../lib/api';
import { 
  Sprout, TrendingUp, Eye, MessageSquare, Edit2, 
  Plus, X, Check, Package, UploadCloud, Loader2 
} from 'lucide-react';

// ============================================================================
// 1. TYPESCRIPT INTERFACES (Strict Typing replaces 'any')
// ============================================================================
interface Category { id: string; name: string; }
interface Consumer { name: string; phone: string; }
interface Product {
  id: string; title: string; farmerPrice: number; priceUnit: string;
  quantityAvailable: number; quantityUnit: string; isAvailable: boolean; imageUrl?: string;
}
interface Enquiry { id: string; subject: string; consumer: Consumer; product: { title: string }; }
interface DashboardStats {
  totalProducts: number; availableProducts: number; totalEnquiries: number;
  profileViews: number; totalFavorites: number;
}
interface DashboardData { stats: DashboardStats; products: Product[]; categories: Category[]; recentEnquiries: Enquiry[]; }
interface AddFormState {
  title: string; description: string; categoryId: string; farmerPrice: string;
  priceUnit: string; quantityAvailable: string; quantityUnit: string; isOrganic: boolean; imageUrl: string;
}

// ============================================================================
// 2. REUSABLE SUB-COMPONENTS
// ============================================================================

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: any, colorClass: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4 transition-hover hover:shadow-md">
    <div className={`p-3 rounded-xl ${colorClass}`}><Icon className="w-6 h-6" /></div>
    <div>
      <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-black text-stone-900">{value}</p>
    </div>
  </div>
);

const CropCard = ({ product, onEdit }: { product: Product, onEdit: (p: Product) => void }) => (
  <div className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${!product.isAvailable ? 'border-red-200 opacity-75 grayscale-[20%]' : 'border-stone-200 hover:border-emerald-300'}`}>
    <div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-stone-900 line-clamp-1" title={product.title}>{product.title}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {product.isAvailable ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="flex items-baseline gap-1 mt-3">
        <span className="text-2xl font-black text-emerald-900">₹{product.farmerPrice}</span>
        <span className="text-xs text-stone-500 font-medium">/{product.priceUnit.replace('PER_', '').toLowerCase()}</span>
      </div>
      <p className="text-xs text-stone-500 mt-1 font-medium">Stock: {product.quantityAvailable} {product.quantityUnit}</p>
    </div>
    <button 
      onClick={() => onEdit(product)}
      className="mt-4 w-full py-2 bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border border-stone-200 hover:border-emerald-200"
    >
      <Edit2 className="w-4 h-4" /> Edit Price & Stock
    </button>
  </div>
);

// ============================================================================
// 3. MAIN DASHBOARD COMPONENT
// ============================================================================

export default function FarmerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals & Forms State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetchApi('/dashboard/farmer');
      setData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-emerald-800 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="font-bold tracking-tight text-sm uppercase">Loading Hub...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Farmer Control Hub</h1>
          <p className="text-stone-600 text-sm mt-1">Manage crops, instant stock adjustments, and incoming consumer inquiries.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Add New Harvest
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Active Crops" value={`${data?.stats.availableProducts} / ${data?.stats.totalProducts}`} icon={Sprout} colorClass="bg-emerald-100 text-emerald-800" />
        <StatCard title="Total Enquiries" value={data?.stats.totalEnquiries || 0} icon={MessageSquare} colorClass="bg-blue-100 text-blue-800" />
        <StatCard title="Profile Views" value={data?.stats.profileViews || 0} icon={Eye} colorClass="bg-amber-100 text-amber-800" />
        <StatCard title="Total Favourites" value={data?.stats.totalFavorites || 0} icon={TrendingUp} colorClass="bg-rose-100 text-rose-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Inventory */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" /> Active Inventory & Pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.products.map((prod) => (
              <CropCard key={prod.id} product={prod} onEdit={setEditingProduct} />
            ))}
          </div>
        </div>

        {/* Right Column: Inquiries */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm h-fit sticky top-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-700" /> Consumer Inquiries
          </h2>
          {data?.recentEnquiries.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-stone-400 text-sm font-medium">No active inquiries.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {data?.recentEnquiries.map((enq) => (
                <div key={enq.id} className="py-4 group">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 truncate">{enq.product.title}</p>
                  <h4 className="font-bold text-stone-800 text-sm group-hover:text-emerald-700 transition-colors">{enq.subject}</h4>
                  <p className="text-xs text-stone-500 mt-1">From: <span className="font-medium text-stone-700">{enq.consumer.name}</span></p>
                  <a href={`/consumer/enquiries/${enq.id}`} className="mt-3 inline-block px-4 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors">
                    Open Thread
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Render Modals */}
      {editingProduct && (
        <EditCropModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSuccess={() => { setEditingProduct(null); loadDashboard(); }} 
        />
      )}
      
      {isAddModalOpen && (
        <AddCropModal 
          categories={data?.categories || []} 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => { setIsAddModalOpen(false); loadDashboard(); }} 
        />
      )}
    </div>
  );
}

// ============================================================================
// 4. ISOLATED MODAL COMPONENTS
// ============================================================================

const EditCropModal = ({ product, onClose, onSuccess }: { product: Product, onClose: () => void, onSuccess: () => void }) => {
  const [price, setPrice] = useState(product.farmerPrice.toString());
  const [qty, setQty] = useState(product.quantityAvailable.toString());
  const [isAvailable, setIsAvailable] = useState(product.isAvailable);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi(`/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          farmerPrice: parseFloat(price),
          quantityAvailable: parseFloat(qty),
          isAvailable,
        }),
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-black text-stone-900">Update Harvest</h3>
          <button onClick={onClose} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm font-medium text-emerald-700 mb-6 bg-emerald-50 p-3 rounded-xl border border-emerald-100">{product.title}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Listed Price (₹)</label>
            <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">Stock Available ({product.quantityUnit})</label>
            <input type="number" step="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow" />
          </div>
          <label className="flex items-center gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors">
            <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
            <span className="text-sm font-bold text-stone-800">Available for marketplace discovery</span>
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-4 transition-colors">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save & Broadcast Live</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const AddCropModal = ({ categories, onClose, onSuccess }: { categories: Category[], onClose: () => void, onSuccess: () => void }) => {
  const [form, setForm] = useState<AddFormState>({
    title: '', description: '', categoryId: '', farmerPrice: '', priceUnit: 'PER_KG',
    quantityAvailable: '', quantityUnit: 'KG', isOrganic: false, imageUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('fc_token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) setForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
      else throw new Error(data.message);
    } catch (err) {
      alert('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi('/products', { method: 'POST', body: JSON.stringify(form) });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to list crop');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-stone-900">List New Harvest</h3>
          <button onClick={onClose} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Crop Title</label>
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Native Organic Tomatoes" className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Description</label>
            <textarea required rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow" />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Category</label>
            <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-emerald-600 bg-white cursor-pointer">
              <option value="">Select Category...</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Price Unit</label>
            <select value={form.priceUnit} onChange={e => setForm({...form, priceUnit: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-emerald-600 bg-white cursor-pointer">
              <option value="PER_KG">Per KG</option>
              <option value="PER_DOZEN">Per Dozen</option>
              <option value="PER_QUINTAL">Per Quintal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Price (₹)</label>
            <input type="number" step="0.01" required min="0" value={form.farmerPrice} onChange={e => setForm({...form, farmerPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow" />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Quantity Available</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" required min="0" value={form.quantityAvailable} onChange={e => setForm({...form, quantityAvailable: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-emerald-600 transition-shadow" />
              <select value={form.quantityUnit} onChange={e => setForm({...form, quantityUnit: e.target.value})} className="w-1/3 px-2 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-emerald-600 bg-white cursor-pointer">
                <option value="KG">KG</option>
                <option value="DOZEN">Dzn</option>
                <option value="QUINTAL">Qntl</option>
                <option value="TON">Ton</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-2 mt-2 p-4 bg-stone-50 border border-stone-200 rounded-xl">
            <label className="block text-xs font-bold text-stone-700 uppercase mb-2">Crop Photo</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors text-emerald-700 font-bold text-sm bg-white">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                {isUploading ? <><Loader2 className="w-5 h-5 animate-spin mr-2"/> Uploading...</> : <><UploadCloud className="w-5 h-5 mr-2"/> Browse Image</>}
              </label>
            </div>
            {form.imageUrl && (
              <div className="mt-4 relative w-full h-40 rounded-xl overflow-hidden border border-stone-300 shadow-sm">
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
              <input type="checkbox" checked={form.isOrganic} onChange={e => setForm({...form, isOrganic: e.target.checked})} className="w-5 h-5 text-emerald-700 rounded border-emerald-400 focus:ring-emerald-600" />
              <span className="text-sm font-bold text-emerald-900">This crop is 100% Certified Organic</span>
            </label>
          </div>

          <div className="sm:col-span-2 mt-6 flex gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || isUploading} className="flex-1 py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'List Produce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};