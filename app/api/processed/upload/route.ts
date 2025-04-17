// api/processed/upload
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary"
import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { MongoClient, ObjectId } from "mongodb"
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
const PROCESSED_COLLECTION = "processed"

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
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) return reject(error)
        if (!result) return reject(new Error("No result from Cloudinary"))
        resolve(result.secure_url)
      }
    )

    const readable = new Readable()
    readable._read = () => {}
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoUrl, id: unprocessedId, data: dataString } = body

    if (!videoUrl || !unprocessedId) {
      return NextResponse.json({ error: "Video URL and unprocessed ID are required" }, { status: 400 })
    }

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const unprocessedCollection = db.collection(COLLECTION_NAME)
    const processedCollection = db.collection(PROCESSED_COLLECTION)

    const unprocessedRecord = await unprocessedCollection.findOne({
      _id: new ObjectId(unprocessedId),
    })

    if (!unprocessedRecord) {
      return NextResponse.json({ error: "Unprocessed record not found" }, { status: 404 })
    }

    let extraData = null
    if (dataString) {
      try {
        extraData = JSON.parse(dataString)
      } catch {
        return NextResponse.json({ error: "Invalid JSON in 'data'" }, { status: 400 })
      }
    }

    const processedResult = await processedCollection.insertOne({
      unprocessedId: new ObjectId(unprocessedId),
      originalVideoUrl: unprocessedRecord.videoUrl,
      processedVideoUrl: videoUrl,
      location: unprocessedRecord.location,
      createdAt: new Date(),
      ...(extraData && { extraData }),
    })

    await unprocessedCollection.updateOne(
      { _id: new ObjectId(unprocessedId) },
      { $set: { processed: true, processedId: processedResult.insertedId } }
    )

    return NextResponse.json({
      success: true,
      id: processedResult.insertedId.toString(),
      processedVideoUrl: videoUrl,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}
