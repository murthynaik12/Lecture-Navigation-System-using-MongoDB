"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface EditLectureProps {
  params: {
    id: string
  }
}

export default function EditLecture({ params }: EditLectureProps) {
  const router = useRouter()
  const { id } = params

  const [formData, setFormData] = useState({
    subjectName: "",
    lectureName: "",
    roomNumber: "",
    floor: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await fetch(`/api/lectures/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch lecture")
        }

        const data = await response.json()
        setFormData({
          subjectName: data.subjectName,
          lectureName: data.lectureName,
          roomNumber: data.roomNumber,
          floor: data.floor.toString(),
        })
      } catch (error) {
        console.error("Error fetching lecture:", error)
        toast({
          title: "Error",
          description: "Failed to load lecture details",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchLecture()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/lectures/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          floor: Number.parseInt(formData.floor, 10),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lecture updated successfully",
        })
        router.push("/")
        router.refresh()
      } else {
        throw new Error("Failed to update lecture")
      }
    } catch (error) {
      console.error("Error updating lecture:", error)
      toast({
        title: "Error",
        description: "Failed to update lecture",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8 text-center">Loading lecture details...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Lecture</CardTitle>
          <CardDescription>Update the details for this lecture</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                name="subjectName"
                value={formData.subjectName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lectureName">Lecture Name</Label>
              <Input
                id="lectureName"
                name="lectureName"
                value={formData.lectureName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input id="roomNumber" name="roomNumber" value={formData.roomNumber} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" name="floor" type="number" value={formData.floor} onChange={handleChange} required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Lecture"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

