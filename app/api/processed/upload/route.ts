// api/processed/upload
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
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "video" }, (error, result) => {
      if (error) return reject(error)
      if (!result) return reject(new Error("No result from Cloudinary"))
      resolve(result.secure_url)
    })

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
    const videoFile = formData.get("video") as File
    const unprocessedId = formData.get("id") as string
    const dataString = formData.get("data") as string | null // New: optional data param

    if (!videoFile || !unprocessedId) {
      return NextResponse.json({ error: "Video file and unprocessed ID are required" }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await videoFile.arrayBuffer())

    // Upload to Cloudinary
    const processedVideoUrl = await uploadToCloudinary(buffer)

    // Store in MongoDB and update unprocessed record
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const unprocessedCollection = db.collection(COLLECTION_NAME)
    const processedCollection = db.collection(PROCESSED_COLLECTION)

    // Find the unprocessed record
    const unprocessedRecord = await unprocessedCollection.findOne({
      _id: new ObjectId(unprocessedId),
    })

    if (!unprocessedRecord) {
      return NextResponse.json({ error: "Unprocessed record not found" }, { status: 404 })
    }

    // Optional: parse 'data' as JSON
    let extraData = null
    if (dataString) {
      try {
        extraData = JSON.parse(dataString)
      } catch (error) {
        console.error("Invalid JSON in 'data' field:", dataString)
        return NextResponse.json({ error: "Invalid JSON in 'data' field" }, { status: 400 })
      }
    }

    // Insert processed record with optional data
    const processedResult = await processedCollection.insertOne({
      unprocessedId: new ObjectId(unprocessedId),
      originalVideoUrl: unprocessedRecord.videoUrl,
      processedVideoUrl,
      location: unprocessedRecord.location,
      createdAt: new Date(),
      ...(extraData && { extraData }), // only include if present
    })

    // Update unprocessed record
    await unprocessedCollection.updateOne(
      { _id: new ObjectId(unprocessedId) },
      { $set: { processed: true, processedId: processedResult.insertedId } },
    )

    return NextResponse.json({
      success: true,
      id: processedResult.insertedId.toString(),
      processedVideoUrl,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}

