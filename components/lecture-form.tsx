"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"
import RoomSelector from "./room-selector"

interface LectureFormProps {
  initialData?: {
    _id?: string
    subjectName: string
    lectureName: string
    roomNumber: string
    floor: number
  }
  onSubmit: (data: any) => Promise<void>
  isEditing?: boolean
}

export default function LectureForm({ initialData, onSubmit, isEditing = false }: LectureFormProps) {
  const [formData, setFormData] = useState({
    subjectName: initialData?.subjectName || "",
    lectureName: initialData?.lectureName || "",
    roomNumber: initialData?.roomNumber || "",
    floor: initialData?.floor?.toString() || "1",
  })
  const [loading, setLoading] = useState(false)
  const [showRoomSelector, setShowRoomSelector] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])

  useEffect(() => {
    // Load buildings and rooms from local storage
    try {
      const campusMapData = localStorage.getItem("campusMap")
      if (campusMapData) {
        const { buildings, rooms } = JSON.parse(campusMapData)
        setBuildings(buildings || [])
        setRooms(rooms || [])
      }
    } catch (error) {
      console.error("Error loading campus map data:", error)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoomSelect = (room: any) => {
    setFormData((prev) => ({
      ...prev,
      roomNumber: room.number,
      floor: room.floor.toString(),
    }))
    setShowRoomSelector(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        floor: Number.parseInt(formData.floor, 10),
      })
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Lecture" : "Add New Lecture"}</CardTitle>
        <CardDescription>
          {isEditing ? "Update the details for this lecture" : "Enter the details for the new lecture"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input id="subjectName" name="subjectName" value={formData.subjectName} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lectureName">Lecture Name</Label>
            <Input id="lectureName" name="lectureName" value={formData.lectureName} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room</Label>
            <div className="flex gap-2">
              <Input
                id="roomNumber"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                required
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => setShowRoomSelector(true)}>
                <MapPin className="h-4 w-4 mr-2" />
                Select Room
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Floor</Label>
            <Select value={formData.floor} onValueChange={(value) => handleSelectChange("floor", value)}>
              <SelectTrigger id="floor">
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Ground Floor</SelectItem>
                <SelectItem value="1">First Floor</SelectItem>
                <SelectItem value="2">Second Floor</SelectItem>
                <SelectItem value="3">Third Floor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Lecture" : "Add Lecture"}
          </Button>
        </CardFooter>
      </form>

      {showRoomSelector && (
        <RoomSelector
          buildings={buildings}
          rooms={rooms}
          onSelect={handleRoomSelect}
          onClose={() => setShowRoomSelector(false)}
          currentFloor={Number.parseInt(formData.floor, 10)}
        />
      )}
    </Card>
  )
}

