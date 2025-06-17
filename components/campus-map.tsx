"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "lucide-react"

interface CampusMapProps {
  startPoint?: string
  endPoint?: string
  showRoute?: boolean
  onLocationSelect?: (locationId: string) => void
  interactive?: boolean
}

interface MapLocation {
  id: string
  name: string
  type: "building" | "block" | "facility" | "intersection"
  x: number
  y: number
}

interface MapConnection {
  from: string
  to: string
  distance: number
  facilityName?: string
  facilityDescription?: string
}

export default function CampusMap({
  startPoint,
  endPoint,
  showRoute = false,
  onLocationSelect,
  interactive = true,
}: CampusMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredLocation, setHoveredLocation] = useState<MapLocation | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [mapData, setMapData] = useState<{
    locations: MapLocation[]
    connections: MapConnection[]
  }>({
    locations: [],
    connections: [],
  })

  // Load map data
  useEffect(() => {
    // Try to load from localStorage first
    const savedData = localStorage.getItem("campusMap")
    if (savedData) {
      try {
        const { locations, connections } = JSON.parse(savedData)

        // Convert to the format needed for this component
        const mapLocations: MapLocation[] = locations.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          type: loc.type,
          x: loc.position?.x || 0,
          y: loc.position?.y || 0,
        }))

        const mapConnections: MapConnection[] = connections.map((conn: any) => ({
          from: conn.from,
          to: conn.to,
          distance: conn.distance,
          facilityName: conn.facilityName,
          facilityDescription: conn.facilityDescription,
        }))

        setMapData({
          locations: mapLocations,
          connections: mapConnections,
        })
        return
      } catch (error) {
        console.error("Error parsing saved map data:", error)
      }
    }

    // Fallback to mock data
    const mockMapData = {
      locations: [
        { id: "gandhi-chowk", name: "Gandhi Chowk", type: "intersection" as const, x: 400, y: 300 },
        { id: "library", name: "Library", type: "building" as const, x: 200, y: 200 },
        { id: "block1", name: "Block 1", type: "block" as const, x: 300, y: 400 },
        { id: "nescafe", name: "Nescafe", type: "facility" as const, x: 400, y: 450 },
        { id: "it-block", name: "IT Block", type: "building" as const, x: 500, y: 200 },
        { id: "hostel", name: "Hostel", type: "building" as const, x: 600, y: 100 },
        { id: "food-court", name: "Food Court", type: "facility" as const, x: 500, y: 500 },
        { id: "rd-center", name: "R&D Center", type: "building" as const, x: 700, y: 250 },
        { id: "design-block", name: "Design Block", type: "block" as const, x: 600, y: 200 },
        { id: "energy-house", name: "Energy House", type: "facility" as const, x: 350, y: 550 },
        { id: "college-gate", name: "College Gate", type: "intersection" as const, x: 100, y: 550 },
        { id: "enrollment", name: "Enrollment Office", type: "building" as const, x: 100, y: 450 },
      ],
      connections: [
        {
          from: "gandhi-chowk",
          to: "library",
          distance: 150,
          facilityName: "Stationery Shop",
          facilityDescription: "Sells books and stationery items",
        },
        {
          from: "gandhi-chowk",
          to: "block1",
          distance: 100,
          facilityName: "ATM",
          facilityDescription: "24-hour ATM service",
        },
        {
          from: "block1",
          to: "nescafe",
          distance: 80,
          facilityName: "Snack Corner",
          facilityDescription: "Quick snacks and beverages",
        },
        {
          from: "gandhi-chowk",
          to: "it-block",
          distance: 120,
          facilityName: "Computer Lab",
          facilityDescription: "Open access computer facility",
        },
        {
          from: "it-block",
          to: "hostel",
          distance: 200,
          facilityName: "Gym",
          facilityDescription: "Student fitness center",
        },
        {
          from: "nescafe",
          to: "food-court",
          distance: 100,
          facilityName: "Juice Bar",
          facilityDescription: "Fresh fruit juices and smoothies",
        },
        {
          from: "gandhi-chowk",
          to: "rd-center",
          distance: 250,
          facilityName: "Innovation Hub",
          facilityDescription: "Startup incubation center",
        },
        {
          from: "it-block",
          to: "design-block",
          distance: 80,
          facilityName: "Art Gallery",
          facilityDescription: "Student art exhibitions",
        },
        {
          from: "block1",
          to: "energy-house",
          distance: 120,
          facilityName: "Solar Panel Display",
          facilityDescription: "Renewable energy demonstration",
        },
        {
          from: "college-gate",
          to: "enrollment",
          distance: 50,
          facilityName: "Information Desk",
          facilityDescription: "Campus information for visitors",
        },
        {
          from: "enrollment",
          to: "block1",
          distance: 150,
          facilityName: "Admin Office",
          facilityDescription: "Administrative services",
        },
        {
          from: "college-gate",
          to: "food-court",
          distance: 300,
          facilityName: "Sports Field",
          facilityDescription: "Outdoor sports facilities",
        },
      ],
    }

    setMapData(mockMapData)
  }, [])

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 0.5
    const gridSize = 20
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw connections
    mapData.connections.forEach((conn) => {
      const fromLocation = mapData.locations.find((loc) => loc.id === conn.from)
      const toLocation = mapData.locations.find((loc) => loc.id === conn.to)

      if (fromLocation && toLocation) {
        // Check if this connection is part of the route
        const isRouteConnection =
          showRoute &&
          ((fromLocation.id === startPoint && toLocation.id === endPoint) ||
            (fromLocation.id === endPoint && toLocation.id === startPoint))

        if (isRouteConnection) {
          // Highlight the route
          ctx.strokeStyle = "#ef4444" // Red
          ctx.lineWidth = 3
        } else {
          ctx.strokeStyle = "#94a3b8" // Gray
          ctx.lineWidth = 1.5
        }

        ctx.beginPath()
        ctx.moveTo(fromLocation.x, fromLocation.y)
        ctx.lineTo(toLocation.x, toLocation.y)
        ctx.stroke()

        // Draw distance and facility name if available
        const midX = (fromLocation.x + toLocation.x) / 2
        const midY = (fromLocation.y + toLocation.y) / 2

        // Draw distance
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(midX, midY, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "#cbd5e1"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = "#475569"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(conn.distance.toString() + "m", midX, midY)

        // Draw facility name if available
        if (conn.facilityName) {
          const angle = Math.atan2(toLocation.y - fromLocation.y, toLocation.x - fromLocation.x)
          const offsetX = Math.sin(angle) * 15
          const offsetY = -Math.cos(angle) * 15

          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.beginPath()
          ctx.roundRect(midX + offsetX - 50, midY + offsetY - 10, 100, 20, 5)
          ctx.fill()
          ctx.strokeStyle = "#cbd5e1"
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.fillStyle = "#1e293b"
          ctx.font = "9px Arial"
          ctx.fillText(conn.facilityName, midX + offsetX, midY + offsetY)
        }
      }
    })

    // Draw locations
    mapData.locations.forEach((location) => {
      // Check if this is start or end point
      const isStart = location.id === startPoint
      const isEnd = location.id === endPoint
      const isSelected = location.id === selectedLocation
      const isHovered = hoveredLocation && hoveredLocation.id === location.id

      // Draw highlight for selected/hovered location
      if (isSelected || isHovered || isStart || isEnd) {
        ctx.strokeStyle = isStart ? "#3b82f6" : isEnd ? "#ef4444" : "#f59e0b"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(location.x, location.y, 18, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw location based on type
      switch (location.type) {
        case "building":
          ctx.fillStyle = isStart ? "#3b82f6" : isEnd ? "#ef4444" : "#10b981"
          ctx.fillRect(location.x - 12, location.y - 12, 24, 24)
          break
        case "block":
          ctx.fillStyle = isStart ? "#3b82f6" : isEnd ? "#ef4444" : "#3b82f6"
          ctx.fillRect(location.x - 12, location.y - 12, 24, 24)
          break
        case "facility":
          ctx.fillStyle = isStart ? "#3b82f6" : isEnd ? "#ef4444" : "#f59e0b"
          ctx.fillRect(location.x - 12, location.y - 12, 24, 24)
          break
        case "intersection":
          ctx.fillStyle = isStart ? "#3b82f6" : isEnd ? "#ef4444" : "#64748b"
          ctx.beginPath()
          ctx.arc(location.x, location.y, 8, 0, Math.PI * 2)
          ctx.fill()
          break
      }

      // Draw location name
      ctx.fillStyle = "#1e293b"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(location.name, location.x, location.y + 25)
    })

    // Draw start and end markers
    if (startPoint) {
      const startLocation = mapData.locations.find((loc) => loc.id === startPoint)
      if (startLocation) {
        ctx.fillStyle = "#3b82f6" // Blue
        ctx.beginPath()
        ctx.arc(startLocation.x, startLocation.y - 25, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = "bold 12px Arial"
        ctx.fillStyle = "#3b82f6"
        ctx.fillText("START", startLocation.x - 20, startLocation.y - 35)
      }
    }

    if (endPoint) {
      const endLocation = mapData.locations.find((loc) => loc.id === endPoint)
      if (endLocation) {
        ctx.fillStyle = "#ef4444" // Red
        ctx.beginPath()
        ctx.arc(endLocation.x, endLocation.y - 25, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = "bold 12px Arial"
        ctx.fillStyle = "#ef4444"
        ctx.fillText("END", endLocation.x - 15, endLocation.y - 35)
      }
    }
  }, [mapData, hoveredLocation, selectedLocation, startPoint, endPoint, showRoute])

  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if mouse is over a location
    const location = mapData.locations.find((loc) => {
      const distance = Math.sqrt(Math.pow(loc.x - x, 2) + Math.pow(loc.y - y, 2))
      return distance <= 15
    })

    setHoveredLocation(location || null)
  }

  const handleMouseLeave = () => {
    setHoveredLocation(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on a location
    const location = mapData.locations.find((loc) => {
      const distance = Math.sqrt(Math.pow(loc.x - x, 2) + Math.pow(loc.y - y, 2))
      return distance <= 15
    })

    if (location) {
      setSelectedLocation(location.id)
      if (onLocationSelect) {
        onLocationSelect(location.id)
      }
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative border rounded-md overflow-hidden bg-gray-50">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          />

          {hoveredLocation && (
            <div
              className="absolute bg-white p-2 rounded shadow-sm text-sm pointer-events-none"
              style={{
                left: hoveredLocation.x + 20,
                top: hoveredLocation.y - 10,
              }}
            >
              <div className="font-medium">{hoveredLocation.name}</div>
              <div className="text-xs text-gray-500 capitalize">{hoveredLocation.type}</div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-white p-2 rounded-md shadow-sm text-xs">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-green-500 mr-2"></div>
              <span>Buildings</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-blue-500 mr-2"></div>
              <span>Blocks</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-amber-500 mr-2"></div>
              <span>Facilities</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
              <span>Intersections</span>
            </div>
          </div>

          {showRoute && startPoint && endPoint && (
            <Badge variant="outline" className="absolute top-3 right-3 bg-white">
              <Navigation className="h-3 w-3 mr-1" />
              Route Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

