"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Save, Plus, MapPin, Trash2 } from "lucide-react"

interface Location {
  id: string
  name: string
  type: "building" | "block" | "facility" | "intersection"
  x: number
  y: number
  roomNumbers?: string[]
  floors?: number[]
}

interface Connection {
  id: string
  from: string
  to: string
  distance: number
  facilityNearby?: string
}

export default function SimpleCampusMap() {
  const [locations, setLocations] = useState<Location[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [mode, setMode] = useState<"select" | "add-location" | "add-connection">("select")
  const [newLocationType, setNewLocationType] = useState<"building" | "block" | "facility" | "intersection">("building")
  const [connectionStart, setConnectionStart] = useState<Location | null>(null)
  const [roomInput, setRoomInput] = useState("")
  const [floorInput, setFloorInput] = useState("")
  const [facilityInput, setFacilityInput] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load saved map data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("campusMap")
    if (savedData) {
      try {
        const { locations, connections } = JSON.parse(savedData)
        setLocations(locations || [])
        setConnections(connections || [])
      } catch (error) {
        console.error("Error loading map data:", error)
      }
    } else {
      // Set some example data if nothing is saved
      setLocations([
        {
          id: "building1",
          name: "Main Building",
          type: "building",
          x: 200,
          y: 150,
          roomNumbers: ["101", "102", "103"],
          floors: [1, 2],
        },
        { id: "block1", name: "Block A", type: "block", x: 400, y: 300, roomNumbers: ["A1", "A2"], floors: [1] },
        { id: "facility1", name: "Cafeteria", type: "facility", x: 300, y: 400 },
        { id: "intersection1", name: "Main Junction", type: "intersection", x: 300, y: 250 },
      ])
      setConnections([
        { id: "conn1", from: "building1", to: "intersection1", distance: 100 },
        { id: "conn2", from: "intersection1", to: "block1", distance: 150, facilityNearby: "ATM" },
        { id: "conn3", from: "intersection1", to: "facility1", distance: 120 },
      ])
    }
  }, [])

  // Draw the map whenever data changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1
    const gridSize = 50
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
    connections.forEach((connection) => {
      const fromLocation = locations.find((loc) => loc.id === connection.from)
      const toLocation = locations.find((loc) => loc.id === connection.to)

      if (fromLocation && toLocation) {
        // Highlight selected connection
        if (selectedConnection && selectedConnection.id === connection.id) {
          ctx.strokeStyle = "#ef4444" // Red
          ctx.lineWidth = 3
        } else {
          ctx.strokeStyle = "#94a3b8" // Gray
          ctx.lineWidth = 2
        }

        ctx.beginPath()
        ctx.moveTo(fromLocation.x, fromLocation.y)
        ctx.lineTo(toLocation.x, toLocation.y)
        ctx.stroke()

        // Draw distance
        const midX = (fromLocation.x + toLocation.x) / 2
        const midY = (fromLocation.y + toLocation.y) / 2

        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(midX, midY, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "#d1d5db"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = "#475569"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(connection.distance.toString(), midX, midY)

        // Draw nearby facility if exists
        if (connection.facilityNearby) {
          const angle = Math.atan2(toLocation.y - fromLocation.y, toLocation.x - fromLocation.x)
          const offsetX = Math.sin(angle) * 15
          const offsetY = -Math.cos(angle) * 15

          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.beginPath()
          ctx.roundRect(midX + offsetX - 40, midY + offsetY - 10, 80, 20, 5)
          ctx.fill()
          ctx.strokeStyle = "#d1d5db"
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.fillStyle = "#1e293b"
          ctx.font = "9px Arial"
          ctx.fillText(connection.facilityNearby, midX + offsetX, midY + offsetY)
        }
      }
    })

    // Draw locations
    locations.forEach((location) => {
      const isSelected = selectedLocation && selectedLocation.id === location.id

      // Draw highlight for selected location
      if (isSelected) {
        ctx.strokeStyle = "#ef4444" // Red
        ctx.lineWidth = 2
        ctx.strokeRect(location.x - 18, location.y - 18, 36, 36)
      }

      // Draw location based on type
      switch (location.type) {
        case "building":
          ctx.fillStyle = "#10b981" // Green
          ctx.fillRect(location.x - 15, location.y - 15, 30, 30)
          break
        case "block":
          ctx.fillStyle = "#3b82f6" // Blue
          ctx.fillRect(location.x - 15, location.y - 15, 30, 30)
          break
        case "facility":
          ctx.fillStyle = "#f59e0b" // Amber
          ctx.fillRect(location.x - 15, location.y - 15, 30, 30)
          break
        case "intersection":
          ctx.fillStyle = "#64748b" // Gray
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

      // Draw room numbers and floors for buildings and blocks
      if (
        (location.type === "building" || location.type === "block") &&
        location.roomNumbers &&
        location.roomNumbers.length > 0
      ) {
        ctx.fillStyle = "#ffffff"
        ctx.font = "8px Arial"
        ctx.fillText(location.roomNumbers[0], location.x, location.y)
      }
    })

    // Draw connection in progress
    if (mode === "add-connection" && connectionStart) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = connectionStart.x
      const mouseY = connectionStart.y

      ctx.strokeStyle = "#3b82f6" // Blue
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(connectionStart.x, connectionStart.y)
      ctx.lineTo(mouseX, mouseY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [locations, connections, selectedLocation, selectedConnection, mode, connectionStart])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (mode === "select") {
      // Select location or connection
      let found = false

      // Check if clicked on a location
      for (const location of locations) {
        const distance = Math.sqrt(Math.pow(location.x - x, 2) + Math.pow(location.y - y, 2))
        if (distance < 20) {
          setSelectedLocation(location)
          setSelectedConnection(null)
          found = true
          break
        }
      }

      if (!found) {
        // Check if clicked on a connection
        for (const connection of connections) {
          const fromLocation = locations.find((loc) => loc.id === connection.from)
          const toLocation = locations.find((loc) => loc.id === connection.to)

          if (fromLocation && toLocation) {
            const distance = distanceToLine(x, y, fromLocation.x, fromLocation.y, toLocation.x, toLocation.y)
            if (distance < 10) {
              setSelectedConnection(connection)
              setSelectedLocation(null)
              setFacilityInput(connection.facilityNearby || "")
              found = true
              break
            }
          }
        }
      }

      if (!found) {
        setSelectedLocation(null)
        setSelectedConnection(null)
      }
    } else if (mode === "add-location") {
      // Add new location
      const newLocation: Location = {
        id: `${newLocationType}-${Date.now()}`,
        name: `New ${newLocationType}`,
        type: newLocationType,
        x,
        y,
      }

      if (newLocationType === "building" || newLocationType === "block") {
        newLocation.roomNumbers = []
        newLocation.floors = []
      }

      setLocations([...locations, newLocation])
      setSelectedLocation(newLocation)
      setMode("select")
    } else if (mode === "add-connection") {
      // Add connection or select start point
      if (!connectionStart) {
        // Find if clicked on a location
        const location = locations.find((loc) => {
          const distance = Math.sqrt(Math.pow(loc.x - x, 2) + Math.pow(loc.y - y, 2))
          return distance < 20
        })

        if (location) {
          setConnectionStart(location)
        }
      } else {
        // Find if clicked on another location
        const location = locations.find((loc) => {
          if (loc.id === connectionStart.id) return false
          const distance = Math.sqrt(Math.pow(loc.x - x, 2) + Math.pow(loc.y - y, 2))
          return distance < 20
        })

        if (location) {
          // Create new connection
          const newConnection: Connection = {
            id: `connection-${Date.now()}`,
            from: connectionStart.id,
            to: location.id,
            distance: Math.round(
              Math.sqrt(Math.pow(location.x - connectionStart.x, 2) + Math.pow(location.y - connectionStart.y, 2)),
            ),
          }

          setConnections([...connections, newConnection])
          setSelectedConnection(newConnection)
          setConnectionStart(null)
          setMode("select")
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

  // Update location name
  const updateLocationName = (name: string) => {
    if (!selectedLocation) return

    setLocations(locations.map((loc) => (loc.id === selectedLocation.id ? { ...loc, name } : loc)))
    setSelectedLocation({ ...selectedLocation, name })
  }

  // Add room number to location
  const addRoomNumber = () => {
    if (!selectedLocation || !roomInput) return
    if (!selectedLocation.roomNumbers) return

    const updatedRoomNumbers = [...selectedLocation.roomNumbers, roomInput]

    setLocations(
      locations.map((loc) => (loc.id === selectedLocation.id ? { ...loc, roomNumbers: updatedRoomNumbers } : loc)),
    )
    setSelectedLocation({ ...selectedLocation, roomNumbers: updatedRoomNumbers })
    setRoomInput("")
  }

  // Add floor to location
  const addFloor = () => {
    if (!selectedLocation || !floorInput) return
    if (!selectedLocation.floors) return

    const floor = Number.parseInt(floorInput)
    if (isNaN(floor)) return

    const updatedFloors = [...selectedLocation.floors, floor]

    setLocations(locations.map((loc) => (loc.id === selectedLocation.id ? { ...loc, floors: updatedFloors } : loc)))
    setSelectedLocation({ ...selectedLocation, floors: updatedFloors })
    setFloorInput("")
  }

  // Update connection distance
  const updateConnectionDistance = (distance: string) => {
    if (!selectedConnection) return

    const distanceNum = Number.parseInt(distance)
    if (isNaN(distanceNum)) return

    setConnections(
      connections.map((conn) => (conn.id === selectedConnection.id ? { ...conn, distance: distanceNum } : conn)),
    )
    setSelectedConnection({ ...selectedConnection, distance: distanceNum })
  }

  // Update nearby facility
  const updateNearbyFacility = () => {
    if (!selectedConnection) return

    setConnections(
      connections.map((conn) =>
        conn.id === selectedConnection.id ? { ...conn, facilityNearby: facilityInput } : conn,
      ),
    )
    setSelectedConnection({ ...selectedConnection, facilityNearby: facilityInput })
  }

  // Delete selected item
  const deleteSelected = () => {
    if (selectedLocation) {
      setLocations(locations.filter((loc) => loc.id !== selectedLocation.id))
      // Also delete any connections involving this location
      setConnections(connections.filter((conn) => conn.from !== selectedLocation.id && conn.to !== selectedLocation.id))
      setSelectedLocation(null)
    } else if (selectedConnection) {
      setConnections(connections.filter((conn) => conn.id !== selectedConnection.id))
      setSelectedConnection(null)
    }
  }

  // Save map data
  const saveMap = () => {
    try {
      localStorage.setItem("campusMap", JSON.stringify({ locations, connections }))
      toast({
        title: "Success",
        description: "Map saved successfully",
      })
    } catch (error) {
      console.error("Error saving map:", error)
      toast({
        title: "Error",
        description: "Failed to save map",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Campus Map Editor</span>
          <Button onClick={saveMap} className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Map
          </Button>
        </CardTitle>
        <CardDescription>Design your campus map for navigation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex gap-2 flex-wrap">
              <Button
                variant={mode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMode("select")
                  setConnectionStart(null)
                }}
              >
                Select
              </Button>
              <Button
                variant={mode === "add-location" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMode("add-location")
                  setConnectionStart(null)
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Location
              </Button>
              <Button
                variant={mode === "add-connection" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMode("add-connection")
                  setConnectionStart(null)
                }}
              >
                <MapPin className="h-4 w-4 mr-1" /> Add Connection
              </Button>

              {mode === "add-location" && (
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
                width={600}
                height={400}
                className="w-full cursor-pointer"
                onClick={handleCanvasClick}
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
            {selectedLocation ? (
              <div className="space-y-4">
                <h3 className="font-medium">Edit Location</h3>
                <div>
                  <Label htmlFor="location-name">Name</Label>
                  <Input
                    id="location-name"
                    value={selectedLocation.name}
                    onChange={(e) => updateLocationName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="mt-1 font-medium capitalize">{selectedLocation.type}</div>
                </div>

                {(selectedLocation.type === "building" || selectedLocation.type === "block") && (
                  <>
                    <div>
                      <Label>Room Numbers</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={roomInput}
                          onChange={(e) => setRoomInput(e.target.value)}
                          placeholder="Add room number"
                        />
                        <Button size="sm" onClick={addRoomNumber}>
                          Add
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedLocation.roomNumbers?.map((room, index) => (
                          <div key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {room}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Floors</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          value={floorInput}
                          onChange={(e) => setFloorInput(e.target.value)}
                          placeholder="Add floor"
                        />
                        <Button size="sm" onClick={addFloor}>
                          Add
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedLocation.floors?.map((floor, index) => (
                          <div key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            Floor {floor}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button variant="destructive" size="sm" onClick={deleteSelected} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Location
                </Button>
              </div>
            ) : selectedConnection ? (
              <div className="space-y-4">
                <h3 className="font-medium">Edit Connection</h3>
                <div>
                  <Label>From</Label>
                  <div className="mt-1 font-medium">
                    {locations.find((loc) => loc.id === selectedConnection.from)?.name || "Unknown"}
                  </div>
                </div>
                <div>
                  <Label>To</Label>
                  <div className="mt-1 font-medium">
                    {locations.find((loc) => loc.id === selectedConnection.to)?.name || "Unknown"}
                  </div>
                </div>
                <div>
                  <Label htmlFor="connection-distance">Distance (meters)</Label>
                  <Input
                    id="connection-distance"
                    type="number"
                    value={selectedConnection.distance}
                    onChange={(e) => updateConnectionDistance(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nearby-facility">Nearby Facility</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="nearby-facility"
                      value={facilityInput}
                      onChange={(e) => setFacilityInput(e.target.value)}
                      placeholder="e.g. ATM, Cafeteria"
                    />
                    <Button size="sm" onClick={updateNearbyFacility}>
                      Update
                    </Button>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={deleteSelected} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Connection
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {mode === "select"
                  ? "Select an item on the map to edit"
                  : mode === "add-location"
                    ? "Click on the map to add a location"
                    : connectionStart
                      ? "Click on another location to create a connection"
                      : "Click on a location to start a connection"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

