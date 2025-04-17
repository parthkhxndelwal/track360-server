import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { detection_results } from "@/lib/sample-data";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`Fetching video details for ID: ${id}`);
    
    // Check if the ID is a valid ObjectId, if not, try handling it as a string ID
    const isValidObjectId = ObjectId.isValid(id);
    console.log(`ID ${id} is${isValidObjectId ? '' : ' not'} a valid ObjectId`);
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // List available collections for debugging
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));
    
    // Try different collection names for videos
    const possibleCollections = ["processed_videos", "processed", "videos", "processedVideos"];
    
    let video = null;
    let collectionUsed = "";
    
    // Try finding the video in different collections
    for (const collName of possibleCollections) {
      try {
        console.log(`Trying to find video in collection: ${collName}`);
        
        // Try finding by ObjectId if valid
        if (isValidObjectId) {
          const objId = new ObjectId(id);
          video = await db.collection(collName).findOne({ _id: objId });
          if (video) {
            console.log(`Found video in ${collName} by ObjectId`);
            collectionUsed = collName;
            break;
          }
        }
        
        // If not found by ObjectId, try finding by string ID
        video = await db.collection(collName).findOne({ id: id });
        if (video) {
          console.log(`Found video in ${collName} by string ID`);
          collectionUsed = collName;
          break;
        }
      } catch (e) {
        console.log(`Error searching in ${collName}:`, e);
      }
    }
    
    if (!video) {
      console.log(`Video not found with ID: ${id}`);
      
      // If we're in development mode, return sample data
      if (process.env.NODE_ENV === 'development') {
        console.log("Using sample data for development");
        return NextResponse.json({
          success: true,
          data: {
            id: id,
            title: "Road condition in Sector 12 (Sample)",
            location: {
              latitude: 28.5355,
              longitude: 77.3910,
              address: "Sector 12, Noida, UP"
            },
            processed_url: "/videos/sample_processed.mp4",
            original_url: "/videos/sample_original.mp4",
            thumbnail: "/images/thumbnails/default.jpg",
            detection_summary: {
              broken_road: 103,
              pothole: 72
            },
            created_at: new Date().toISOString(),
            status: "completed",
            duration_seconds: 9.57,
            detection_results
          }
        });
      }
      
      return NextResponse.json({
        success: false,
        message: "Video not found"
      }, { status: 404 });
    }
    
    console.log(`Found video with ID: ${id} in ${collectionUsed}`);
    console.log("Video data:", video);
    
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
    
    // Find detection results
    let detectionResults = null;
    try {
      console.log(`Looking for detection results for video: ${id}`);
      detectionResults = await db.collection("detection_results").findOne({ 
        $or: [
          { video_id: id },
          { video_id: video._id ? video._id.toString() : null },
          { unprocessed_id: video.unprocessedId }
        ] 
      });
      
      if (detectionResults) {
        console.log("Found detection results");
      } else {
        console.log("No detection results found, checking extraData");
        // Check if detection data exists in the video's extraData
        if (video.extraData && video.extraData.detections) {
          detectionResults = {
            video_id: id,
            duration_seconds: video.extraData.duration_seconds || 10,
            duration: video.extraData.duration || "0:00:10.000",
            detection_summary: detectionSummary,
            detections: video.extraData.detections
          };
          console.log("Using detection data from extraData");
        } else {
          // Use sample detection results in development
          console.log("Using sample detection results");
          detectionResults = {
            ...detection_results,
            video_id: id
          };
        }
      }
    } catch (e) {
      console.error("Error fetching detection results:", e);
    }
    
    // Format the response
    const videoId = video._id ? video._id.toString() : (video.id || id);
    
    // Update the video URLs to include cache prevention parameters and fix CORS issues
    const formatVideoUrl = (url: string) => {
      if (!url) return "/videos/sample_processed.mp4";
      
      // Add cache prevention
      const cacheParam = `cache=${Date.now()}`;
      const separator = url.includes('?') ? '&' : '?';
      
      // Return the URL with cache prevention
      return url + separator + cacheParam;
    };
    
    const videoDetails = {
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
      unprocessedId: video.unprocessedId || null,
      detection_results: detectionResults
    };
    
    return NextResponse.json({
      success: true,
      data: videoDetails
    });
  } catch (error) {
    console.error("Error fetching video details:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch video details"
    }, { status: 500 });
  }
} 