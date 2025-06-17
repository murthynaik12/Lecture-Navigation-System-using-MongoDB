import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const userInfo = cookies().get("user_info")

    if (!userInfo || !userInfo.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      const user = JSON.parse(userInfo.value)

      return NextResponse.json({
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      })
    } catch (error) {
      console.error("User info parsing error:", error)
      return NextResponse.json({ error: "Invalid user info" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

