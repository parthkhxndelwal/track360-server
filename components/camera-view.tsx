"use client"

import { useRef, useState, useEffect } from "react"
import { X, Check, Loader2 } from "lucide-react"

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "uploading" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [permissionsChecked, setPermissionsChecked] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  useEffect(() => {
    recordedChunksRef.current = recordedChunks
  }, [recordedChunks])

  useEffect(() => {
    const requestPermissionsAndStartCamera = async () => {
      try {
        const [stream, _position] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: true,
          }),
          getCurrentPosition(),
        ])

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        setPermissionsChecked(true)
      } catch (err: any) {
        console.error("Permission error:", err)
        let message = "Unknown error occurred."

        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          message = "Please allow camera and location access to use this feature."
        } else if (err.message?.includes("Geolocation")) {
          message = "Location permission denied. Please enable it in your browser settings."
        } else if (err.message) {
          message = err.message
        }

        setPermissionError(message)
      }
    }

    requestPermissionsAndStartCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => (prev !== null ? prev - 1 : null)), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      stopRecording()
    }
  }, [countdown])

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return

    setStatus("recording")
    setStatusMessage("Recording video...")
    recordedChunksRef.current = []
    setRecordedChunks([])

    const stream = videoRef.current.srcObject as MediaStream
    const options = MediaRecorder.isTypeSupported("video/webm")
      ? { mimeType: "video/webm" }
      : undefined

    const mediaRecorder = new MediaRecorder(stream, options)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
    setCountdown(5)
  }

  const stopRecording = async (): Promise<void> => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder) return resolve()

      recorder.onstop = async () => {
        const chunks = recordedChunksRef.current
        if (chunks.length > 0) {
          await processVideo(chunks)
        } else {
          setStatus("error")
          setStatusMessage("No video data was recorded.")
        }
        resolve()
      }

      recorder.stop()
      setIsRecording(false)
      setCountdown(null)
    })
  }

  const handleRecordButton = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const processVideo = async (chunks: Blob[]) => {
    setStatus("processing")
    setStatusMessage("Processing video...")

    try {
      const position = await getCurrentPosition()
      const videoBlob = new Blob(chunks, { type: "video/webm" })
      const videoFile = new File([videoBlob], "recording.webm", { type: "video/webm" })

      // Step 1: Get signed upload credentials
      setStatusMessage("Getting upload signature...")
      const signResponse = await fetch("/api/unprocessed/sign-upload")
      if (!signResponse.ok) throw new Error("Failed to get upload signature")
      
      const signData = await signResponse.json()
      console.log("Sign data received:", signData)
      
      // Step 2: Upload directly to Cloudinary
      setStatus("uploading")
      setStatusMessage("Uploading to cloud...")
      
      // Parameters must be in exactly the same order as they were signed
      const cloudinaryFormData = new FormData()
      
      // Add the file first (not part of signature)
      cloudinaryFormData.append("file", videoFile)
      
      // Add signed parameters in exact order they were signed
      cloudinaryFormData.append("folder", signData.folder)
      cloudinaryFormData.append("timestamp", signData.timestamp.toString())
      
      // Add the API key and signature (not part of the string that was signed)
      cloudinaryFormData.append("api_key", signData.apiKey)
      cloudinaryFormData.append("signature", signData.signature)
      
      // Log form data entries (for debugging)
      const formDataEntries: Record<string, any> = {};
      cloudinaryFormData.forEach((value, key) => {
        formDataEntries[key] = value instanceof File ? value.name : value;
      });
      console.log("Form data entries:", formDataEntries);
      
      // Set resource_type in the URL, not as a form parameter
      try {
        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`,
          {
            method: "POST",
            body: cloudinaryFormData,
          }
        )
        
        // Get response body even if it's an error
        const cloudinaryText = await cloudinaryResponse.text()
        let cloudinaryResult
        
        try {
          cloudinaryResult = JSON.parse(cloudinaryText)
        } catch (e) {
          throw new Error(`Invalid response from Cloudinary: ${cloudinaryText}`)
        }
        
        if (!cloudinaryResponse.ok) {
          throw new Error(`Cloudinary error: ${cloudinaryResult.error?.message || cloudinaryText}`)
        }
        
        if (!cloudinaryResult.secure_url) {
          throw new Error("No secure URL in Cloudinary response")
        }
        
        // Step 3: Send the video URL to our API
        setStatusMessage("Saving recording...")
        const apiResponse = await fetch("/api/unprocessed/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoUrl: cloudinaryResult.secure_url,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          }),
        })

        if (!apiResponse.ok) throw new Error("Failed to save recording")

        setStatus("success")
        setStatusMessage("Video uploaded successfully!")
        setTimeout(() => {
          setStatus("idle")
          setStatusMessage("")
        }, 2000)
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError)
        throw cloudinaryError
      }
    } catch (error: any) {
      console.error("Error processing video:", error)
      setStatus("error")
      setStatusMessage(error.message || "Error uploading video. Please try again.")
    }
  }

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      })
    })
  }

  return (
    <div className="relative flex flex-col h-screen w-full max-w-md mx-auto">
      {!permissionsChecked && permissionError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-6 text-center">
          <p className="text-lg font-semibold mb-4">{permissionError}</p>
          <p className="text-sm">Please grant both camera and location access to continue.</p>
        </div>
      )}

      <div className="flex justify-between items-center p-4 bg-black">
        <h1 className="text-xl font-bold text-white">Track360 Demo</h1>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover">
          Your browser does not support the video tag.
        </video>
        {countdown !== null && (
          <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center">
            {countdown}
          </div>
        )}
      </div>

      <div className="bg-black p-6 flex flex-col items-center space-y-4">
        <div className="h-8 flex items-center justify-center">
          {status === "idle" && !isRecording && <p className="text-white text-sm">Tap to record a 5s clip</p>}
          {status === "recording" && <p className="text-red-500 text-sm">Recording... {countdown}s</p>}
          {status === "processing" && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <p className="text-white text-sm">{statusMessage}</p>
            </div>
          )}
          {status === "uploading" && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <p className="text-white text-sm">{statusMessage}</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <p className="text-green-500 text-sm">{statusMessage}</p>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <p className="text-red-500 text-sm">{statusMessage}</p>
            </div>
          )}
        </div>

        <button
          className={`h-16 w-16 rounded-full border-4 ${
            isRecording ? "border-red-500 bg-red-500" : "border-white bg-white"
          } flex items-center justify-center`}
          onClick={handleRecordButton}
          disabled={status === "processing" || status === "uploading" || !permissionsChecked}
        >
          {isRecording && <div className="h-8 w-8 bg-red-500 rounded-sm" />}
        </button>
      </div>
    </div>
  )
}