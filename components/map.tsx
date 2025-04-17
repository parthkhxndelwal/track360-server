"use client";

import React, { useEffect, useRef, useState } from 'react';

interface MapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
}

const Map = ({ latitude, longitude, zoom = 15, className }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined' || !mapRef.current) return;

    let mapInstance: any = null;
    let isUnmounted = false;

    const initializeMap = () => {
      try {
        // Add Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Add Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        
        script.onload = () => {
          if (isUnmounted) return;
          
          // Now Leaflet should be available
          if (window.L && mapRef.current) {
            // Clear existing map if it exists
            if (mapInstance) {
              mapInstance.remove();
            }
            
            // Create the map
            mapRef.current.innerHTML = '';
            mapInstance = window.L.map(mapRef.current).setView([latitude, longitude], zoom);
            
            // Add the tile layer
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance);
            
            // Add a marker
            window.L.marker([latitude, longitude]).addTo(mapInstance)
              .bindPopup('Detection Location')
              .openPopup();
            
            // Ensure the map is correctly sized
            setTimeout(() => {
              if (mapInstance) {
                mapInstance.invalidateSize();
              }
            }, 100);
            
            setIsMapLoaded(true);
          }
        };
        
        script.onerror = () => {
          if (isUnmounted) return;
          console.error('Failed to load Leaflet');
          setLoadError(true);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoadError(true);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isUnmounted = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [latitude, longitude, zoom]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapRef} 
        className={`w-full h-full ${className || ''} ${loadError ? 'opacity-0' : ''}`} 
      />
      {(!isMapLoaded || loadError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center p-4">
            <p className="text-sm text-gray-400 mb-2">
              {loadError ? "Map Unavailable" : "Loading Map..."}
            </p>
            <p className="text-xs text-gray-500">
              Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Add type definition for Leaflet globally
declare global {
  interface Window {
    L: any;
  }
}

export default Map; 