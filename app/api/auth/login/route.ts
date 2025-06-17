import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Hardcoded users as requested
const USERS = [
  {
    _id: "student123",
    email: "murti",
    password: "123",
    name: "Murti",
    role: "student",
  },
  {
    _id: "owner456",
    email: "murthy",
    password: "1234",
    name: "Murthy",
    role: "owner",
  },
  // Add the demo credentials from the login page
  {
    _id: "student789",
    email: "student",
    password: "password",
    name: "Student User",
    role: "student",
  },
  {
    _id: "admin123",
    email: "admin",
    password: "password",
    name: "Admin User",
    role: "owner",
  },
]

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("Login attempt:", { email, password })

    if (!email || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Find user by email/username
    const user = USERS.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Verify password (simple comparison since we're using hardcoded passwords)
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Set a simple cookie with user info
    const userInfo = JSON.stringify({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    cookies().set({
      name: "user_info",
      value: userInfo,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error logging in:", error)
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 })
  }
}

