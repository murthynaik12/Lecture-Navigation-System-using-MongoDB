"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import type { Lecture } from "@/lib/models"

export default function LectureList() {
  const { session } = useAuth()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isOwner = session?.user?.role === "owner"
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/lectures")

        if (!response.ok) {
          throw new Error("Failed to fetch lectures")
        }

        const data = await response.json()

        // Ensure data is an array
        const lecturesArray = Array.isArray(data) ? data : []
        setLectures(lecturesArray)

        // Check if we're in demo mode (mock data)
        if (lecturesArray.length > 0 && lecturesArray[0]._id?.startsWith("mock")) {
          setIsDemoMode(true)
        }
      } catch (error) {
        console.error("Error fetching lectures:", error)
        setError("Failed to load lectures. Please try again later.")
        setIsDemoMode(true) // Assume demo mode if there's an error
      } finally {
        setLoading(false)
      }
    }

    fetchLectures()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lecture?")) {
      try {
        const response = await fetch(`/api/lectures/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setLectures(lectures.filter((lecture) => lecture._id !== id))
          toast({
            title: "Success",
            description: "Lecture deleted successfully",
          })
        } else {
          throw new Error("Failed to delete lecture")
        }
      } catch (error) {
        console.error("Error deleting lecture:", error)
        toast({
          title: "Error",
          description: "Failed to delete lecture",
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading lectures...</div>
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        {isOwner && (
          <CardFooter>
            <Link href="/lectures/new">
              <Button>Add New Lecture</Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    )
  }

  if (lectures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No lectures found</CardTitle>
          <CardDescription>
            {isOwner ? "Get started by adding your first lecture" : "No lectures have been added yet"}
          </CardDescription>
        </CardHeader>
        {isOwner && (
          <CardFooter>
            <Link href="/lectures/new">
              <Button>Add New Lecture</Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campus Lectures</CardTitle>
        <CardDescription>
          {isOwner ? "Manage and find lecture information across campus" : "Find your way around campus"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Lecture Name</TableHead>
              <TableHead>Room Number</TableHead>
              <TableHead>Floor</TableHead>
              {isOwner && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lectures.map((lecture) => (
              <TableRow key={lecture._id}>
                <TableCell className="font-medium">{lecture.subjectName}</TableCell>
                <TableCell>{lecture.lectureName}</TableCell>
                <TableCell>{lecture.roomNumber}</TableCell>
                <TableCell>{lecture.floor}</TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/lectures/edit/${lecture._id}`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(lecture._id as string)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

