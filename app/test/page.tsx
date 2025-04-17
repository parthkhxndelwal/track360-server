"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, Check, X } from "lucide-react"

export default function TestPage() {
  // State for test results
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [signedUrlResults, setSignedUrlResults] = useState<any>(null)
  const [latestVideoResults, setLatestVideoResults] = useState<any>(null)
  const [processedUploadResults, setProcessedUploadResults] = useState<any>(null)
  const [directUploadResults, setDirectUploadResults] = useState<any>(null)
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false)
  const [isGettingSignedUrl, setIsGettingSignedUrl] = useState(false)
  const [isGettingLatestVideo, setIsGettingLatestVideo] = useState(false)
  const [isUploadingProcessed, setIsUploadingProcessed] = useState(false)
  const [isDirectUploading, setIsDirectUploading] = useState(false)
  
  // Form refs
  const videoFileRef = useRef<HTMLInputElement>(null)
  const processedVideoFileRef = useRef<HTMLInputElement>(null)
  const directUploadVideoFileRef = useRef<HTMLInputElement>(null)
  
  // Form Data
  const [processingData, setProcessingData] = useState("")
  const [latestVideoId, setLatestVideoId] = useState("")
  const [directUploadLocation, setDirectUploadLocation] = useState(
    JSON.stringify({ latitude: 37.7749, longitude: -122.4194 })
  )
  
  // Handle regular upload (current implementation)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      if (videoFileRef.current?.files?.[0]) {
        formData.append("video", videoFileRef.current.files[0])
        formData.append("location", JSON.stringify({ latitude: 37.7749, longitude: -122.4194 }))
        
        const response = await fetch("/api/unprocessed/upload", {
          method: "POST",
          body: formData,
        })
        
        const result = await response.json()
        setUploadResults(result)
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      setUploadResults({ error: "Failed to upload video" })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Get signed URL from Cloudinary
  const getSignedUrl = async () => {
    setIsGettingSignedUrl(true)
    
    try {
      const response = await fetch("/api/processed/sign-upload")
      const result = await response.json()
      setSignedUrlResults(result)
    } catch (error) {
      console.error("Error getting signed URL:", error)
      setSignedUrlResults({ error: "Failed to get signed URL" })
    } finally {
      setIsGettingSignedUrl(false)
    }
  }
  
  // Get latest unprocessed video
  const getLatestVideo = async () => {
    setIsGettingLatestVideo(true)
    
    try {
      const response = await fetch("/api/latest/unprocessed/videourl")
      const result = await response.json()
      setLatestVideoResults(result)
      if (result.id) {
        setLatestVideoId(result.id)
      }
    } catch (error) {
      console.error("Error getting latest video:", error)
      setLatestVideoResults({ error: "Failed to get latest video" })
    } finally {
      setIsGettingLatestVideo(false)
    }
  }
  
  // Handle processed video upload
  const handleProcessedUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploadingProcessed(true)
    
    try {
      if (!latestVideoId) {
        setProcessedUploadResults({ error: "No video ID provided" })
        return
      }
      
      // For this test, we'll use the file directly
      const videoFile = processedVideoFileRef.current?.files?.[0]
      if (!videoFile) {
        setProcessedUploadResults({ error: "No video file selected" })
        return
      }
      
      // Upload to Cloudinary first
      const formData = new FormData()
      formData.append("file", videoFile)
      formData.append("upload_preset", "processed-videos") // You may need to create this preset in Cloudinary
      
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/dicoct0d5/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      )
      
      const cloudinaryResult = await cloudinaryResponse.json()
      
      if (!cloudinaryResult.secure_url) {
        throw new Error("Failed to upload to Cloudinary")
      }
      
      // Now save the processed video info
      const data = processingData ? JSON.parse(processingData) : {}
      const response = await fetch("/api/processed/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: cloudinaryResult.secure_url,
          id: latestVideoId,
          data: processingData,
        }),
      })
      
      const result = await response.json()
      setProcessedUploadResults(result)
    } catch (error) {
      console.error("Error uploading processed video:", error)
      setProcessedUploadResults({ error: "Failed to upload processed video" })
    } finally {
      setIsUploadingProcessed(false)
    }
  }
  
  // Direct upload to Cloudinary and then to your API
  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDirectUploading(true)
    
    try {
      // 1. Get signed URL for upload
      const signResponse = await fetch("/api/unprocessed/sign-upload")
      const signData = await signResponse.json()
      
      if (!signData.signature) {
        throw new Error("Failed to get signature for upload")
      }
      
      // 2. Upload to Cloudinary directly
      const videoFile = directUploadVideoFileRef.current?.files?.[0]
      if (!videoFile) {
        setDirectUploadResults({ error: "No video file selected" })
        return
      }
      
      const formData = new FormData()
      formData.append("file", videoFile)
      formData.append("api_key", signData.apiKey)
      formData.append("timestamp", signData.timestamp.toString())
      formData.append("signature", signData.signature)
      formData.append("folder", "unprocessed-videos")
      
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      )
      
      const cloudinaryResult = await cloudinaryResponse.json()
      
      if (!cloudinaryResult.secure_url) {
        throw new Error("Failed to upload to Cloudinary")
      }
      
      // 3. Post to your API with the Cloudinary URL
      const apiFormData = new FormData()
      apiFormData.append("videoURL", cloudinaryResult.secure_url)
      apiFormData.append("location", directUploadLocation)
      
      const apiResponse = await fetch("/api/unprocessed/upload", {
        method: "POST",
        body: apiFormData,
      })
      
      const result = await apiResponse.json()
      setDirectUploadResults(result)
    } catch (error) {
      console.error("Error with direct upload:", error)
      setDirectUploadResults({ error: "Failed direct upload process" })
    } finally {
      setIsDirectUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API Testing Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Test 1: Regular Upload */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Test Unprocessed Upload (Current)</h2>
          <form onSubmit={handleUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Video File:
              </label>
              <input
                type="file"
                ref={videoFileRef}
                accept="video/*"
                className="w-full border p-2 rounded"
              />
            </div>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Video"
              )}
            </button>
          </form>
          
          {uploadResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre>{JSON.stringify(uploadResults, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Test 2: Get Signed URL */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Test Sign-Upload Endpoint</h2>
          <button
            onClick={getSignedUrl}
            disabled={isGettingSignedUrl}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            {isGettingSignedUrl ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Signed URL...
              </>
            ) : (
              "Get Signed URL"
            )}
          </button>
          
          {signedUrlResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre>{JSON.stringify(signedUrlResults, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Test 3: Get Latest Unprocessed Video */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Test Latest Unprocessed Video</h2>
          <button
            onClick={getLatestVideo}
            disabled={isGettingLatestVideo}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            {isGettingLatestVideo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Latest Video...
              </>
            ) : (
              "Get Latest Unprocessed Video"
            )}
          </button>
          
          {latestVideoResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre>{JSON.stringify(latestVideoResults, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Test 4: Process Upload */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Test Processed Upload</h2>
          <form onSubmit={handleProcessedUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Unprocessed Video ID:
              </label>
              <input
                type="text"
                value={latestVideoId}
                onChange={(e) => setLatestVideoId(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="ID from latest video"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Processed Video File:
              </label>
              <input
                type="file"
                ref={processedVideoFileRef}
                accept="video/*"
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Additional Processing Data (JSON):
              </label>
              <textarea
                value={processingData}
                onChange={(e) => setProcessingData(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder='{"example": "data"}'
                rows={3}
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isUploadingProcessed}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            >
              {isUploadingProcessed ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Processed Video"
              )}
            </button>
          </form>
          
          {processedUploadResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre>{JSON.stringify(processedUploadResults, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Test 5: Direct Cloudinary Upload */}
        <div className="border rounded-lg p-6 space-y-4 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold">Test Direct Cloudinary Upload Flow</h2>
          <form onSubmit={handleDirectUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Video File:
              </label>
              <input
                type="file"
                ref={directUploadVideoFileRef}
                accept="video/*"
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Location Data (JSON):
              </label>
              <textarea
                value={directUploadLocation}
                onChange={(e) => setDirectUploadLocation(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder='{"latitude": 37.7749, "longitude": -122.4194}'
                rows={3}
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isDirectUploading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            >
              {isDirectUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading via Cloudinary...
                </>
              ) : (
                "Upload via Cloudinary"
              )}
            </button>
          </form>
          
          {directUploadResults && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre>{JSON.stringify(directUploadResults, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}