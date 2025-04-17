"use client";
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Track360 Demo",
//   description: "Record and process video clips with location data",
//   manifest: "/manifest.json",
//   themeColor: "#000000",
//   viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
//   generator: 'v0.dev'
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // This useEffect suppresses hydration warnings from browser extensions
  useEffect(() => {
    // This runs only on the client after hydration
    // It will suppress the specific warning about attributes added by extensions
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Warning: A tree hydrated but some attributes of the server rendered HTML didn\'t match')) {
        // Ignore this specific hydration warning
        return;
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}


import './globals.css'