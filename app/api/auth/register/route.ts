import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "campus-navigation-secret-key"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (role !== "student" && role !== "owner") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("campus")

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = {
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)

    // Create JWT token for immediate login
    const token = jwt.sign(
      {
        _id: result.insertedId.toString(),
        email: email,
        name: name,
        role: role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Set cookie for immediate login
    cookies().set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Return user data without password
    return NextResponse.json(
      {
        user: {
          _id: result.insertedId.toString(),
          email,
          name,
          role,
        },
        success: true,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}

