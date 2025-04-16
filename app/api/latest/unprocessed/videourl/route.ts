import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

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

export async function GET() {
  try {
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    // Get the most recent unprocessed video
    const latestVideo = await collection.find({ processed: false }).sort({ createdAt: -1 }).limit(1).toArray()

    if (latestVideo.length === 0) {
      return NextResponse.json({ error: "No unprocessed videos found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      id: latestVideo[0]._id.toString(),
      videoUrl: latestVideo[0].videoUrl,
      location: latestVideo[0].location,
    })
  } catch (error) {
    console.error("Error fetching latest video:", error)
    return NextResponse.json({ error: "Failed to fetch latest video" }, { status: 500 })
  }
}
