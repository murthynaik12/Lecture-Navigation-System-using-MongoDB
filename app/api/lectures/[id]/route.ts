import { type NextRequest, NextResponse } from "next/server"
import clientPromise, { isMockMongoDB } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params

    // If using mock MongoDB and ID starts with "mock", return mock data
    if (isMockMongoDB || id.startsWith("mock")) {
      return NextResponse.json({
        _id: id,
        subjectName: "Mock Subject",
        lectureName: "Mock Lecture",
        roomNumber: "M101",
        floor: 1,
        createdAt: new Date(),
      })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lecture ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("campus")

    const lecture = await db.collection("lectures").findOne({ _id: new ObjectId(id) })

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
    }

    return NextResponse.json(lecture)
  } catch (error) {
    console.error("Error fetching lecture:", error)
    return NextResponse.json({ error: "Failed to fetch lecture" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params
    const body = await request.json()

    // If using mock MongoDB or ID starts with "mock", return mock success
    if (isMockMongoDB || id.startsWith("mock")) {
      return NextResponse.json({ success: true })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lecture ID" }, { status: 400 })
    }

    // Validate required fields
    const { subjectName, lectureName, roomNumber, floor } = body

    if (!subjectName || !lectureName || !roomNumber || floor === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("campus")

    const result = await db.collection("lectures").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          subjectName,
          lectureName,
          roomNumber,
          floor: Number(floor),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating lecture:", error)
    return NextResponse.json({ error: "Failed to update lecture" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params

    // If using mock MongoDB or ID starts with "mock", return mock success
    if (isMockMongoDB || id.startsWith("mock")) {
      return NextResponse.json({ success: true })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lecture ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("campus")

    const result = await db.collection("lectures").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lecture:", error)
    return NextResponse.json({ error: "Failed to delete lecture" }, { status: 500 })
  }
}

