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
import { Building, MapPin, Trash2, Save, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import type { Location, Connection, CampusMap } from "@/lib/models"

export default function CampusMapEditor() {
  const [mapData, setMapData] = useState<CampusMap>({
    locations: [],
    connections: [],
  })

  const [activeTab, setActiveTab] = useState("locations")
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [editorMode, setEditorMode] = useState<"select" | "add-location" | "add-connection">("select")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [newLocationType, setNewLocationType] = useState<"building" | "block" | "facility" | "intersection">("building")
  const [connectionStart, setConnectionStart] = useState<Location | null>(null)
  const [roomNumbers, setRoomNumbers] = useState<string>("")
  const [facilityName, setFacilityName] = useState<string>("")
  const [facilityDescription, setFacilityDescription] = useState<string>("")

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load map data
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true)
        // In a real app, fetch from API
        // For now, use localStorage
        const savedMap = localStorage.getItem("campusMap")
        if (savedMap) {
          setMapData(JSON.parse(savedMap))
        } else {
          // Initialize with sample data
          const sampleData: CampusMap = {
            locations: [
              {
                id: "gandhi-chowk",
                name: "Gandhi Chowk",
                type: "intersection",
                position: { x: 400, y: 300 },
              },
              {
                id: "library",
                name: "Library",
                type: "building",
                roomNumbers: ["LIB101", "LIB102", "LIB201"],
                position: { x: 200, y: 200 },
              },
              {
                id: "block1",
                name: "Block 1",
                type: "block",
                roomNumbers: ["B101", "B102", "B103"],
                position: { x: 300, y: 400 },
              },
              {
                id: "nescafe",
                name: "Nescafe",
                type: "facility",
                position: { x: 400, y: 450 },
              },
            ],
            connections: [
              {
                id: "conn1",
                from: "gandhi-chowk",
                to: "library",
                distance: 150,
                facilityName: "Stationery Shop",
                facilityDescription: "Sells books, pens and other stationery items",
                type: "path",
                bidirectional: true,
              },
              {
                id: "conn2",
                from: "gandhi-chowk",
                to: "block1",
                distance: 100,
                facilityName: "ATM",
                facilityDescription: "24-hour ATM service",
                type: "path",
                bidirectional: true,
              },
              {
                id: "conn3",
                from: "block1",
                to: "nescafe",
                distance: 80,
                facilityName: "Snack Corner",
                facilityDescription: "Quick snacks and beverages",
                type: "path",
                bidirectional: true,
              },
            ],
          }
          setMapData(sampleData)
        }
      } catch (error) {
        console.error("Error loading map data:", error)
        toast({
          title: "Error",
          description: "Failed to load map data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMapData()
  }, [])

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw grid
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1

    const gridSize = 50
    const width = canvas.width / zoom
    const height = canvas.height / zoom

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw connections
    mapData.connections.forEach((conn) => {
      const point1 = mapData.locations.find((p) => p.id === conn.from)
      const point2 = mapData.locations.find((p) => p.id === conn.to)

      if (point1?.position && point2?.position) {
        // Highlight selected connection
        if (selectedConnection && selectedConnection.id === conn.id) {
          ctx.strokeStyle = "#ef4444"
          ctx.lineWidth = 4
        } else {
          ctx.strokeStyle = "#94a3b8"
          ctx.lineWidth = 3
        }

        ctx.beginPath()
        ctx.moveTo(point1.position.x, point1.position.y)
        ctx.lineTo(point2.position.x, point2.position.y)
        ctx.stroke()

        // Draw distance in the middle
        const midX = (point1.position.x + point2.position.x) / 2
        const midY = (point1.position.y + point2.position.y) / 2

        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(midX, midY, 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#475569"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(conn.distance.toString(), midX, midY)

        // Draw facility if available
        if (conn.facilityName) {
          const angle = Math.atan2(point2.position.y - point1.position.y, point2.position.x - point1.position.x)
          const offsetX = Math.sin(angle) * 20
          const offsetY = -Math.cos(angle) * 20

          ctx.fillStyle = "#f59e0b" // Amber
          ctx.beginPath()
          ctx.arc(midX + offsetX, midY + offsetY, 8, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = "#1e293b"
          ctx.font = "10px Arial"
          ctx.fillText(conn.facilityName, midX + offsetX, midY + offsetY - 15)
        }
      }
    })

    // Draw locations
    mapData.locations.forEach((location) => {
      if (!location.position) return

      // Highlight selected location
      if (selectedLocation && selectedLocation.id === location.id) {
        ctx.strokeStyle = "#ef4444"
        ctx.lineWidth = 2
        ctx.strokeRect(location.position.x - 18, location.position.y - 18, 36, 36)
      }

      switch (location.type) {
        case "building":
          ctx.fillStyle = "#10b981" // Green
          ctx.fillRect(location.position.x - 15, location.position.y - 15, 30, 30)
          break

        case "block":
          ctx.fillStyle = "#3b82f6" // Blue
          ctx.fillRect(location.position.x - 15, location.position.y - 15, 30, 30)
          break

        case "facility":
          ctx.fillStyle = "#f59e0b" // Amber
          ctx.fillRect(location.position.x - 15, location.position.y - 15, 30, 30)
          break

        case "intersection":
          ctx.fillStyle = "#64748b" // Gray
          ctx.beginPath()
          ctx.arc(location.position.x, location.position.y, 6, 0, Math.PI * 2)
          ctx.fill()
          break
      }

      // Draw label
      if (location.name) {
        ctx.fillStyle = "#1e293b"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.fillText(location.name, location.position.x, location.position.y - 15)
      }
    })

    // Draw connection in progress
    if (editorMode === "add-connection" && connectionStart?.position) {
      const mousePos = screenToWorld({ x: dragStart.x, y: dragStart.y }, pan, zoom)

      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(connectionStart.position.x, connectionStart.position.y)
      ctx.lineTo(mousePos.x, mousePos.y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.restore()
  }, [mapData, loading, selectedLocation, selectedConnection, zoom, pan, editorMode, connectionStart, dragStart])

  // Handle canvas mouse events
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setDragStart({ x: mouseX, y: mouseY })

    // Convert screen coordinates to world coordinates
    const worldPos = screenToWorld({ x: mouseX, y: mouseY }, pan, zoom)

    if (editorMode === "select") {
      // Select objects
      let found = false

      // Check if clicked on a location
      const location = mapData.locations.find((p) => {
        if (!p.position) return false

        if (p.type === "intersection") {
          return Math.sqrt(Math.pow(p.position.x - worldPos.x, 2) + Math.pow(p.position.y - worldPos.y, 2)) <= 10
        } else {
          return Math.abs(p.position.x - worldPos.x) <= 15 && Math.abs(p.position.y - worldPos.y) <= 15
        }
      })

      if (location) {
        setSelectedLocation(location)
        setSelectedConnection(null)
        setFacilityName("")
        setFacilityDescription("")
        found = true
      }

      // Check if clicked on a connection
      if (!found) {
        const connection = mapData.connections.find((conn) => {
          const point1 = mapData.locations.find((p) => p.id === conn.from)
          const point2 = mapData.locations.find((p) => p.id === conn.to)

          if (point1?.position && point2?.position) {
            return (
              distanceToLine(
                worldPos.x,
                worldPos.y,
                point1.position.x,
                point1.position.y,
                point2.position.x,
                point2.position.y,
              ) <= 10
            )
          }
          return false
        })

        if (connection) {
          setSelectedConnection(connection)
          setSelectedLocation(null)
          setFacilityName(connection.facilityName || "")
          setFacilityDescription(connection.facilityDescription || "")
          found = true
        }
      }

      if (!found) {
        // Deselect all if clicked on empty space
        setSelectedLocation(null)
        setSelectedConnection(null)
        setFacilityName("")
        setFacilityDescription("")

        // Start panning
        setIsDragging(true)
      }
    } else if (editorMode === "add-location") {
      // Add a new location
      const newLocation: Location = {
        id: `location-${Date.now()}`,
        name: `New ${newLocationType}`,
        type: newLocationType,
        position: { x: worldPos.x, y: worldPos.y },
      }

      if (newLocationType === "building" || newLocationType === "block") {
        newLocation.roomNumbers = []
      }

      setMapData((prev) => ({
        ...prev,
        locations: [...prev.locations, newLocation],
      }))

      setSelectedLocation(newLocation)
      setEditorMode("select")
    } else if (editorMode === "add-connection") {
      // Add connection or select start point
      if (!connectionStart) {
        // Find if clicked on a location
        const location = mapData.locations.find((p) => {
          if (!p.position) return false

          if (p.type === "intersection") {
            return Math.sqrt(Math.pow(p.position.x - worldPos.x, 2) + Math.pow(p.position.y - worldPos.y, 2)) <= 10
          } else {
            return Math.abs(p.position.x - worldPos.x) <= 15 && Math.abs(p.position.y - worldPos.y) <= 15
          }
        })

        if (location) {
          setConnectionStart(location)
        }
      } else {
        // Find if clicked on another location
        const location = mapData.locations.find((p) => {
          if (!p.position || p.id === connectionStart.id) return false

          if (p.type === "intersection") {
            return Math.sqrt(Math.pow(p.position.x - worldPos.x, 2) + Math.pow(p.position.y - worldPos.y, 2)) <= 10
          } else {
            return Math.abs(p.position.x - worldPos.x) <= 15 && Math.abs(p.position.y - worldPos.y) <= 15
          }
        })

        if (location) {
          // Check if connection already exists
          const connectionExists = mapData.connections.some(
            (c) =>
              (c.from === connectionStart.id && c.to === location.id) ||
              (c.bidirectional && c.from === location.id && c.to === connectionStart.id),
          )

          if (!connectionExists) {
            // Calculate distance
            const distance = Math.round(
              Math.sqrt(
                Math.pow((location.position?.x || 0) - (connectionStart.position?.x || 0), 2) +
                  Math.pow((location.position?.y || 0) - (connectionStart.position?.y || 0), 2),
              ),
            )

            const newConnection: Connection = {
              id: `conn-${Date.now()}`,
              from: connectionStart.id,
              to: location.id,
              distance,
              type: "path",
              bidirectional: true,
            }

            setMapData((prev) => ({
              ...prev,
              connections: [...prev.connections, newConnection],
            }))

            setSelectedConnection(newConnection)
            setFacilityName("")
            setFacilityDescription("")
          } else {
            toast({
              title: "Connection exists",
              description: "This connection already exists",
              variant: "destructive",
            })
          }

          setConnectionStart(null)
          setEditorMode("select")
        }
      }
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
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  // Helper functions
  const screenToWorld = (screenPos: { x: number; y: number }, pan: { x: number; y: number }, zoom: number) => {
    return {
      x: (screenPos.x - pan.x) / zoom,
      y: (screenPos.y - pan.y) / zoom,
    }
  }

  const distanceToLine = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1
    const B = y - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

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

  // Update location properties
  const updateLocation = (field: string, value: any) => {
    if (!selectedLocation) return

    if (field === "roomNumbers") {
      // Parse room numbers from comma-separated string
      const roomNumbersArray = value
        .split(",")
        .map((r: string) => r.trim())
        .filter((r: string) => r)

      setMapData((prev) => ({
        ...prev,
        locations: prev.locations.map((loc) =>
          loc.id === selectedLocation.id ? { ...loc, roomNumbers: roomNumbersArray } : loc,
        ),
      }))

      setSelectedLocation((prev) => (prev ? { ...prev, roomNumbers: roomNumbersArray } : null))
    } else {
      setMapData((prev) => ({
        ...prev,
        locations: prev.locations.map((loc) => (loc.id === selectedLocation.id ? { ...loc, [field]: value } : loc)),
      }))

      setSelectedLocation((prev) => (prev ? { ...prev, [field]: value } : null))
    }
  }

  // Update connection properties
  const updateConnection = (field: string, value: any) => {
    if (!selectedConnection) return

    setMapData((prev) => ({
      ...prev,
      connections: prev.connections.map((conn) =>
        conn.id === selectedConnection.id ? { ...conn, [field]: value } : conn,
      ),
    }))

    setSelectedConnection((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  // Update facility information
  const updateFacility = () => {
    if (!selectedConnection) return

    setMapData((prev) => ({
      ...prev,
      connections: prev.connections.map((conn) =>
        conn.id === selectedConnection.id
          ? {
              ...conn,
              facilityName: facilityName,
              facilityDescription: facilityDescription,
            }
          : conn,
      ),
    }))

    setSelectedConnection((prev) =>
      prev
        ? {
            ...prev,
            facilityName: facilityName,
            facilityDescription: facilityDescription,
          }
        : null,
    )

    toast({
      title: "Success",
      description: "Facility information updated",
    })
  }

  // Delete selected item
  const deleteSelected = () => {
    if (selectedLocation) {
      // Delete location and all associated connections
      setMapData((prev) => ({
        ...prev,
        locations: prev.locations.filter((loc) => loc.id !== selectedLocation.id),
        connections: prev.connections.filter(
          (conn) => conn.from !== selectedLocation.id && conn.to !== selectedLocation.id,
        ),
      }))

      setSelectedLocation(null)
    } else if (selectedConnection) {
      // Delete connection
      setMapData((prev) => ({
        ...prev,
        connections: prev.connections.filter((conn) => conn.id !== selectedConnection.id),
      }))

      setSelectedConnection(null)
    }
  }

  // Save map data
  const saveMapData = async () => {
    try {
      setSaving(true)

      // In a real app, save to API
      // For now, use localStorage
      localStorage.setItem("campusMap", JSON.stringify(mapData))

      toast({
        title: "Success",
        description: "Map data saved successfully",
      })
    } catch (error) {
      console.error("Error saving map data:", error)
      toast({
        title: "Error",
        description: "Failed to save map data",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Update room numbers when input changes
  useEffect(() => {
    if (selectedLocation && selectedLocation.roomNumbers) {
      setRoomNumbers(selectedLocation.roomNumbers.join(", "))
    } else {
      setRoomNumbers("")
    }
  }, [selectedLocation])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">Loading map data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Campus Map Editor</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom((prev) => Math.min(prev + 0.1, 2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.5))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPan({ x: 0, y: 0 })
                setZoom(1)
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button onClick={saveMapData} disabled={saving} className="flex items-center">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Map"}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Design your campus map for navigation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex gap-2 flex-wrap">
              <Button
                variant={editorMode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setEditorMode("select")
                  setConnectionStart(null)
                }}
              >
                Select
              </Button>
              <Button
                variant={editorMode === "add-location" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setEditorMode("add-location")
                  setConnectionStart(null)
                }}
              >
                <Building className="h-4 w-4 mr-1" /> Add Location
              </Button>
              <Button
                variant={editorMode === "add-connection" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setEditorMode("add-connection")
                  setConnectionStart(null)
                }}
              >
                <MapPin className="h-4 w-4 mr-1" /> Add Connection
              </Button>

              {editorMode === "add-location" && (
                <Select value={newLocationType} onValueChange={(value: any) => setNewLocationType(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Location Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="facility">Facility</SelectItem>
                    <SelectItem value="intersection">Intersection</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="relative border rounded-md overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full cursor-pointer"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />

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
            </div>
          </div>

          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="locations" className="flex-1">
                  Locations
                </TabsTrigger>
                <TabsTrigger value="connections" className="flex-1">
                  Connections
                </TabsTrigger>
              </TabsList>

              <TabsContent value="locations" className="mt-4">
                {selectedLocation ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="location-type">Type</Label>
                      <div className="mt-1 font-medium capitalize">{selectedLocation.type}</div>
                    </div>

                    <div>
                      <Label htmlFor="location-name">Name</Label>
                      <Input
                        id="location-name"
                        value={selectedLocation.name}
                        onChange={(e) => updateLocation("name", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {(selectedLocation.type === "building" || selectedLocation.type === "block") && (
                      <div>
                        <Label htmlFor="room-numbers">Room Numbers (comma-separated)</Label>
                        <Input
                          id="room-numbers"
                          value={roomNumbers}
                          onChange={(e) => updateLocation("roomNumbers", e.target.value)}
                          className="mt-1"
                          placeholder="e.g. 101, 102, 103"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Position</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          type="number"
                          value={selectedLocation.position?.x || 0}
                          onChange={(e) =>
                            updateLocation("position", {
                              ...selectedLocation.position,
                              x: Number(e.target.value),
                            })
                          }
                          placeholder="X"
                        />
                        <Input
                          type="number"
                          value={selectedLocation.position?.y || 0}
                          onChange={(e) =>
                            updateLocation("position", {
                              ...selectedLocation.position,
                              y: Number(e.target.value),
                            })
                          }
                          placeholder="Y"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button variant="destructive" size="sm" onClick={deleteSelected} className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Location
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Select a location to edit its properties</div>
                )}
              </TabsContent>

              <TabsContent value="connections" className="mt-4">
                {selectedConnection ? (
                  <div className="space-y-4">
                    <div>
                      <Label>From</Label>
                      <div className="mt-1 font-medium">
                        {mapData.locations.find((p) => p.id === selectedConnection.from)?.name || "Unknown"}
                      </div>
                    </div>

                    <div>
                      <Label>To</Label>
                      <div className="mt-1 font-medium">
                        {mapData.locations.find((p) => p.id === selectedConnection.to)?.name || "Unknown"}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="connection-distance">Distance (meters)</Label>
                      <Input
                        id="connection-distance"
                        type="number"
                        value={selectedConnection.distance}
                        onChange={(e) => updateConnection("distance", Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Connection Type</Label>
                      <Select
                        value={selectedConnection.type}
                        onValueChange={(value: any) => updateConnection("type", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Connection Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="path">Path</SelectItem>
                          <SelectItem value="corridor">Corridor</SelectItem>
                          <SelectItem value="stairs">Stairs</SelectItem>
                          <SelectItem value="elevator">Elevator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="facility-name">Facility Name</Label>
                      <Input
                        id="facility-name"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        className="mt-1"
                        placeholder="e.g. ATM, Cafeteria"
                      />
                    </div>

                    <div>
                      <Label htmlFor="facility-description">Facility Description</Label>
                      <Input
                        id="facility-description"
                        value={facilityDescription}
                        onChange={(e) => setFacilityDescription(e.target.value)}
                        className="mt-1"
                        placeholder="e.g. 24-hour ATM service"
                      />
                    </div>

                    <Button onClick={updateFacility} className="w-full">
                      Update Facility Information
                    </Button>

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="bidirectional"
                        checked={selectedConnection.bidirectional}
                        onChange={(e) => updateConnection("bidirectional", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="bidirectional" className="text-sm font-medium text-gray-700">
                        Bidirectional
                      </Label>
                    </div>

                    <div className="pt-2">
                      <Button variant="destructive" size="sm" onClick={deleteSelected} className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Connection
                      </Button>
                    </div>
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
      <CardFooter>
        <div className="text-sm text-muted-foreground">
          {editorMode === "select"
            ? "Click on objects to select and edit them"
            : editorMode === "add-location"
              ? "Click on the map to add a new location"
              : "Click on two locations to create a connection between them"}
        </div>
      </CardFooter>
    </Card>
  )
}

