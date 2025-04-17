"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the MapView component to avoid SSR issues
const MapView = dynamic(() => import('@/components/map-view'), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-900 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
});

interface MapData {
  id: string;
  title: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  detection_count: number;
  created_at: string;
  thumbnail: string | null;
}

export default function MapPage() {
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<MapData[]>([]);
  
  // Fetch map data
  useEffect(() => {
    async function fetchMapData() {
      try {
        const response = await fetch('/api/videos/map-data');
        if (!response.ok) {
          throw new Error('Failed to fetch map data');
        }
        const data = await response.json();
        setMapData(data.data);
        setFilteredData(data.data);
      } catch (err) {
        console.error('Error fetching map data:', err);
        setError('Failed to load map data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMapData();
  }, []);
  
  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(mapData);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = mapData.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.location.address.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredData(filtered);
  }, [searchQuery, mapData]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Map View</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/videos">
            <Button variant="outline">All Videos</Button>
          </Link>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by title or location..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Map Card */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Video Locations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400">No locations match your search criteria</p>
              </div>
            </div>
          ) : (
            <div className="h-[600px]">
              <MapView 
                locations={filteredData.map(item => ({
                  id: item.id,
                  title: item.title,
                  latitude: item.location.latitude,
                  longitude: item.location.longitude,
                  address: item.location.address,
                  detectionCount: item.detection_count,
                  createdAt: item.created_at
                }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Location List */}
      <Card>
        <CardHeader>
          <CardTitle>Location List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No locations found</p>
            ) : (
              filteredData.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center p-3 border border-gray-800 rounded-lg">
                  <div className="mr-4">
                    <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.location.address}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {item.detection_count} detections
                  </div>
                  <Link href={`/dashboard/videos/${item.id}`}>
                    <Button variant="ghost" size="sm" className="ml-2">
                      View
                    </Button>
                  </Link>
                </div>
              ))
            )}
            
            {filteredData.length > 5 && (
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing 5 of {filteredData.length} locations
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 