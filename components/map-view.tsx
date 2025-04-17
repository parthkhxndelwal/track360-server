"use client";

import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';

interface Location {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  address: string;
  detectionCount: number;
  createdAt: string;
}

interface MapViewProps {
  locations: Location[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

const MapView: React.FC<MapViewProps> = ({ 
  locations, 
  initialCenter, 
  initialZoom = 10 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined' || !mapRef.current || locations.length === 0) return;

    let mapInstance: any = null;
    let markers: any[] = [];
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
            
            // Get center coordinates
            let center = initialCenter;
            if (!center && locations.length > 0) {
              center = {
                lat: locations[0].latitude,
                lng: locations[0].longitude
              };
            }
            
            // Use default center if none available
            if (!center) {
              center = { lat: 28.6139, lng: 77.2090 }; // Default to Delhi, India
            }
            
            // Create the map
            mapRef.current.innerHTML = '';
            mapInstance = window.L.map(mapRef.current).setView([center.lat, center.lng], initialZoom);
            
            // Add the tile layer
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance);
            
            // Add markers for each location
            locations.forEach((location) => {
              const marker = window.L.marker([location.latitude, location.longitude])
                .addTo(mapInstance)
                .bindPopup(`
                  <div style="min-width: 200px;">
                    <h4 style="font-weight: bold; margin-bottom: 5px;">${location.title}</h4>
                    <p style="font-size: 12px; margin-bottom: 5px;">${location.address}</p>
                    <p style="font-size: 12px; margin-bottom: 5px;">Detections: ${location.detectionCount}</p>
                    <p style="font-size: 12px; color: #888;">
                      ${format(new Date(location.createdAt), 'PPP')}
                    </p>
                    <a 
                      href="/dashboard/videos/${location.id}" 
                      style="display: inline-block; background: #3b82f6; color: white; padding: 5px 10px; 
                             border-radius: 4px; text-decoration: none; font-size: 12px; margin-top: 5px;"
                    >
                      View Details
                    </a>
                  </div>
                `);
              
              markers.push(marker);
            });
            
            // Auto fit bounds if we have multiple locations
            if (locations.length > 1) {
              const bounds = window.L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
              mapInstance.fitBounds(bounds, { padding: [50, 50] });
            }
            
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
  }, [locations, initialCenter, initialZoom]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapRef} 
        className={`w-full h-full ${loadError ? 'opacity-0' : ''}`} 
      />
      {(!isMapLoaded || loadError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center p-4">
            <p className="text-sm text-gray-400 mb-2">
              {loadError ? "Map Unavailable" : "Loading Map..."}
            </p>
            <p className="text-xs text-gray-500">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
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

export default MapView; 