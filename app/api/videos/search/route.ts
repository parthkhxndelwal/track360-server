import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    // Get search query from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Create search criteria
    const searchCriteria = query 
      ? {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { 'location.address': { $regex: query, $options: 'i' } }
          ]
        }
      : {};
    
    // Fetch videos matching search criteria
    const videos = await db
      .collection("processed")
      .find(searchCriteria)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    
    // Format the response
    const formattedVideos = videos.map(video => ({
      ...video,
      _id: video._id.toString(),
      id: video._id.toString()
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedVideos
    });
  } catch (error) {
    console.error("Error searching videos:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to search videos"
    }, { status: 500 });
  }
} 