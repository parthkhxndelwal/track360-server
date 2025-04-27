import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Sample data for processed videos
const processedVideos = [
  {
    id: "67ffd00d19f02477ee6459ed",
    title: "Road condition in Sector 12",
    location: {
      latitude: 28.5355,
      longitude: 77.3910,
      address: "Sector 12, Noida, UP"
    },
    processed_url: "/videos/67ffd00d19f02477ee6459ed_processed.mp4",
    original_url: "/videos/67ffd00d19f02477ee6459ed_original.mp4",
    thumbnail: "/images/thumbnails/67ffd00d19f02477ee6459ed.jpg",
    detection_summary: {
      broken_road: 103,
      pothole: 72
    },
    created_at: "2023-04-17T10:13:49Z",
    status: "completed",
    duration_seconds: 9.57
  },
  {
    id: "89afd11c45b12478fe8732ab",
    title: "Road inspection in Sector 18",
    location: {
      latitude: 28.5702,
      longitude: 77.3219,
      address: "Sector 18, Noida, UP"
    },
    processed_url: "/videos/89afd11c45b12478fe8732ab_processed.mp4",
    original_url: "/videos/89afd11c45b12478fe8732ab_original.mp4",
    thumbnail: "/images/thumbnails/89afd11c45b12478fe8732ab.jpg",
    detection_summary: {
      broken_road: 87,
      pothole: 65
    },
    created_at: "2023-04-16T15:25:12Z",
    status: "completed",
    duration_seconds: 12.34
  },
  {
    id: "34bde56f78c90123ab45ef67",
    title: "Street condition in Sector 62",
    location: {
      latitude: 28.6280,
      longitude: 77.3649,
      address: "Sector 62, Noida, UP"
    },
    processed_url: "/videos/34bde56f78c90123ab45ef67_processed.mp4",
    original_url: "/videos/34bde56f78c90123ab45ef67_original.mp4",
    thumbnail: "/images/thumbnails/34bde56f78c90123ab45ef67.jpg",
    detection_summary: {
      broken_road: 56,
      pothole: 43
    },
    created_at: "2023-04-15T09:42:18Z",
    status: "completed",
    duration_seconds: 8.21
  }
];

// Add a helper to format video URLs
const formatVideoUrl = (url: string) => {
  if (!url) return "/videos/sample_processed.mp4";
  
  // Return the URL without cache parameter for the listing (will be added when viewing)
  return url;
};

export async function GET() {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    console.log("Connected to MongoDB, fetching processed videos...");
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));
    
    // Look for processed videos in the 'processed' collection
    let videos = [];
    let collectionUsed = "";
    
    // Try various collections that might contain processed videos
    const possibleCollections = ["processed", "processed", "videos", "processedVideos"];
    
    for (const collName of possibleCollections) {
      try {
        const result = await db.collection(collName).find().toArray();
        console.log(`Collection ${collName} has ${result.length} documents`);
        
        if (result && result.length > 0) {
          videos = result;
          collectionUsed = collName;
          console.log(`Using ${result.length} videos from collection ${collName}`);
          break;
        }
      } catch (e) {
        console.log(`Error checking collection ${collName}:`, e);
      }
    }
    
    // If still no videos found, return empty array
    if (!videos || videos.length === 0) {
      console.log("No processed videos found in any collection");
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Log sample video structure for debugging
    if (videos.length > 0) {
      console.log("Sample video structure:", videos[0]);
    }
    
    // Transform processed videos to the expected format
    const formattedVideos = videos.map(video => {
      // Get the ID
      const videoId = video._id ? video._id.toString() : (video.id || "unknown");
      
      // Parse location if it's stored as a JSON string
      let location = video.location;
      if (typeof location === 'string') {
        try {
          const parsedLocation = JSON.parse(location);
          location = parsedLocation.location || parsedLocation;
        } catch (e) {
          console.log("Error parsing location string:", e);
          location = {
            latitude: 28.6139,
            longitude: 77.2090,
            address: "Unknown Location"
          };
        }
      }
      
      // Ensure location has address
      if (location && !location.address) {
        location.address = `${location.latitude}, ${location.longitude}`;
      }
      
      // Format detection summary from extraData if present
      let detectionSummary = {
        broken_road: 0,
        pothole: 0
      };
      
      if (video.extraData && video.extraData.detection_summary) {
        detectionSummary = video.extraData.detection_summary;
      }
      
      // Construct the processed video object
      return {
        id: videoId,
        _id: videoId,
        title: video.title || `Video ${videoId.substring(0, 8)}`,
        location: location || {
          latitude: 28.6139,
          longitude: 77.2090,
          address: "Unknown Location"
        },
        processed_url: formatVideoUrl(video.processedVideoUrl || "/videos/sample_processed.mp4"),
        original_url: formatVideoUrl(video.originalVideoUrl || "/videos/sample_original.mp4"),
        thumbnail: video.thumbnail || "/images/thumbnails/default.jpg",
        detection_summary: detectionSummary,
        created_at: video.createdAt || new Date().toISOString(),
        status: video.status || "completed",
        duration_seconds: video.duration_seconds || video.extraData?.duration_seconds || 10,
        unprocessedId: video.unprocessedId || null
      };
    });
    
    return NextResponse.json({
      success: true,
      data: formattedVideos
    });
  } catch (error) {
    console.error("Error fetching processed videos:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch processed videos"
    }, { status: 500 });
  }
} 