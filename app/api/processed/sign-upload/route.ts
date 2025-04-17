// api/processed/sign-upload.ts
import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: "dicoct0d5",
  api_key: "442326139894171",
  api_secret: "sm40aNpj-tKDE8SUOB5CDrJFChQ",
})

// Sample response payload:
/*
GET /api/processed/sign-upload

Response:
{
  "timestamp": 1703187600, // Unix timestamp in seconds
  "signature": "a1b2c3d4e5f6g7h8i9j0...", // Generated signature for upload
  "apiKey": "442326139894171",
  "cloudName": "dicoct0d5"
}
*/

export async function GET(req: NextRequest) {
  const timestamp = Math.floor(Date.now() / 1000)

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "processed-videos", // Optional folder
      resource_type: "video",
    },
    cloudinary.config().api_secret as string
  )

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: cloudinary.config().api_key,
    cloudName: cloudinary.config().cloud_name,
  })
}
