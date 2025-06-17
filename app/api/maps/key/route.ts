import { NextResponse } from "next/server"

// This endpoint returns a Google Maps script URL with the API key
export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || ""

  // Return just the URL with the API key
  return NextResponse.json({
    scriptUrl: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`,
  })
}

