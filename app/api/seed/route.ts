import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

const sampleVideos = [
  {
    title: "Road condition in Sector 12",
    location: {
      latitude: 28.5355,
      longitude: 77.3910,
      address: "Sector 12, Noida, UP"
    },
    originalVideoUrl: "https://sahil-track.b-cdn.net/videos/sample_original.mp4",
    processedVideoUrl: "https://sahil-track.b-cdn.net/videos/sample_processed.mp4",
    thumbnail: "/images/thumbnails/default.jpg",
    unprocessedId: "sample_unprocessed_1",
    createdAt: new Date("2023-04-17T10:13:49Z").toISOString(),
    status: "completed",
    extraData: {
      duration_seconds: 9.57,
      detection_summary: {
        broken_road: 103,
        pothole: 72
      }
    }
  },
  {
    title: "Road inspection in Sector 18",
    location: {
      latitude: 28.5702,
      longitude: 77.3219,
      address: "Sector 18, Noida, UP"
    },
    originalVideoUrl: "https://sahil-track.b-cdn.net/videos/sample_original.mp4",
    processedVideoUrl: "https://sahil-track.b-cdn.net/videos/sample_processed.mp4",
    thumbnail: "/images/thumbnails/default.jpg",
    unprocessedId: "sample_unprocessed_2",
    createdAt: new Date("2023-04-16T15:25:12Z").toISOString(),
    status: "completed",
    extraData: {
      duration_seconds: 12.34,
      detection_summary: {
        broken_road: 87,
        pothole: 65
      }
    }
  },
  {
    title: "Street condition in Sector 62",
    location: {
      latitude: 28.6280,
      longitude: 77.3649,
      address: "Sector 62, Noida, UP"
    },
    originalVideoUrl: "https://sahil-track.b-cdn.net/videos/sample_original.mp4",
    processedVideoUrl: "https://sahil-track.b-cdn.net/videos/sample_processed.mp4",
    thumbnail: "/images/thumbnails/default.jpg",
    unprocessedId: "sample_unprocessed_3",
    createdAt: new Date("2023-04-15T09:42:18Z").toISOString(),
    status: "completed",
    extraData: {
      duration_seconds: 8.21,
      detection_summary: {
        broken_road: 56,
        pothole: 43
      }
    }
  }
];

const sampleDetectionResults = {
  video_id: "",  // Will be filled when seeding
  unprocessed_id: "sample_unprocessed_1",
  video_file: "sample_video_20250417_001349.mkv",
  duration_seconds: 9.57,
  duration: "0:00:09.570000",
  detection_summary: {
    broken_road: 103,
    pothole: 72
  },
  detections: [
    {
      timestamp_seconds: 0.0,
      timestamp: "0:00:00",
      detections: [
        {
          category: "broken_road",
          class: "broken_road",
          confidence: 0.95,
          bounding_box: [1489.0, 866.0, 1620.0, 959.0]
        }
      ]
    },
    {
      timestamp_seconds: 2.5,
      timestamp: "0:00:02.500",
      detections: [
        {
          category: "pothole",
          class: "pothole",
          confidence: 0.92,
          bounding_box: [1493.0, 867.0, 1620.0, 944.0]
        },
        {
          category: "broken_road",
          class: "broken_road",
          confidence: 0.88,
          bounding_box: [1200.0, 800.0, 1400.0, 900.0]
        }
      ]
    },
    {
      timestamp_seconds: 5.0,
      timestamp: "0:00:05.000",
      detections: [
        {
          category: "pothole",
          class: "pothole",
          confidence: 0.95,
          bounding_box: [800.0, 600.0, 950.0, 750.0]
        }
      ]
    },
    {
      timestamp_seconds: 8.0,
      timestamp: "0:00:08.000",
      detections: [
        {
          category: "broken_road",
          class: "broken_road",
          confidence: 0.91,
          bounding_box: [400.0, 300.0, 600.0, 450.0]
        }
      ]
    }
  ]
};

export async function GET() {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Check if videos collection exists, create it if it doesn't
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Choose which collection to use based on what exists
    // Use 'processed' to match your existing database structure
    let videoCollection = "processed";
    
    console.log(`Using collection: ${videoCollection}`);
    
    // Check if we already have videos
    const existingVideos = await db.collection(videoCollection).countDocuments();
    console.log(`Found ${existingVideos} existing videos`);
    
    if (existingVideos > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already contains ${existingVideos} videos. No seeding needed.`
      });
    }
    
    // Create collection if it doesn't exist
    if (!collectionNames.includes(videoCollection)) {
      await db.createCollection(videoCollection);
      console.log(`Created ${videoCollection} collection`);
    }
    
    // Insert sample videos
    const result = await db.collection(videoCollection).insertMany(sampleVideos);
    console.log(`Inserted ${result.insertedCount} sample videos`);
    
    // Add detection results for the first video
    if (result.insertedIds && result.insertedIds[0]) {
      const firstVideoId = result.insertedIds[0].toString();
      
      // Update detection results with the video ID
      const detectionResult = {
        ...sampleDetectionResults,
        video_id: firstVideoId
      };
      
      // Create detection_results collection if it doesn't exist
      if (!collectionNames.includes("detection_results")) {
        await db.createCollection("detection_results");
      }
      
      // Insert detection results
      await db.collection("detection_results").insertOne(detectionResult);
      console.log(`Inserted detection results for video ${firstVideoId}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded database with ${sampleVideos.length} videos`
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to seed database"
    }, { status: 500 });
  }
}