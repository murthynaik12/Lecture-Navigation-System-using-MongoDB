"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X, ZoomIn, ZoomOut } from "lucide-react"

interface RoomSelectorProps {
  buildings: any[]
  rooms: any[]
  onSelect: (room: any) => void
  onClose: () => void
  currentFloor?: number
}

export default function RoomSelector({ buildings, rooms, onSelect, onClose, currentFloor = 1 }: RoomSelectorProps) {
  const [selectedFloor, setSelectedFloor] = useState(currentFloor)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredRoom, setHoveredRoom] = useState<any>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw buildings
    buildings.forEach((building) => {
      ctx.strokeStyle = "#475569"
      ctx.lineWidth = 1
      ctx.fillStyle = "#e2e8f0"
      ctx.fillRect(building.position.x, building.position.y, building.width, building.height)
      ctx.strokeRect(building.position.x, building.position.y, building.width, building.height)

      // Draw building name
      ctx.fillStyle = "#1e293b"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(building.name, building.position.x + building.width / 2, building.position.y - 5)
    })

    // Draw rooms for the selected floor
    rooms
      .filter((room) => room.floor === selectedFloor)
      .forEach((room) => {
        const building = buildings.find((b) => b.id === room.buildingId)
        if (!building) return

        // Check if room is inside building
        if (
          room.position.x >= building.position.x &&
          room.position.x <= building.position.x + building.width &&
          room.position.y >= building.position.y &&
          room.position.y <= building.position.y + building.height
        ) {
          // Highlight hovered room
          if (hoveredRoom && hoveredRoom.id === room.id) {
            ctx.fillStyle = "#3b82f6"
          } else {
            switch (room.type) {
              case "classroom":
                ctx.fillStyle = "#10b981"
                break
              case "lab":
                ctx.fillStyle = "#3b82f6"
                break
              case "office":
                ctx.fillStyle = "#f59e0b"
                break
              default:
                ctx.fillStyle = "#6b7280"
            }
          }

          ctx.fillRect(room.position.x, room.position.y, 30, 25)

          // Draw room number
          ctx.fillStyle = "#ffffff"
          ctx.font = "10px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(room.number, room.position.x + 15, room.position.y + 12)
        }
      })

    ctx.restore()
  }, [buildings, rooms, selectedFloor, zoom, pan, hoveredRoom])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setDragStart({ x: mouseX, y: mouseY })
    setIsDragging(true)

    // Check if clicked on a room
    const worldX = (mouseX - pan.x) / zoom
    const worldY = (mouseY - pan.y) / zoom

    const clickedRoom = rooms
      .filter((room) => room.floor === selectedFloor)
      .find(
        (room) =>
          worldX >= room.position.x &&
          worldX <= room.position.x + 30 &&
          worldY >= room.position.y &&
          worldY <= room.position.y + 25,
      )

    if (clickedRoom) {
      onSelect(clickedRoom)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (isDragging) {
      // Pan the canvas
      setPan((prev) => ({
        x: prev.x + (mouseX - dragStart.x),
        y: prev.y + (mouseY - dragStart.y),
      }))
      setDragStart({ x: mouseX, y: mouseY })
    } else {
      // Check for hover
      const worldX = (mouseX - pan.x) / zoom
      const worldY = (mouseY - pan.y) / zoom

      const room = rooms
        .filter((room) => room.floor === selectedFloor)
        .find(
          (room) =>
            worldX >= room.position.x &&
            worldX <= room.position.x + 30 &&
            worldY >= room.position.y &&
            worldY <= room.position.y + 25,
        )

      setHoveredRoom(room || null)
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const handleCanvasMouseLeave = () => {
    setIsDragging(false)
    setHoveredRoom(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Select Room</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="floor-select">Floor:</Label>
              <Select value={selectedFloor.toString()} onValueChange={(value) => setSelectedFloor(Number(value))}>
                <SelectTrigger id="floor-select" className="w-[120px]">
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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setZoom((prev) => Math.min(prev + 0.1, 2))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.5))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden bg-gray-50">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full cursor-pointer"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span className="text-xs">Classroom</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span className="text-xs">Lab</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
              <span className="text-xs">Office</span>
            </div>
          </div>

          {hoveredRoom && (
            <div className="mt-2 p-2 bg-gray-100 rounded-md">
              <p className="text-sm font-medium">
                {hoveredRoom.number}: {hoveredRoom.name}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="text-sm text-muted-foreground">Click on a room to select it</div>
        </CardFooter>
      </Card>
    </div>
  )
}

