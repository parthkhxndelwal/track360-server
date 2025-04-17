"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  Search, 
  Video, 
  ArrowUpRight, 
  MapPin, 
  CalendarIcon, 
  AlertCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ProcessedVideo {
  id: string;
  title: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  processed_url: string;
  original_url: string;
  thumbnail: string;
  detection_summary: {
    broken_road: number;
    pothole: number;
  };
  created_at: string;
  status: string;
  duration_seconds: number;
}

export default function ProcessedVideosPage() {
  const [videos, setVideos] = useState<ProcessedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingMessage, setSeedingMessage] = useState('');

  useEffect(() => {
    async function fetchProcessedVideos() {
      try {
        setLoading(true);
        const response = await fetch('/api/videos/processed');
        if (!response.ok) {
          throw new Error('Failed to fetch processed videos');
        }
        const data = await response.json();
        console.log("Fetched videos data:", data);
        
        if (data.data && Array.isArray(data.data)) {
          setVideos(data.data);
          console.log(`Loaded ${data.data.length} videos`);
        } else {
          console.error("Invalid video data format:", data);
          setVideos([]);
        }
      } catch (err) {
        console.error('Error fetching processed videos:', err);
        setError('Failed to load processed videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProcessedVideos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        fetchProcessedVideos();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProcessedVideos = async () => {
    try {
      setSearchLoading(true);
      const response = await fetch('/api/videos/processed');
      if (!response.ok) {
        throw new Error('Failed to fetch processed videos');
      }
      const data = await response.json();
      console.log("Fetched videos data:", data);
      
      if (data.data && Array.isArray(data.data)) {
        setVideos(data.data);
        console.log(`Loaded ${data.data.length} videos`);
      } else {
        console.error("Invalid video data format:", data);
        setVideos([]);
      }
    } catch (err) {
      console.error('Error fetching processed videos:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setSearchLoading(true);
      const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search videos');
      }
      const data = await response.json();
      setVideos(data.data);
    } catch (err) {
      console.error('Error searching videos:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const seedDatabase = async () => {
    try {
      setIsSeeding(true);
      setSeedingMessage('Seeding database with sample videos...');
      
      const response = await fetch('/api/seed');
      const data = await response.json();
      
      if (data.success) {
        setSeedingMessage('Database seeded successfully! Refreshing...');
        
        setTimeout(() => {
          fetchProcessedVideos();
          setSeedingMessage('');
        }, 1500);
      } else {
        setSeedingMessage(`Seeding failed: ${data.message}`);
        setTimeout(() => setSeedingMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error seeding database:', error);
      setSeedingMessage('Error seeding database');
      setTimeout(() => setSeedingMessage(''), 3000);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading videos...</p>
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
        <h1 className="text-3xl font-bold">Processed Videos</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            Filter
          </Button>
          <Button>
            Upload New Video
          </Button>
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

      {/* Videos List */}
      {videos.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">No videos match your search criteria</p>
          
          {!searchQuery && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-400">
                Would you like to seed the database with sample videos?
              </p>
              <Button 
                onClick={seedDatabase} 
                disabled={isSeeding}
              >
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSeeding ? 'Seeding...' : 'Add Sample Videos'}
              </Button>
              
              {seedingMessage && (
                <p className="text-sm text-primary">{seedingMessage}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {videos.map((video) => (
            <Card key={video.id || video._id || `video-${Math.random()}`} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Video Thumbnail */}
                  <div className="w-full md:w-64 h-40 bg-gray-200 dark:bg-gray-800 relative flex items-center justify-center">
                    {video.thumbnail ? (
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/thumbnails/default.jpg';
                        }}
                      />
                    ) : (
                      <Video className="h-12 w-12 text-gray-400" />
                    )}
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white px-2 py-1 text-xs rounded-tl-md">
                      {Math.floor((video.duration_seconds || 0) / 60)}:{Math.floor((video.duration_seconds || 0) % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  
                  {/* Video Details */}
                  <div className="p-4 flex-1">
                    <div className="flex justify-between">
                      <h2 className="text-xl font-semibold mb-2">{video.title || "Untitled Video"}</h2>
                      <Badge 
                        variant={(video.status || "").toLowerCase() === 'completed' ? 'success' : 'secondary'}
                        className="h-6"
                      >
                        {video.status || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {video.location?.address || "Unknown Location"}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {video.created_at ? new Date(video.created_at).toLocaleString() : "Unknown Date"}
                      </div>
                    </div>
                    
                    {/* Detection Summary */}
                    <div className="flex gap-4 mb-4">
                      <div className="bg-red-100 dark:bg-red-950 dark:bg-opacity-20 text-red-800 dark:text-red-300 px-3 py-1 rounded-md text-sm">
                        <span className="font-semibold">{video.detection_summary?.broken_road || 0}</span> broken roads
                      </div>
                      <div className="bg-orange-100 dark:bg-orange-950 dark:bg-opacity-20 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-md text-sm">
                        <span className="font-semibold">{video.detection_summary?.pothole || 0}</span> potholes
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/videos/${video.id || video._id}`}>
                        <Button variant="default" size="sm" className="flex items-center gap-1">
                          View Details
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}