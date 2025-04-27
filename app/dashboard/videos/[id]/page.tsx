"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MapPin, 
  Download, 
  Share2, 
  Loader2, 
  AlertCircle, 
  FileDown, 
  FileCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ArrowLeftIcon, PauseIcon, PlayIcon } from "@heroicons/react/24/solid";

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/map'), { ssr: false });

interface VideoDetail {
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
  detection_results: {
    video_file: string;
    duration_seconds: number;
    duration: string;
    detection_summary: {
      broken_road: number;
      pothole: number;
    };
    detections: Array<{
      timestamp_seconds: number;
      timestamp: string;
      detections: Array<{
        category: string;
        class: string;
        confidence: number;
        bounding_box: number[];
      }>;
    }>;
  };
}

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentDetectionData, setCurrentDetectionData] = useState<{
    timestamp: string;
    detections: Array<{
      category: string;
      class: string;
      confidence: number;
    }>;
  } | null>(null);
  const [showDetection, setShowDetection] = useState(false);
  const [originalVideoError, setOriginalVideoError] = useState(false);
  const [processedVideoError, setProcessedVideoError] = useState(false);
  const [videosReady, setVideosReady] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);

  // Fetch video details
  useEffect(() => {
    async function fetchVideoDetail() {
      try {
        console.log(`Fetching video details for ID: ${params.id}`);
        const response = await fetch(`/api/videos/processed/${params.id}`);
        
        if (!response.ok) {
          console.error(`Error response: ${response.status} ${response.statusText}`);
          throw new Error('Failed to fetch video details');
        }
        
        const data = await response.json();
        console.log("Video details fetched:", data);
        
        if (data.success && data.data) {
          setVideoDetail(data.data);
        } else {
          console.error("Invalid response format:", data);
          setError('Invalid video data format received from server');
        }
      } catch (err) {
        console.error('Error fetching video details:', err);
        setError('Failed to load video details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchVideoDetail();
    }
  }, [params.id]);

  // Sync video playback
  useEffect(() => {
    const originalVideo = originalVideoRef.current;
    const processedVideo = processedVideoRef.current;

    if (!originalVideo || !processedVideo) return;

    const handlePlay = () => {
      if (processedVideo.paused) processedVideo.play();
      if (originalVideo.paused) originalVideo.play();
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (!processedVideo.paused) processedVideo.pause();
      if (!originalVideo.paused) originalVideo.pause();
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      const time = originalVideo.currentTime;
      
      if (Math.abs(processedVideo.currentTime - time) > 0.5) {
        processedVideo.currentTime = time;
      }
      
      setCurrentTime(time);
      
      // Check for detections at current time
      if (videoDetail?.detection_results) {
        const { detections } = videoDetail.detection_results;
        const currentDetection = detections.find(d => 
          time >= d.timestamp_seconds && 
          time < d.timestamp_seconds + 0.5
        );
        
        if (currentDetection && currentDetection.detections.length > 0) {
          setCurrentDetectionData({
            timestamp: currentDetection.timestamp,
            detections: currentDetection.detections
          });
          setShowDetection(true);
        } else {
          setShowDetection(false);
        }
      }
    };

    const handleSeek = () => {
      processedVideo.currentTime = originalVideo.currentTime;
    };

    originalVideo.addEventListener('play', handlePlay);
    originalVideo.addEventListener('pause', handlePause);
    originalVideo.addEventListener('timeupdate', handleTimeUpdate);
    originalVideo.addEventListener('seeked', handleSeek);

    processedVideo.addEventListener('play', handlePlay);
    processedVideo.addEventListener('pause', handlePause);
    processedVideo.addEventListener('seeked', () => {
      originalVideo.currentTime = processedVideo.currentTime;
    });

    return () => {
      originalVideo.removeEventListener('play', handlePlay);
      originalVideo.removeEventListener('pause', handlePause);
      originalVideo.removeEventListener('timeupdate', handleTimeUpdate);
      originalVideo.removeEventListener('seeked', handleSeek);

      processedVideo.removeEventListener('play', handlePlay);
      processedVideo.removeEventListener('pause', handlePause);
      processedVideo.removeEventListener('seeked', () => {
        originalVideo.currentTime = processedVideo.currentTime;
      });
    };
  }, [videoDetail]);

  const togglePlayPause = () => {
    const originalVideo = originalVideoRef.current;
    if (!originalVideo) return;

    if (originalVideo.paused) {
      originalVideo.play();
    } else {
      originalVideo.pause();
    }
  };

  const resetVideos = () => {
    const originalVideo = originalVideoRef.current;
    const processedVideo = processedVideoRef.current;
    
    if (originalVideo && processedVideo) {
      originalVideo.currentTime = 0;
      processedVideo.currentTime = 0;
      if (!originalVideo.paused) {
        originalVideo.pause();
      }
    }
  };

  // Add function to force reload videos with different technique
  const forceLoadVideo = () => {
    setAttemptCount(prev => prev + 1);
    setOriginalVideoError(false);
    setProcessedVideoError(false);
    
    const originalSrc = videoDetail?.original_url;
    const processedSrc = videoDetail?.processed_url;
    
    if (originalVideoRef.current && originalSrc) {
      originalVideoRef.current.src = '';
      setTimeout(() => {
        if (originalVideoRef.current) {
          originalVideoRef.current.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'cache=' + Date.now();
          originalVideoRef.current.load();
        }
      }, 100);
    }
    
    if (processedVideoRef.current && processedSrc) {
      processedVideoRef.current.src = '';
      setTimeout(() => {
        if (processedVideoRef.current) {
          processedVideoRef.current.src = processedSrc + (processedSrc.includes('?') ? '&' : '?') + 'cache=' + Date.now();
          processedVideoRef.current.load();
        }
      }, 100);
    }
  };

  // Update the retry function
  const handleRetryVideoLoad = () => {
    forceLoadVideo();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading video details...</p>
        </div>
      </div>
    );
  }

  if (error || !videoDetail) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Video not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Videos
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{videoDetail.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {videoDetail.location.address}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="h-6">
                  {new Date(videoDetail.created_at).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Video Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Video Comparison</CardTitle>
              <CardDescription>
                Compare the original and processed videos to see the detections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Video */}
                <div className="space-y-2">
                  <div className="font-medium text-sm">Original Video</div>
                  <div className="relative bg-black rounded-md overflow-hidden">
                    {originalVideoError ? (
                      <div className="w-full aspect-video flex items-center justify-center bg-gray-900">
                        <div className="text-center p-4">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">Original video could not be loaded</p>
                        </div>
                      </div>
                    ) : (
                      <video 
                        key={`original-${attemptCount}`}
                        ref={originalVideoRef}
                        className="w-full aspect-video"
                        src={videoDetail.original_url}
                        playsInline
                        onError={() => setOriginalVideoError(true)}
                        onLoadedData={() => {
                          console.log("Original video loaded");
                          if (processedVideoRef.current?.readyState >= 2) {
                            setVideosReady(true);
                          }
                        }}
                        poster={videoDetail.thumbnail}
                        controls={true}
                        controlsList="nodownload"
                        preload="auto"
                        crossOrigin="anonymous"
                        onPosterError={(e) => {
                          // Create a dynamic poster using code
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          
                          if (ctx) {
                            // Set canvas dimensions
                            canvas.width = 640;
                            canvas.height = 360;
                            
                            // Create random but consistent color based on title
                            const getColor = (text: string) => {
                              const colors = [
                                '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
                                '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
                              ];
                              
                              // Simple hash for consistent color
                              let hash = 0;
                              for (let i = 0; i < text.length; i++) {
                                hash = text.charCodeAt(i) + ((hash << 5) - hash);
                              }
                              
                              return colors[Math.abs(hash) % colors.length];
                            };
                            
                            const bgColor = getColor(videoDetail.title);
                            
                            // Fill background
                            ctx.fillStyle = bgColor + '33'; // Adding transparency
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            // Draw play icon
                            ctx.strokeStyle = bgColor;
                            ctx.lineWidth = 5;
                            ctx.beginPath();
                            ctx.moveTo(canvas.width / 2 - 30, canvas.height / 2 - 40);
                            ctx.lineTo(canvas.width / 2 - 30, canvas.height / 2 + 40);
                            ctx.lineTo(canvas.width / 2 + 40, canvas.height / 2);
                            ctx.closePath();
                            ctx.stroke();
                            ctx.fillStyle = bgColor;
                            ctx.fill();
                            
                            // Draw title
                            ctx.font = 'bold 24px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillStyle = bgColor;
                            
                            // Truncate title if needed
                            let title = videoDetail.title;
                            if (title.length > 20) {
                              title = title.substring(0, 20) + '...';
                            }
                            
                            ctx.fillText(title, canvas.width / 2, canvas.height - 40);
                            
                            // Update the poster with the canvas data URL
                            const dataURL = canvas.toDataURL('image/png');
                            const video = e.currentTarget as HTMLVideoElement;
                            video.poster = dataURL;
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Processed Video */}
                <div hidden className="space-y-2">
                  <div className="font-medium text-sm">Processed Video</div>
                  <div className="relative bg-black rounded-md overflow-hidden">
                    {processedVideoError ? (
                      <div className="w-full aspect-video flex items-center justify-center bg-gray-900">
                        <div className="text-center p-4">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">Processed video could not be loaded</p>
                        </div>
                      </div>
                    ) : (
                      <video 
                        key={`processed-${attemptCount}`}
                        ref={processedVideoRef}
                        className="w-full aspect-video"
                        src={videoDetail.processed_url}
                        playsInline
                        onError={() => setProcessedVideoError(true)}
                        onLoadedData={() => {
                          console.log("Processed video loaded");
                          if (originalVideoRef.current?.readyState >= 2) {
                            setVideosReady(true);
                          }
                        }}
                        poster={videoDetail.thumbnail}
                        controls={true}
                        controlsList="nodownload"
                        preload="auto"
                        crossOrigin="anonymous"
                        onPosterError={(e) => {
                          // Create a dynamic poster using code
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          
                          if (ctx) {
                            // Set canvas dimensions
                            canvas.width = 640;
                            canvas.height = 360;
                            
                            // Create random but consistent color based on title
                            const getColor = (text: string) => {
                              const colors = [
                                '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
                                '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
                              ];
                              
                              // Simple hash for consistent color
                              let hash = 0;
                              for (let i = 0; i < text.length; i++) {
                                hash = text.charCodeAt(i) + ((hash << 5) - hash);
                              }
                              
                              return colors[Math.abs(hash) % colors.length];
                            };
                            
                            const bgColor = getColor('Processed: ' + videoDetail.title);
                            
                            // Fill background
                            ctx.fillStyle = bgColor + '33'; // Adding transparency
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            // Draw play icon
                            ctx.strokeStyle = bgColor;
                            ctx.lineWidth = 5;
                            ctx.beginPath();
                            ctx.moveTo(canvas.width / 2 - 30, canvas.height / 2 - 40);
                            ctx.lineTo(canvas.width / 2 - 30, canvas.height / 2 + 40);
                            ctx.lineTo(canvas.width / 2 + 40, canvas.height / 2);
                            ctx.closePath();
                            ctx.stroke();
                            ctx.fillStyle = bgColor;
                            ctx.fill();
                            
                            // Draw title
                            ctx.font = 'bold 24px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillStyle = bgColor;
                            
                            // Add processed prefix
                            let title = 'Processed: ' + videoDetail.title;
                            if (title.length > 28) {
                              title = title.substring(0, 28) + '...';
                            }
                            
                            ctx.fillText(title, canvas.width / 2, canvas.height - 40);
                            
                            // Update the poster with the canvas data URL
                            const dataURL = canvas.toDataURL('image/png');
                            const video = e.currentTarget as HTMLVideoElement;
                            video.poster = dataURL;
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Video Controls */}
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={resetVideos}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Current detection toast */}
              {showDetection && currentDetectionData && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md shadow-sm">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Detection at {currentDetectionData.timestamp}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentDetectionData.detections.map((detection, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`
                          ${detection.category === 'broken_road' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800' : ''}
                          ${detection.category === 'pothole' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800' : ''}
                          ${detection.category === 'no_helmet' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800' : ''}
                        `}
                      >
                        {detection.category.replace('_', ' ')} ({Math.round(detection.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!videosReady && !originalVideoError && !processedVideoError && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Loading videos... This may take a moment.
                    </p>
                  </div>
                </div>
              )}

              {(originalVideoError || processedVideoError) && (
                <div className="flex justify-center mt-6 mb-2">
                  <Button 
                    variant="default" 
                    onClick={handleRetryVideoLoad}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry Loading Videos
                  </Button>
                </div>
              )}

              {!originalVideoError && !processedVideoError && !videosReady && (
                <div className="flex justify-center mt-6 mb-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRetryVideoLoad}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Force Reload Videos
                  </Button>
                </div>
              )}

              {!originalVideoError && !processedVideoError && (
                <div className="mt-4 text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  <details>
                    <summary className="cursor-pointer">Video Sources (click to view)</summary>
                    <p className="mt-1 break-all">Original: {videoDetail.original_url}</p>
                    <p className="mt-1 break-all">Processed: {videoDetail.processed_url}</p>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Location Map */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] rounded-md overflow-hidden">
                <Map 
                  latitude={videoDetail.location.latitude} 
                  longitude={videoDetail.location.longitude} 
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {videoDetail.location.address}
              </p>
            </CardContent>
          </Card>

          {/* Detection Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Detection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Detections</span>
                  <span className="font-semibold">
                    {videoDetail.detection_summary ? 
                      ((videoDetail.detection_summary.broken_road || 0) + 
                       (videoDetail.detection_summary.pothole || 0)) : 0}
                  </span>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Broken Roads</span>
                    <Badge variant="destructive">
                      {videoDetail.detection_summary?.broken_road || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Potholes</span>
                    <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 dark:bg-opacity-20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                      {videoDetail.detection_summary?.pothole || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Info */}
          <Card>
            <CardHeader>
              <CardTitle>Video Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{videoDetail.duration_seconds.toFixed(2)} seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={videoDetail.status === 'completed' ? 'success' : 'secondary'}>
                    {videoDetail.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">{new Date(videoDetail.created_at).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 