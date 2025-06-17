"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { ArrowUp, ArrowDown, Trash2, Save, Plus, LinkIcon } from "lucide-react"

interface Point {
  id: string
  x: number
  y: number
  label: string
  type: "room" | "stairs" | "elevator" | "hallway" | "entrance"
  roomNumber?: string
  floor: number
}

interface Connection {
  from: string
  to: string
  weight: number
}

interface FloorData {
  points: Point[]
  connections: Connection[]
}

export default function BuildingEditor() {
  const [currentFloor, setCurrentFloor] = useState(0)
  const [buildingData, setBuildingData] = useState<Record<number, FloorData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [activeTab, setActiveTab] = useState("points")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasMode, setCanvasMode] = useState<"select" | "add-point" | "add-connection">("select")
  const [newPointType, setNewPointType] = useState<"room" | "stairs" | "elevator" | "hallway" | "entrance">("hallway")
  const [connectionStart, setConnectionStart] = useState<Point | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Fetch building data
  useEffect(() => {
    const fetchBuildingData = async () => {
      try {
        // In a real app, this would be an API call to fetch the building data
        // For now, we'll use mock data or initialize empty data
        const mockBuildingData = getMockBuildingData()
        setBuildingData(mockBuildingData)
        setStatusMessage("Building data loaded successfully")
      } catch (err) {
        console.error("Error fetching building data:", err)
        // Initialize with empty data for each floor
        const emptyData: Record<number, FloorData> = {
          0: { points: [], connections: [] },
          1: { points: [], connections: [] },
          2: { points: [], connections: [] },
        }
        setBuildingData(emptyData)
        setStatusMessage("Started with empty building layout")
      } finally {
        setLoading(false)
      }
    }

    fetchBuildingData()
  }, [])

  // Draw the floor plan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading || !buildingData[currentFloor]) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const floorData = buildingData[currentFloor]

    // Draw grid for reference
    ctx.strokeStyle = "#f3f4f6"
    ctx.lineWidth = 1

    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw connections
    for (const conn of floorData.connections) {
      const point1 = floorData.points.find((p) => p.id === conn.from)
      const point2 = floorData.points.find((p) => p.id === conn.to)

      if (point1 && point2) {
        // Highlight selected connection
        if (selectedConnection && conn.from === selectedConnection.from && conn.to === selectedConnection.to) {
          ctx.strokeStyle = "#ef4444" // Red
          ctx.lineWidth = 4
        } else {
          ctx.strokeStyle = "#d1d5db" // Gray
          ctx.lineWidth = 3
        }

        ctx.beginPath()
        ctx.moveTo(point1.x, point1.y)
        ctx.lineTo(point2.x, point2.y)
        ctx.stroke()

        // Draw weight in the middle of the connection
        const midX = (point1.x + point2.x) / 2
        const midY = (point1.y + point2.y) / 2

        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(midX, midY, 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#6b7280"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(conn.weight.toString(), midX, midY)
        ctx.textAlign = "start"
        ctx.textBaseline = "alphabetic"
      }
    }

    // Draw connection in progress
    if (canvasMode === "add-connection" && connectionStart) {
      const rect = canvas.getBoundingClientRect()
      const mouseX = Math.max(0, Math.min(canvas.width, connectionStart.x))
      const mouseY = Math.max(0, Math.min(canvas.height, connectionStart.y))

      ctx.strokeStyle = "#3b82f6" // Blue
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(connectionStart.x, connectionStart.y)
      ctx.lineTo(mouseX, mouseY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw points
    for (const point of floorData.points) {
      // Highlight selected point
      if (selectedPoint && point.id === selectedPoint.id) {
        ctx.strokeStyle = "#ef4444" // Red
        ctx.lineWidth = 2
        ctx.strokeRect(point.x - 18, point.y - 18, 36, 36)
      }

      switch (point.type) {
        case "stairs":
          // Draw stairs icon
          ctx.fillStyle = "#f59e0b" // Amber
          ctx.beginPath()
          ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
          ctx.fill()

          // Draw stairs symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "12px Arial"
          ctx.fillText("S", point.x - 4, point.y + 4)
          break

        case "elevator":
          // Draw elevator icon
          ctx.fillStyle = "#3b82f6" // Blue
          ctx.beginPath()
          ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
          ctx.fill()

          // Draw elevator symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "12px Arial"
          ctx.fillText("E", point.x - 4, point.y + 4)
          break

        case "room":
          // Draw room
          ctx.fillStyle = "#10b981" // Green
          ctx.fillRect(point.x - 15, point.y - 15, 30, 30)

          // Draw room number
          ctx.fillStyle = "#ffffff"
          ctx.font = "10px Arial"
          ctx.fillText(point.roomNumber || "", point.x - 14, point.y + 4)
          break

        case "entrance":
          // Draw entrance
          ctx.fillStyle = "#8b5cf6" // Purple
          ctx.beginPath()
          ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
          ctx.fill()

          // Draw entrance symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "12px Arial"
          ctx.fillText("X", point.x - 4, point.y + 4)
          break

        default: // hallway or other
          // Draw regular point
          ctx.fillStyle = "#6b7280" // Gray
          ctx.beginPath()
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
          ctx.fill()
      }

      // Draw label
      if (point.label) {
        ctx.fillStyle = "#1f2937"
        ctx.font = "12px Arial"
        ctx.fillText(point.label, point.x + 15, point.y - 5)
      }

      // Draw coordinates for debugging
      ctx.fillStyle = "#9ca3af"
      ctx.font = "9px Arial"
      ctx.fillText(`(${point.x},${point.y})`, point.x + 15, point.y + 15)
    }

    // Draw mouse position for add-point mode
    if (canvasMode === "add-point") {
      canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect()
        const x = Math.round(e.clientX - rect.left)
        const y = Math.round(e.clientY - rect.top)

        setStatusMessage(`Position: (${x}, ${y}) - Click to add a ${newPointType}`)
      }
    } else {
      canvas.onmousemove = null
    }
  }, [
    currentFloor,
    buildingData,
    loading,
    selectedPoint,
    selectedConnection,
    canvasMode,
    connectionStart,
    newPointType,
  ])

  // Canvas click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !buildingData[currentFloor]) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)

    const floorData = buildingData[currentFloor]

    if (canvasMode === "select") {
      // Select point or connection
      let found = false

      // Check if clicked on a point
      for (const point of floorData.points) {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
        if (distance < 15) {
          // 15px radius for selection
          setSelectedPoint(point)
          setSelectedConnection(null)
          setStatusMessage(`Selected ${point.type}: ${point.label}`)
          found = true
          break
        }
      }

      if (!found) {
        // Check if clicked on a connection
        for (const conn of floorData.connections) {
          const point1 = floorData.points.find((p) => p.id === conn.from)
          const point2 = floorData.points.find((p) => p.id === conn.to)

          if (point1 && point2) {
            // Check if click is near the line
            const distance = distanceToLine(x, y, point1.x, point1.y, point2.x, point2.y)
            if (distance < 10) {
              // 10px threshold for line selection
              setSelectedConnection(conn)
              setSelectedPoint(null)
              setStatusMessage(`Selected connection between ${point1.label} and ${point2.label}`)
              found = true
              break
            }
          }
        }
      }

      if (!found) {
        setSelectedPoint(null)
        setSelectedConnection(null)
        setStatusMessage("No item selected")
      }
    } else if (canvasMode === "add-point") {
      // Add new point
      const id = generateId(newPointType, currentFloor)
      const newPoint: Point = {
        id,
        x,
        y,
        label: getDefaultLabel(newPointType),
        type: newPointType,
        floor: currentFloor,
      }

      if (newPointType === "room") {
        newPoint.roomNumber = `R${currentFloor}${Math.floor(Math.random() * 100)}`
      }

      const updatedData = { ...buildingData }
      updatedData[currentFloor].points.push(newPoint)
      setBuildingData(updatedData)
      setSelectedPoint(newPoint)
      setStatusMessage(`Added new ${newPointType} at (${x}, ${y})`)
      setCanvasMode("select")
    } else if (canvasMode === "add-connection") {
      // Add connection or select start point
      if (!connectionStart) {
        // Find if clicked on a point to start connection
        for (const point of floorData.points) {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
          if (distance < 15) {
            setConnectionStart(point)
            setStatusMessage(`Starting connection from ${point.label}. Click on another point to connect.`)
            break
          }
        }
      } else {
        // Find if clicked on a point to end connection
        for (const point of floorData.points) {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
          if (distance < 15 && point.id !== connectionStart.id) {
            // Create new connection
            const newConnection: Connection = {
              from: connectionStart.id,
              to: point.id,
              weight: Math.round(
                Math.sqrt(Math.pow(point.x - connectionStart.x, 2) + Math.pow(point.y - connectionStart.y, 2)),
              ),
            }

            // Check if connection already exists
            const connectionExists = floorData.connections.some(
              (c) =>
                (c.from === newConnection.from && c.to === newConnection.to) ||
                (c.from === newConnection.to && c.to === newConnection.from),
            )

            if (!connectionExists) {
              const updatedData = { ...buildingData }
              updatedData[currentFloor].connections.push(newConnection)
              setBuildingData(updatedData)
              setSelectedConnection(newConnection)
              setStatusMessage(`Connected ${connectionStart.label} to ${point.label}`)
            } else {
              setStatusMessage(`Connection already exists between these points`)
            }

            setConnectionStart(null)
            setCanvasMode("select")
            break
          }
        }
      }
    }
  }

  // Calculate distance from point to line
  const distanceToLine = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1
    const B = y - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const len_sq = C * C + D * D
    let param = -1

    if (len_sq !== 0) param = dot / len_sq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = x - xx
    const dy = y - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  // Generate ID for new point
  const generateId = (type: string, floor: number) => {
    const floorData = buildingData[floor]
    const typeCount = floorData.points.filter((p) => p.type === type).length + 1
    return `${type}_${floor}_${typeCount}`
  }

  // Get default label for new point
  const getDefaultLabel = (type: string) => {
    switch (type) {
      case "room":
        return "New Room"
      case "stairs":
        return "Stairs"
      case "elevator":
        return "Elevator"
      case "entrance":
        return "Entrance"
      default:
        return "Hallway"
    }
  }

  // Update point properties
  const updatePoint = (field: string, value: string) => {
    if (!selectedPoint) return

    const updatedData = { ...buildingData }
    const pointIndex = updatedData[currentFloor].points.findIndex((p) => p.id === selectedPoint.id)

    if (pointIndex !== -1) {
      const updatedPoint = { ...updatedData[currentFloor].points[pointIndex] }

      if (field === "label") {
        updatedPoint.label = value
      } else if (field === "roomNumber" && updatedPoint.type === "room") {
        updatedPoint.roomNumber = value
      } else if (field === "x") {
        updatedPoint.x = Number.parseInt(value) || 0
      } else if (field === "y") {
        updatedPoint.y = Number.parseInt(value) || 0
      }

      updatedData[currentFloor].points[pointIndex] = updatedPoint
      setBuildingData(updatedData)
      setSelectedPoint(updatedPoint)
      setStatusMessage(`Updated ${field} for ${updatedPoint.label}`)
    }
  }

  // Delete selected point
  const deletePoint = () => {
    if (!selectedPoint) return

    const updatedData = { ...buildingData }

    // Remove any connections involving this point
    updatedData[currentFloor].connections = updatedData[currentFloor].connections.filter(
      (conn) => conn.from !== selectedPoint.id && conn.to !== selectedPoint.id,
    )

    // Remove the point
    updatedData[currentFloor].points = updatedData[currentFloor].points.filter((p) => p.id !== selectedPoint.id)

    setBuildingData(updatedData)
    setSelectedPoint(null)
    setStatusMessage(`Deleted ${selectedPoint.label}`)
  }

  // Delete selected connection
  const deleteConnection = () => {
    if (!selectedConnection) return

    const updatedData = { ...buildingData }
    updatedData[currentFloor].connections = updatedData[currentFloor].connections.filter(
      (conn) => !(conn.from === selectedConnection.from && conn.to === selectedConnection.to),
    )

    setBuildingData(updatedData)
    setSelectedConnection(null)
    setStatusMessage("Deleted connection")
  }

  // Save building data
  const saveBuilding = async () => {
    setSaving(true)

    try {
      // In a real app, this would be an API call to save the building data
      // For now, we'll just simulate a save
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Validate the building data
      validateBuildingData()

      toast({
        title: "Success",
        description: "Building layout saved successfully",
      })
      setStatusMessage("Building layout saved successfully")
    } catch (err) {
      console.error("Error saving building data:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save building layout",
        variant: "destructive",
      })
      setStatusMessage("Error: " + (err instanceof Error ? err.message : "Failed to save building layout"))
    } finally {
      setSaving(false)
    }
  }

  // Validate building data before saving
  const validateBuildingData = () => {
    // Check for each floor
    for (let floor = 0; floor <= 2; floor++) {
      const floorData = buildingData[floor]

      // Check if there's at least one room on each floor
      const rooms = floorData.points.filter((p) => p.type === "room")
      if (rooms.length === 0) {
        throw new Error(`Floor ${floor} has no rooms`)
      }

      // Check if there's at least one connection point (stairs or elevator) on each floor
      const connectionPoints = floorData.points.filter((p) => p.type === "stairs" || p.type === "elevator")
      if (connectionPoints.length === 0 && floor > 0) {
        throw new Error(`Floor ${floor} has no stairs or elevators for multi-floor navigation`)
      }

      // Check if all points are connected (have at least one connection)
      for (const point of floorData.points) {
        const hasConnection = floorData.connections.some((conn) => conn.from === point.id || conn.to === point.id)

        if (!hasConnection) {
          throw new Error(`Point "${point.label}" on floor ${floor} is not connected to any other point`)
        }
      }

      // Check for matching stairs/elevators between floors
      if (floor > 0) {
        const prevFloorData = buildingData[floor - 1]
        const prevFloorConnectors = prevFloorData.points.filter((p) => p.type === "stairs" || p.type === "elevator")

        for (const connector of connectionPoints) {
          const matchingConnector = prevFloorConnectors.find(
            (p) => p.type === connector.type && p.label === connector.label,
          )

          if (!matchingConnector) {
            throw new Error(
              `${connector.type} "${connector.label}" on floor ${floor} has no matching point on floor ${floor - 1}`,
            )
          }
        }
      }
    }
  }

  // Add a new floor
  const addNewFloor = () => {
    const updatedData = { ...buildingData }
    const newFloorNumber = Object.keys(updatedData).length

    updatedData[newFloorNumber] = {
      points: [],
      connections: [],
    }

    setBuildingData(updatedData)
    setCurrentFloor(newFloorNumber)
    setStatusMessage(`Added new floor ${newFloorNumber}`)
  }

  // Clone a point to another floor
  const clonePointToAnotherFloor = (targetFloor: number) => {
    if (!selectedPoint || targetFloor === currentFloor) return

    const updatedData = { ...buildingData }

    // Check if a point with the same label and type already exists on the target floor
    const existingPoint = updatedData[targetFloor].points.find(
      (p) => p.type === selectedPoint.type && p.label === selectedPoint.label,
    )

    if (existingPoint) {
      toast({
        title: "Warning",
        description: `A ${selectedPoint.type} with label "${selectedPoint.label}" already exists on floor ${targetFloor}`,
        variant: "destructive",
      })
      return
    }

    // Create a new point with the same properties but on the target floor
    const newPoint: Point = {
      ...selectedPoint,
      id: `${selectedPoint.type}_${targetFloor}_${updatedData[targetFloor].points.filter((p) => p.type === selectedPoint.type).length + 1}`,
      floor: targetFloor,
    }

    updatedData[targetFloor].points.push(newPoint)
    setBuildingData(updatedData)
    setStatusMessage(`Cloned ${selectedPoint.type} "${selectedPoint.label}" to floor ${targetFloor}`)
  }

  // Mock building data generator
  const getMockBuildingData = (): Record<number, FloorData> => {
    return {
      0: {
        // Ground floor
        points: [
          { id: "entrance_0_1", x: 100, y: 100, label: "Main Entrance", type: "entrance", floor: 0 },
          { id: "hallway_0_1", x: 200, y: 100, label: "Hallway", type: "hallway", floor: 0 },
          { id: "stairs_0_1", x: 300, y: 100, label: "Main Stairs", type: "stairs", floor: 0 },
          { id: "elevator_0_1", x: 400, y: 100, label: "Elevator", type: "elevator", floor: 0 },
          { id: "hallway_0_2", x: 200, y: 200, label: "Hallway", type: "hallway", floor: 0 },
          { id: "room_0_1", x: 100, y: 200, label: "C002", type: "room", roomNumber: "C002", floor: 0 },
          { id: "room_0_2", x: 300, y: 200, label: "P001", type: "room", roomNumber: "P001", floor: 0 },
        ],
        connections: [
          { from: "entrance_0_1", to: "hallway_0_1", weight: 100 },
          { from: "hallway_0_1", to: "stairs_0_1", weight: 100 },
          { from: "hallway_0_1", to: "elevator_0_1", weight: 200 },
          { from: "hallway_0_1", to: "hallway_0_2", weight: 100 },
          { from: "hallway_0_2", to: "room_0_1", weight: 100 },
          { from: "hallway_0_2", to: "room_0_2", weight: 100 },
        ],
      },
      1: {
        // First floor
        points: [
          { id: "stairs_1_1", x: 300, y: 100, label: "Main Stairs", type: "stairs", floor: 1 },
          { id: "elevator_1_1", x: 400, y: 100, label: "Elevator", type: "elevator", floor: 1 },
          { id: "hallway_1_1", x: 200, y: 100, label: "Hallway", type: "hallway", floor: 1 },
          { id: "hallway_1_2", x: 200, y: 200, label: "Hallway", type: "hallway", floor: 1 },
          { id: "room_1_1", x: 100, y: 200, label: "CS101", type: "room", roomNumber: "CS101", floor: 1 },
          { id: "room_1_2", x: 300, y: 200, label: "B101", type: "room", roomNumber: "B101", floor: 1 },
        ],
        connections: [
          { from: "stairs_1_1", to: "hallway_1_1", weight: 100 },
          { from: "elevator_1_1", to: "hallway_1_1", weight: 100 },
          { from: "hallway_1_1", to: "hallway_1_2", weight: 100 },
          { from: "hallway_1_2", to: "room_1_1", weight: 100 },
          { from: "hallway_1_2", to: "room_1_2", weight: 100 },
        ],
      },
      2: {
        // Second floor
        points: [
          { id: "stairs_2_1", x: 300, y: 100, label: "Main Stairs", type: "stairs", floor: 2 },
          { id: "elevator_2_1", x: 400, y: 100, label: "Elevator", type: "elevator", floor: 2 },
          { id: "hallway_2_1", x: 200, y: 100, label: "Hallway", type: "hallway", floor: 2 },
          { id: "hallway_2_2", x: 200, y: 200, label: "Hallway", type: "hallway", floor: 2 },
          { id: "room_2_1", x: 100, y: 200, label: "M201", type: "room", roomNumber: "M201", floor: 2 },
          { id: "room_2_2", x: 300, y: 200, label: "E201", type: "room", roomNumber: "E201", floor: 2 },
        ],
        connections: [
          { from: "stairs_2_1", to: "hallway_2_1", weight: 100 },
          { from: "elevator_2_1", to: "hallway_2_1", weight: 100 },
          { from: "hallway_2_1", to: "hallway_2_2", weight: 100 },
          { from: "hallway_2_2", to: "room_2_1", weight: 100 },
          { from: "hallway_2_2", to: "room_2_2", weight: 100 },
        ],
      },
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">Loading building data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Building Layout Editor</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentFloor(Math.min(currentFloor + 1, Object.keys(buildingData).length - 1))}
              disabled={currentFloor >= Object.keys(buildingData).length - 1}
            >
              <ArrowUp className="h-4 w-4 mr-1" /> Floor Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentFloor(Math.max(currentFloor - 1, 0))}
              disabled={currentFloor <= 0}
            >
              <ArrowDown className="h-4 w-4 mr-1" /> Floor Down
            </Button>
            <Button onClick={saveBuilding} disabled={saving} className="flex items-center">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Layout"}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Floor {currentFloor} - Edit building layout for navigation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex gap-2 flex-wrap">
              <Button
                variant={canvasMode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCanvasMode("select")
                  setConnectionStart(null)
                }}
              >
                Select
              </Button>
              <Button
                variant={canvasMode === "add-point" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCanvasMode("add-point")
                  setConnectionStart(null)
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Point
              </Button>
              <Button
                variant={canvasMode === "add-connection" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCanvasMode("add-connection")
                  setConnectionStart(null)
                }}
              >
                <LinkIcon className="h-4 w-4 mr-1" /> Add Connection
              </Button>

              {canvasMode === "add-point" && (
                <Select value={newPointType} onValueChange={(value: any) => setNewPointType(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Point Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="stairs">Stairs</SelectItem>
                    <SelectItem value="elevator">Elevator</SelectItem>
                    <SelectItem value="hallway">Hallway</SelectItem>
                    <SelectItem value="entrance">Entrance</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="relative border rounded-md overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={500}
                height={400}
                className="w-full cursor-pointer"
                onClick={handleCanvasClick}
              />

              <div className="absolute bottom-3 left-3 bg-white p-2 rounded-md shadow-sm text-xs">
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Rooms</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span>Stairs</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Elevator</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                  <span>Hallway</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span>Entrance</span>
                </div>
              </div>
            </div>

            {statusMessage && <div className="mt-2 text-sm text-muted-foreground">{statusMessage}</div>}
          </div>

          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="points" className="flex-1">
                  Points
                </TabsTrigger>
                <TabsTrigger value="connections" className="flex-1">
                  Connections
                </TabsTrigger>
              </TabsList>

              <TabsContent value="points" className="mt-4">
                {selectedPoint ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="point-type">Type</Label>
                      <div className="mt-1 font-medium capitalize">{selectedPoint.type}</div>
                    </div>

                    <div>
                      <Label htmlFor="point-label">Label</Label>
                      <Input
                        id="point-label"
                        value={selectedPoint.label}
                        onChange={(e) => updatePoint("label", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {selectedPoint.type === "room" && (
                      <div>
                        <Label htmlFor="room-number">Room Number</Label>
                        <Input
                          id="room-number"
                          value={selectedPoint.roomNumber || ""}
                          onChange={(e) => updatePoint("roomNumber", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="point-x">X Position</Label>
                        <Input
                          id="point-x"
                          type="number"
                          value={selectedPoint.x}
                          onChange={(e) => updatePoint("x", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="point-y">Y Position</Label>
                        <Input
                          id="point-y"
                          type="number"
                          value={selectedPoint.y}
                          onChange={(e) => updatePoint("y", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {(selectedPoint.type === "stairs" || selectedPoint.type === "elevator") && (
                      <div>
                        <Label>Clone to Another Floor</Label>
                        <div className="flex gap-2 mt-1">
                          {Object.keys(buildingData)
                            .map(Number)
                            .filter((floor) => floor !== currentFloor)
                            .map((floor) => (
                              <Button
                                key={floor}
                                variant="outline"
                                size="sm"
                                onClick={() => clonePointToAnotherFloor(floor)}
                              >
                                Floor {floor}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}

                    <Button variant="destructive" size="sm" onClick={deletePoint} className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Point
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Select a point to edit its properties</div>
                )}
              </TabsContent>

              <TabsContent value="connections" className="mt-4">
                {selectedConnection ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Connection</Label>
                      <div className="mt-1 text-sm">
                        From:{" "}
                        {buildingData[currentFloor].points.find((p) => p.id === selectedConnection.from)?.label ||
                          selectedConnection.from}
                        <br />
                        To:{" "}
                        {buildingData[currentFloor].points.find((p) => p.id === selectedConnection.to)?.label ||
                          selectedConnection.to}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="connection-weight">Weight (Distance)</Label>
                      <Input
                        id="connection-weight"
                        type="number"
                        value={selectedConnection.weight}
                        onChange={(e) => {
                          const updatedData = { ...buildingData }
                          const connIndex = updatedData[currentFloor].connections.findIndex(
                            (c) => c.from === selectedConnection.from && c.to === selectedConnection.to,
                          )

                          if (connIndex !== -1) {
                            updatedData[currentFloor].connections[connIndex].weight =
                              Number.parseInt(e.target.value) || 0
                            setBuildingData(updatedData)
                            setSelectedConnection(updatedData[currentFloor].connections[connIndex])
                          }
                        }}
                        className="mt-1"
                      />
                    </div>

                    <Button variant="destructive" size="sm" onClick={deleteConnection} className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Connection
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a connection to edit its properties
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Floor {currentFloor}: {buildingData[currentFloor].points.length} points,{" "}
          {buildingData[currentFloor].connections.length} connections
        </div>
      </CardFooter>
    </Card>
  )
}

