import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { MongoClient } from "mongodb"
import { Readable } from "stream"

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dicoct0d5",
  api_key: "442326139894171",
  api_secret: "sm40aNpj-tKDE8SUOB5CDrJFChQ",
})

// MongoDB connection
const MONGODB_URI =
  "mongodb+srv://parthkhandelwal:parthcodesop@devcluster.5tuzejk.mongodb.net/?retryWrites=true&w=majority&appName=devCluster"
const DB_NAME = "track360"
const COLLECTION_NAME = "unprocessed"

let cachedClient: MongoClient | null = null

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  cachedClient = client
  return client
}

// Helper function to upload to Cloudinary
async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = (cloudinary.uploader as any).upload_stream(
      { resource_type: "video" },
      (error: any, result: any) => {
        if (error) return reject(error)
        if (!result) return reject(new Error("No result from Cloudinary"))
        resolve(result.secure_url)
      }
    )
    
    const readable = new Readable()
    readable._read = () => {} // _read is required but you can noop it
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const locationString = formData.get("location") as string
    const videoURL = formData.get("videoURL") as string

    if (!locationString) {
      return NextResponse.json({ error: "Location data is required" }, { status: 400 })
    }

    // Parse location data
    const location = JSON.parse(locationString)
    
    let videoUrl: string;
    
    // Check if videoURL is provided in the request
    if (videoURL) {
      // Use the provided videoURL directly
      videoUrl = videoURL;
    } else {
      // If no videoURL, check for video file
      const videoFile = formData.get("video") as File
      if (!videoFile) {
        return NextResponse.json({ error: "Either video file or videoURL is required" }, { status: 400 })
      }
      
      // Convert file to buffer
      const buffer = Buffer.from(await videoFile.arrayBuffer())
      
      // Upload to Cloudinary
      videoUrl = await uploadToCloudinary(buffer)
    }

    // Store in MongoDB
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    const result = await collection.insertOne({
      videoUrl,
      location,
      createdAt: new Date(),
      processed: false,
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      videoUrl,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}