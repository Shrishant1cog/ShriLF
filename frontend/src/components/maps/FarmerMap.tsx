'use client';

import React, { useEffect, useRef } from 'react';

interface FarmerMapProps {
  farmers: Array<{
    id: string;
    farmName: string;
    farmerName: string;
    district: string;
    latitude: number;
    longitude: number;
    availableProducts: Array<{ title: string; farmerPrice: number }>;
  }>;
}

export default function FarmerMap({ farmers }: FarmerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamically load Leaflet without SSR window errors
    import('leaflet').then((L) => {
      // Default to Central Karnataka view
      if (!leafletInstance.current) {
        const map = L.map(mapRef.current!).setView([13.0, 76.5], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        leafletInstance.current = map;
      }

      const map = leafletInstance.current;

      farmers.forEach((farmer) => {
        const cropList = farmer.availableProducts
          .map((p) => `<li>${p.title} - <b>₹${p.farmerPrice}</b> (Farmer Listed Price)</li>`)
          .join('');

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 13px;">
            <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #065f46;">${farmer.farmName}</h4>
            <p style="margin: 0 0 6px 0; color: #555;">Farmer: ${farmer.farmerName} (${farmer.district})</p>
            <ul style="padding-left: 16px; margin: 4px 0;">${cropList || '<li>No crops active</li>'}</ul>
          </div>
        `;

        L.marker([farmer.latitude, farmer.longitude])
          .addTo(map)
          .bindPopup(popupContent);
      });
    });

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [farmers]);

  return (
    <div className="w-full h-[550px] rounded-2xl overflow-hidden shadow-md border border-stone-200">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}