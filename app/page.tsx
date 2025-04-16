"use client"

import { useEffect, useState } from "react"
import CameraView from "@/components/camera-view"

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [showInstallOverlay, setShowInstallOverlay] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallOverlay(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      // @ts-ignore
      deferredPrompt.prompt()
      // Wait for the user to respond
      // @ts-ignore
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowInstallOverlay(false)
      }
      setDeferredPrompt(null)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white relative">
      <CameraView />

      {showInstallOverlay && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-2xl font-semibold mb-4">Install as an App to continue</h2>
          <button
            onClick={handleInstallClick}
            className="bg-white text-black px-6 py-2 rounded-lg text-lg font-medium hover:bg-gray-200 transition"
          >
            Install App
          </button>
        </div>
      )}
    </main>
  )
}
