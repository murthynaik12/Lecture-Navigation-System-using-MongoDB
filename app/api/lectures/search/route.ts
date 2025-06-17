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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json([])
    }

    // If we're using mock MongoDB, filter mock data
    if (isMockMongoDB) {
      console.log("Using mock data for search")
      const searchTerm = query.toLowerCase()
      const results = MOCK_LECTURES.filter(
        (lecture) =>
          lecture.subjectName.toLowerCase().includes(searchTerm) ||
          lecture.lectureName.toLowerCase().includes(searchTerm) ||
          lecture.roomNumber.toLowerCase().includes(searchTerm),
      )
      return NextResponse.json(results)
    }

    const client = await clientPromise
    const db = client.db("campus")

    // Create a text index if it doesn't exist
    try {
      await db.collection("lectures").createIndex({
        subjectName: "text",
        lectureName: "text",
        roomNumber: "text",
      })
    } catch (error) {
      // Index might already exist, continue
    }

    // Search using text index and also with regex for partial matches
    const lectures = await db
      .collection("lectures")
      .find({
        $or: [
          { $text: { $search: query } },
          { subjectName: { $regex: query, $options: "i" } },
          { lectureName: { $regex: query, $options: "i" } },
          { roomNumber: { $regex: query, $options: "i" } },
        ],
      })
      .sort({ subjectName: 1 })
      .toArray()

    return NextResponse.json(lectures)
  } catch (error) {
    console.error("Error searching lectures:", error)
    return NextResponse.json({ error: "Failed to search lectures" }, { status: 500 })
  }
}

