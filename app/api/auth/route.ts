import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Check if credentials match
    if (email === "admin@municipal.com" && password === "admin341$") {
      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          email,
          role: "admin",
          name: "Municipal Admin"
        }
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: false,
      message: "Invalid credentials"
    }, { status: 401 });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json({
      success: false,
      message: "An error occurred during authentication"
    }, { status: 500 });
  }
} 