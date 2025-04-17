"use client";
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { useEffect } from "react"
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Track360 - Urban Issues Monitoring Platform",
//   description: "Real-time monitoring of urban issues across India",
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
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} dark:bg-gray-950 dark:text-gray-50`} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" theme="dark" />
        </AuthProvider>
      </body>
    </html>
  )
}


import './globals.css'