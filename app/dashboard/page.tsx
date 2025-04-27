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
  processed: number;
  unprocessed: number;
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
          processed: data.data.processed || 0,
          unprocessed: data.data.unprocessed || 0,
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
        const fetchDashboardData = async () => {
          try {
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
              processed: data.data.processed || 0,
              unprocessed: data.data.unprocessed || 0,
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
          }
        };
        
        fetchDashboardData();
        
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
              className="flex items-center gap-2"
              variant="default"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Seeding...</span>
                </>
              ) : seedingSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Data Added</span>
                </>
              ) : (
                <>Load Sample Data</>
              )}
            </Button>
          )}
          <Button variant="outline">Export Reports</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-900">
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
        <Card className="bg-gray-900">
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
        <Card className="bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Processed Videos</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> 8% increase
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rewards Distributed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.rewards_distributed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> 15% increase
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Use 2-column grid with proper proportions */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
        {/* Trending Issues - Takes 8 columns on md screens */}
        <Card className="bg-gray-900 md:col-span-8">
          <CardHeader>
            <CardTitle>Trending Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="7days">
              <TabsList className="grid grid-cols-3 w-full max-w-[400px] mb-4">
                <TabsTrigger value="7days">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
                <TabsTrigger value="90days">90 Days</TabsTrigger>
              </TabsList>
              <TabsContent value="7days" className="h-[300px]">
                <LineChart 
                  data={{
                    labels: stats.trending_issues.labels || [],
                    datasets: stats.trending_issues.datasets.map((dataset, index) => ({
                      label: dataset.label,
                      data: dataset.data || [],
                      borderColor: index === 0 ? '#FF9F29' : index === 1 ? '#E74C3C' : '#3498DB',
                      backgroundColor: index === 0 ? 'rgba(255, 159, 41, 0.5)' : 
                                       index === 1 ? 'rgba(231, 76, 60, 0.5)' : 
                                                    'rgba(52, 152, 219, 0.5)',
                    })) || []
                  }}
                />
              </TabsContent>
              <TabsContent value="30days" className="h-[300px]">
                <LineChart 
                  data={{
                    labels: stats.trending_issues.labels || [],
                    datasets: stats.trending_issues.datasets.map((dataset, index) => ({
                      label: dataset.label,
                      data: dataset.data || [],
                      borderColor: index === 0 ? '#FF9F29' : index === 1 ? '#E74C3C' : '#3498DB',
                      backgroundColor: index === 0 ? 'rgba(255, 159, 41, 0.5)' : 
                                       index === 1 ? 'rgba(231, 76, 60, 0.5)' : 
                                                    'rgba(52, 152, 219, 0.5)',
                    })) || []
                  }}
                />
              </TabsContent>
              <TabsContent value="90days" className="h-[300px]">
                <LineChart 
                  data={{
                    labels: stats.trending_issues.labels || [],
                    datasets: stats.trending_issues.datasets.map((dataset, index) => ({
                      label: dataset.label,
                      data: dataset.data || [],
                      borderColor: index === 0 ? '#FF9F29' : index === 1 ? '#E74C3C' : '#3498DB',
                      backgroundColor: index === 0 ? 'rgba(255, 159, 41, 0.5)' : 
                                       index === 1 ? 'rgba(231, 76, 60, 0.5)' : 
                                                    'rgba(52, 152, 219, 0.5)',
                    })) || []
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Issues by Category - Takes 4 columns on md screens */}
        <Card className="bg-gray-900 md:col-span-4">
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <PieChart 
                data={{
                  labels: ['Garbage', 'Road Damage', 'Traffic Violations', 'Helmet Violations'],
                  datasets: [
                    {
                      data: [
                        stats.issue_categories.garbage,
                        stats.issue_categories.road_damage,
                        stats.issue_categories.traffic_violations,
                        stats.issue_categories.helmet_violations
                      ],
                      backgroundColor: [
                        '#94A3B8', // Garbage - Gray
                        '#F97316', // Road Damage - Orange
                        '#EF4444', // Traffic Violations - Red
                        '#EAB308'  // Helmet Violations - Yellow
                      ]
                    }
                  ]
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Summary Section - 2 equal columns */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
        {/* Recent Activity */}
        <Card className="bg-gray-900 md:col-span-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.recent_activity.length > 0 ? (
                <div>
                  {stats.recent_activity.map((activity, index) => (
                    <div 
                      key={activity.id || index} 
                      className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{activity.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {activity.rider} • {new Date(activity.processed_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{activity.detection_count} detections</span>
                        <Link href={`/dashboard/videos/${activity.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center">
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/videos">View All Videos</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detection Summary */}
        <Card className="bg-gray-900 md:col-span-6">
          <CardHeader>
            <CardTitle>Detection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Detections</span>
                <span className="font-semibold text-lg">{stats.detection_summary.total}</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Broken Roads</span>
                    <span className="text-sm font-medium text-red-500">{stats.detection_summary.broken_road}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full" 
                      style={{ 
                        width: `${(stats.detection_summary.broken_road / (stats.detection_summary.total || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Potholes</span>
                    <span className="text-sm font-medium text-orange-500">{stats.detection_summary.pothole}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className="bg-orange-500 h-3 rounded-full" 
                      style={{ 
                        width: `${(stats.detection_summary.pothole / (stats.detection_summary.total || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Broken Roads</span>
                    <span className="text-lg font-bold text-red-500">{stats.detection_summary.broken_road}</span>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Potholes</span>
                    <span className="text-lg font-bold text-orange-500">{stats.detection_summary.pothole}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 