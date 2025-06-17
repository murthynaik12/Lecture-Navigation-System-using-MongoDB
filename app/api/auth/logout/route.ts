import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  cookies().set({
    name: "user_info",
    value: "",
    path: "/",
    maxAge: 0,
  })

  return NextResponse.json({ success: true })
}

