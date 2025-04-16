"use client"

import { useRef, useState, useEffect } from "react"
import { Menu, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [zoomLevel, setZoomLevel] = useState("1X")

  const [permissionsChecked, setPermissionsChecked] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  // Sync recordedChunks to recordedChunksRef
  useEffect(() => {
    recordedChunksRef.current = recordedChunks
  }, [recordedChunks])

  // Ask for permissions and then start camera
  useEffect(() => {
    const requestPermissionsAndStartCamera = async () => {
      try {
        const [stream, position] = await Promise.all([
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

  // Countdown effect
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
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" })
  
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }
  
    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
    setCountdown(10)
  }
  

  const stopRecording = async (): Promise<void> => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return
  
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder) return resolve() // extra safety
  
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
  

  const processVideo = async (chunks: Blob[]) => {
    setStatus("processing")
    setStatusMessage("Processing video...")
  
    try {
      const position = await getCurrentPosition()
      const videoBlob = new Blob(chunks, { type: "video/webm" })
      const videoFile = new File([videoBlob], "recording.webm", { type: "video/webm" })
  
      const formData = new FormData()
      formData.append("video", videoFile)
      formData.append(
        "location",
        JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      )
  
      const response = await fetch("/api/unprocessed/upload", {
        method: "POST",
        body: formData,
      })
  
      if (!response.ok) throw new Error("Failed to upload video")
  
      setStatus("success")
      setStatusMessage("Video uploaded successfully!")
      setTimeout(() => {
        setStatus("idle")
        setStatusMessage("")
      }, 3000)
    } catch (error: any) {
      console.error("Error processing video:", error)
      setStatus("error")
      setStatusMessage("Error uploading video. Please try again.")
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
        <h1 className="text-xl font-bold">Track360 Demo</h1>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {["0.6", "1X", "2"].map((zoom) => (
            <button
              key={zoom}
              className={`rounded-full py-1 px-3 text-sm ${
                zoomLevel === zoom ? "bg-white text-black" : "bg-gray-700 text-white"
              }`}
              onClick={() => setZoomLevel(zoom)}
            >
              {zoom}
            </button>
          ))}
        </div>

        {countdown !== null && (
          <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center">
            {countdown}
          </div>
        )}
      </div>

      <div className="bg-black p-6 flex flex-col items-center">
        <button
          className={`h-16 w-16 rounded-full border-4 ${
            isRecording ? "border-red-500 bg-red-500" : "border-white bg-white"
          } flex items-center justify-center mb-4`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={status === "processing" || !permissionsChecked}
        >
          {isRecording && <div className="h-8 w-8 bg-red-500 rounded-sm" />}
        </button>

        <div className="h-8 flex items-center justify-center">
          {status === "idle" && !isRecording && <p className="text-white text-sm">Tap to record a 10s clip</p>}
          {status === "recording" && <p className="text-red-500 text-sm">Recording... {countdown}s</p>}
          {status === "processing" && (
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
      </div>
    </div>
  )
}
