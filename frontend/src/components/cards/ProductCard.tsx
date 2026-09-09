'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    farmerPrice: number;
    priceUnit: string;
    quantityAvailable: number;
    quantityUnit: string;
    isOrganic: boolean;
    imageUrl?: string;
    farmer: {
      farmName: string;
      district: string;
    };
    distanceKm?: number | null;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product: initialData }) => {
  const [product, setProduct] = useState(initialData);
  const [priceFlash, setPriceFlash] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join room for this product
    socket.emit('join_product_room', product.id);

    socket.on('product_updated', (updated: any) => {
      if (updated.productId === product.id) {
        setProduct((prev) => ({
          ...prev,
          farmerPrice: updated.farmerPrice,
          quantityAvailable: updated.quantityAvailable,
        }));
        setPriceFlash(true);
        setTimeout(() => setPriceFlash(false), 2000);
      }
    });

    return () => {
      socket.emit('leave_product_room', product.id);
      socket.off('product_updated');
    };
  }, [socket, product.id]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.isOrganic && (
          <span className="absolute top-3 left-3 bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            100% Certified Organic
          </span>
        )}
        {product.distanceKm !== undefined && product.distanceKm !== null && (
          <span className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
            {product.distanceKm} km away
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            {product.farmer.farmName} • {product.farmer.district}
          </p>
          <h3 className="font-bold text-stone-900 text-lg line-clamp-1">{product.title}</h3>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Farmer Listed Price
              </span>
              <span
                className={`text-2xl font-extrabold transition-colors duration-500 ${
                  priceFlash ? 'text-amber-600 animate-pulse' : 'text-stone-900'
                }`}
              >
                ₹{Number(product.farmerPrice)}
              </span>
              <span className="text-xs text-stone-500 font-medium"> /{product.priceUnit.replace('PER_', '').toLowerCase()}</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-stone-500 block">Available</span>
              <span className="text-sm font-semibold text-stone-800">
                {Number(product.quantityAvailable)} {product.quantityUnit.toLowerCase()}
              </span>
            </div>
          </div>

          <a
            href={`/products/${product.id}`}
            className="mt-4 w-full block text-center bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Direct Farm Enquiry
          </a>
        </div>
      </div>
    </div>
  );
};