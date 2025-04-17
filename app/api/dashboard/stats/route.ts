import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Get count of all videos
    const totalVideos = await db.collection("unprocessed_videos").countDocuments({});
    
    // Get count of processed videos
    const processedVideos = await db.collection("processed_videos").countDocuments({});
    
    // Calculate unprocessed videos
    const unprocessedVideos = totalVideos - processedVideos;
    
    // Get count of active riders (users with the "rider" role who have uploaded videos)
    const activeRiders = await db.collection("users").countDocuments({ role: "rider", status: "active" });
    
    // Get sum of rewards distributed
    const rewardsAggregation = await db.collection("rewards").aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]).toArray();
    
    const rewardsDistributed = rewardsAggregation.length > 0 ? rewardsAggregation[0].total : 0;
    
    // Get detection summary
    const detectionSummaryAggregation = await db.collection("detection_results").aggregate([
      {
        $unwind: "$detections"
      },
      {
        $unwind: "$detections.detections"
      },
      {
        $group: {
          _id: "$detections.detections.category",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const detectionSummary = {
      broken_road: 0,
      pothole: 0,
      total: 0
    };
    
    detectionSummaryAggregation.forEach(item => {
      if (item._id in detectionSummary) {
        detectionSummary[item._id as keyof typeof detectionSummary] = item.count;
      }
      detectionSummary.total += item.count;
    });
    
    // Get recent activity
    const recentActivity = await db.collection("processed_videos")
      .find({})
      .sort({ created_at: -1 })
      .limit(3)
      .toArray()
      .then(videos => videos.map(video => ({
        id: video._id.toString(),
        title: video.title,
        processed_at: video.created_at,
        rider: video.rider_name || "Unknown Rider",
        detection_count: video.detection_summary ? 
          (video.detection_summary.broken_road || 0) + (video.detection_summary.pothole || 0) : 0
      })));
    
    // Get trending issues data (simplified for now)
    // In a real application, this would involve more complex time-series aggregation
    // Here we're just returning some structured data
    const date = new Date();
    const labels = Array.from({ length: 16 }, (_, i) => {
      const d = new Date(date);
      d.setDate(d.getDate() - (15 - i));
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    const dashboardStats = {
      total_videos: totalVideos,
      processed_videos: processedVideos,
      unprocessed_videos: unprocessedVideos,
      active_riders: activeRiders,
      rewards_distributed: rewardsDistributed,
      detection_summary: detectionSummary,
      issue_categories: {
        garbage: 42,
        road_damage: 28,
        traffic_violations: 18,
        helmet_violations: 12
      },
      recent_activity: recentActivity,
      trending_issues: {
        labels,
        datasets: [
          {
            label: "Garbage",
            data: [15, 18, 20, 22, 25, 23, 26, 28, 25, 27, 26, 24, 26, 25, 24, 23]
          },
          {
            label: "Road Damage",
            data: [12, 13, 15, 17, 19, 21, 20, 22, 23, 22, 24, 22, 21, 20, 18, 17]
          },
          {
            label: "Traffic Violations",
            data: [8, 9, 11, 12, 13, 14, 13, 15, 16, 14, 15, 13, 12, 11, 10, 9]
          }
        ]
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    }, { status: 500 });
  }
} 