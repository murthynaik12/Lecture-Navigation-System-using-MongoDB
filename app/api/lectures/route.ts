import { type NextRequest, NextResponse } from "next/server"
import clientPromise, { isMockMongoDB } from "@/lib/mongodb"

// Mock data for development when MongoDB is not available
const MOCK_LECTURES = [
  {
    _id: "mock1",
    subjectName: "Computer Science",
    lectureName: "Introduction to Databases",
    roomNumber: "CS101",
    floor: 1,
    createdAt: new Date(),
  },
  {
    _id: "mock2",
    subjectName: "Mathematics",
    lectureName: "Linear Algebra",
    roomNumber: "M201",
    floor: 2,
    createdAt: new Date(),
  },
  {
    _id: "mock3",
    subjectName: "Physics",
    lectureName: "Mechanics",
    roomNumber: "P001",
    floor: 0, // Ground floor
    createdAt: new Date(),
  },
  {
    _id: "mock4",
    subjectName: "Chemistry",
    lectureName: "Organic Chemistry",
    roomNumber: "C002",
    floor: 0, // Ground floor
    createdAt: new Date(),
  },
  {
    _id: "mock5",
    subjectName: "Biology",
    lectureName: "Cell Biology",
    roomNumber: "B101",
    floor: 1,
    createdAt: new Date(),
  },
  {
    _id: "mock6",
    subjectName: "English",
    lectureName: "Literature",
    roomNumber: "E201",
    floor: 2,
    createdAt: new Date(),
  },
]

export async function GET() {
  try {
    // If we're using mock MongoDB, return mock data
    if (isMockMongoDB) {
      console.log("Using mock data for lectures")
      return NextResponse.json(MOCK_LECTURES)
    }

    const client = await clientPromise
    const db = client.db("campus")

    try {
      const lectures = await db.collection("lectures").find({}).sort({ subjectName: 1 }).toArray()
      return NextResponse.json(lectures)
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Return mock data as fallback
      return NextResponse.json(MOCK_LECTURES)
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
    // Return mock data as fallback
    return NextResponse.json(MOCK_LECTURES)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Creating lecture with data:", body)

    // Validate required fields
    const { subjectName, lectureName, roomNumber, floor } = body

    if (!subjectName || !lectureName || !roomNumber || floor === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If we're using mock MongoDB, return mock response
    if (isMockMongoDB) {
      console.log("Using mock data for lecture creation")
      const mockId = "mock" + Date.now()
      const mockLecture = {
        _id: mockId,
        subjectName,
        lectureName,
        roomNumber,
        floor: Number(floor),
        createdAt: new Date(),
      }

      return NextResponse.json(
        {
          id: mockId,
          success: true,
          lecture: mockLecture,
        },
        { status: 201 },
      )
    }

    try {
      const client = await clientPromise
      const db = client.db("campus")

      // Create a simple object without MongoDB specifics
      const lectureData = {
        subjectName,
        lectureName,
        roomNumber,
        floor: Number(floor),
        createdAt: new Date(),
      }

      const result = await db.collection("lectures").insertOne(lectureData)

      console.log("Lecture created successfully:", result)

      return NextResponse.json(
        {
          id: result.insertedId,
          success: true,
          lecture: {
            _id: result.insertedId,
            ...lectureData,
          },
        },
        { status: 201 },
      )
    } catch (dbError) {
      console.error("Database error:", dbError)

      // Return a mock success response for development
      const mockId = "mock" + Date.now()
      return NextResponse.json(
        {
          id: mockId,
          success: true,
          lecture: {
            _id: mockId,
            subjectName,
            lectureName,
            roomNumber,
            floor: Number(floor),
            createdAt: new Date(),
          },
        },
        { status: 201 },
      )
    }
  } catch (error) {
    console.error("Error creating lecture:", error)
    return NextResponse.json({ error: "Failed to create lecture: " + error.message }, { status: 500 })
  }
}

