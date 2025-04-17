"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Users,
  Video,
  FileCheck,
  Clock,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
} from 'lucide-react';

interface DashboardStats {
  total_videos: number;
  processed_videos: number;
  unprocessed_videos: number;
  active_riders: number;
  rewards_distributed: number;
  detection_summary: {
    broken_road: number;
    pothole: number;
    total: number;
  };
  issue_categories: {
    garbage: number;
    road_damage: number;
    traffic_violations: number;
    helmet_violations: number;
  };
  recent_activity: Array<{
    id: string;
    title: string;
    processed_at: string;
    rider: string;
    detection_count: number;
  }>;
  trending_issues: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState(false);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        const data = await response.json();
        
        // Format the data as needed
        const formattedStats = {
          ...data.data,
          // Ensure we have all the expected fields with defaults if not provided
          total_videos: data.data.total_videos || 0,
          processed_videos: data.data.processed_videos || 0,
          unprocessed_videos: data.data.unprocessed_videos || 0,
          active_riders: data.data.active_riders || 0,
          rewards_distributed: data.data.rewards_distributed || 0,
          detection_summary: data.data.detection_summary || {
            broken_road: 0,
            pothole: 0,
            total: 0
          },
          issue_categories: data.data.issue_categories || {
            garbage: 0,
            road_damage: 0,
            traffic_violations: 0,
            helmet_violations: 0
          },
          recent_activity: data.data.recent_activity || [],
          trending_issues: data.data.trending_issues || {
            labels: [],
            datasets: []
          }
        };
        
        setStats(formattedStats);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  const seedDatabase = async () => {
    if (isSeeding) return;
    
    try {
      setIsSeeding(true);
      
      const response = await fetch('/api/seed');
      const data = await response.json();
      
      if (data.success) {
        setSeedingSuccess(true);
        // Refresh dashboard data after successful seeding
        fetchDashboardStats();
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSeedingSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading dashboard data...</p>
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

  if (!stats) {
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No dashboard data is available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="flex gap-2">
          {stats && stats.total_videos === 0 && (
            <Button 
              onClick={seedDatabase} 
              disabled={isSeeding || seedingSuccess}
              className="flex items-center gap-1"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : seedingSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Data Added
                </>
              ) : (
                <>Load Sample Data</>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm">Export Reports</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_videos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> 12% increase
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_riders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> 5% increase
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Processed Videos</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processed_videos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> 8% increase
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rewards Distributed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.rewards_distributed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> 15% increase
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends & Categories */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Trending Issues */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Trending Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="30days">
              <TabsList className="mb-4">
                <TabsTrigger value="7days">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
                <TabsTrigger value="90days">90 Days</TabsTrigger>
              </TabsList>
              <div className="h-[300px]">
                <LineChart 
                  data={{
                    labels: stats.trending_issues.labels,
                    datasets: stats.trending_issues.datasets.map((dataset, index) => ({
                      label: dataset.label,
                      data: dataset.data,
                      borderColor: index === 0 ? '#f97316' : index === 1 ? '#ef4444' : '#3b82f6',
                      backgroundColor: index === 0 ? 'rgba(249, 115, 22, 0.1)' : index === 1 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    }))
                  }}
                />
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Issues by Category */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <PieChart 
                data={{
                  labels: ['Garbage', 'Road Damage', 'Traffic Violations', 'Helmet Violations'],
                  datasets: [{
                    data: [
                      stats.issue_categories.garbage,
                      stats.issue_categories.road_damage,
                      stats.issue_categories.traffic_violations,
                      stats.issue_categories.helmet_violations
                    ],
                    backgroundColor: [
                      'rgba(156, 163, 175, 0.8)', // Garbage
                      'rgba(249, 115, 22, 0.8)',  // Road Damage
                      'rgba(239, 68, 68, 0.8)',   // Traffic Violations
                      'rgba(234, 179, 8, 0.8)'    // Helmet Violations
                    ],
                    borderColor: [
                      'rgb(156, 163, 175)',
                      'rgb(249, 115, 22)',
                      'rgb(239, 68, 68)',
                      'rgb(234, 179, 8)'
                    ],
                    borderWidth: 1
                  }]
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Recent Activity */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 border rounded-lg">
                  <div className="mr-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{activity.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" /> 
                      {new Date(activity.processed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {activity.detection_count} detections
                  </div>
                  <Link href={`/dashboard/videos/${activity.id}`}>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              <Link href="/dashboard/videos">
                <Button variant="outline" className="w-full">View All Videos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Detection Summary */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Detection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Total Detections</h4>
                <span className="text-sm font-medium">{stats.detection_summary.total}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                    <p className="text-sm">Broken Roads</p>
                  </div>
                  <p className="text-sm font-medium">{stats.detection_summary.broken_road}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
                    <p className="text-sm">Potholes</p>
                  </div>
                  <p className="text-sm font-medium">{stats.detection_summary.pothole}</p>
                </div>
              </div>
              <BarChart 
                data={{
                  labels: ['Broken Roads', 'Potholes'],
                  datasets: [{
                    label: 'Detections',
                    data: [stats.detection_summary.broken_road, stats.detection_summary.pothole],
                    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(249, 115, 22, 0.8)'],
                  }]
                }}
              />
              <Link href="/dashboard/reports">
                <Button variant="outline" className="w-full">View Detailed Analytics</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 