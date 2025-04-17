import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import * as crypto from "crypto"

cloudinary.config({
  cloud_name: "dicoct0d5",
  api_key: "442326139894171",
  api_secret: "sm40aNpj-tKDE8SUOB5CDrJFChQ",
})

// Sample response payload:
/*
GET /api/unprocessed/sign-upload

Response:
{
  "timestamp": 1703187600, // Unix timestamp in seconds
  "signature": "a1b2c3d4e5f6g7h8i9j0...", // Generated signature for upload
  "apiKey": "442326139894171",
  "cloudName": "dicoct0d5"
}
*/

export async function GET(req: NextRequest) {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const cloudName = cloudinary.config().cloud_name
    const apiKey = cloudinary.config().api_key
    const apiSecret = cloudinary.config().api_secret as string
    const folder = "unprocessed-videos"
    
    // Build the string to sign exactly as Cloudinary expects
    const toSign = `folder=${folder}&timestamp=${timestamp}`
    
    // Calculate signature using SHA-1
    const signature = crypto
      .createHash("sha1")
      .update(toSign + apiSecret)
      .digest("hex")
    
    console.log("API signature generation:", {
      toSign,
      signature
    })

    return NextResponse.json({
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
    })
  } catch (error) {
    console.error("Error generating signature:", error)
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 })
  }
} 