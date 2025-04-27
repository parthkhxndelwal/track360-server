import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Fetch all videos with location data
    const videos = await db
      .collection("processed")
      .find(
        { 
          "location.latitude": { $exists: true }, 
          "location.longitude": { $exists: true }
        },
        {
          projection: {
            _id: 1,
            title: 1,
            location: 1,
            detection_summary: 1,
            created_at: 1,
            thumbnail: 1
          }
        }
      )
      .toArray();
    
    // Format the response for map display
    const mapData = videos.map(video => ({
      id: video._id.toString(),
      title: video.title,
      location: video.location,
      detection_count: video.detection_summary ? 
        (video.detection_summary.broken_road || 0) + (video.detection_summary.pothole || 0) : 0,
      created_at: video.created_at,
      thumbnail: video.thumbnail || null
    }));
    
    return NextResponse.json({
      success: true,
      data: mapData
    });
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch map data"
    }, { status: 500 });
  }
} 