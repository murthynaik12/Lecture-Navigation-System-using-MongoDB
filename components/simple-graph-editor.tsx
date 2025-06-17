"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Save, Plus, Trash2, MapPin } from "lucide-react"

export default function SimpleGraphEditor() {
  const [locations, setLocations] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [locationName, setLocationName] = useState("")
  const [destinationName, setDestinationName] = useState("")
  const [distance, setDistance] = useState("")
  const [activeTab, setActiveTab] = useState("visual")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load saved data on component mount
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
          position: { x: 200, y: 150 },
          roomNumbers: ["101", "102", "103"],
        },
        {
          id: "block1",
          name: "Block A",
          type: "block",
          position: { x: 400, y: 300 },
          roomNumbers: ["A1", "A2"],
        },
        {
          id: "facility1",
          name: "Cafeteria",
          type: "facility",
          position: { x: 300, y: 400 },
        },
      ])
      setConnections([
        { id: "conn1", from: "building1", to: "block1", distance: 100 },
        { id: "conn2", from: "block1", to: "facility1", distance: 150, facilityNearby: "ATM" },
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

      if (fromLocation && toLocation && fromLocation.position && toLocation.position) {
        ctx.strokeStyle = "#94a3b8"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(fromLocation.position.x, fromLocation.position.y)
        ctx.lineTo(toLocation.position.x, toLocation.position.y)
        ctx.stroke()

        // Draw distance
        const midX = (fromLocation.position.x + toLocation.position.x) / 2
        const midY = (fromLocation.position.y + toLocation.position.y) / 2

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
          const angle = Math.atan2(
            toLocation.position.y - fromLocation.position.y,
            toLocation.position.x - fromLocation.position.x,
          )
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
      if (!location.position) return

      const isSelected = selectedLocation && selectedLocation === location.id

      // Draw highlight for selected location
      if (isSelected) {
        ctx.strokeStyle = "#ef4444"
        ctx.lineWidth = 2
        ctx.strokeRect(location.position.x - 18, location.position.y - 18, 36, 36)
      }

      // Draw location based on type
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
          ctx.arc(location.position.x, location.position.y, 8, 0, Math.PI * 2)
          ctx.fill()
          break
      }

      // Draw location name
      ctx.fillStyle = "#1e293b"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(location.name, location.position.x, location.position.y + 25)
    })
  }, [locations, connections, selectedLocation])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on a location
    for (const location of locations) {
      if (!location.position) continue

      const distance = Math.sqrt(Math.pow(location.position.x - x, 2) + Math.pow(location.position.y - y, 2))
      if (distance < 20) {
        setSelectedLocation(location.id)
        return
      }
    }

    // If not clicked on a location, add a new one
    if (activeTab === "visual") {
      const newLocation = {
        id: `location-${Date.now()}`,
        name: "New Location",
        type: "building",
        position: { x, y },
        roomNumbers: [],
      }

      setLocations([...locations, newLocation])
      setSelectedLocation(newLocation.id)
    }
  }

  // Add a new connection
  const addConnection = () => {
    if (!selectedLocation || !destinationName || !distance) {
      toast({
        title: "Error",
        description: "Please select a source location, enter a destination and distance",
        variant: "destructive",
      })
      return
    }

    // Find or create destination
    let destinationLocation = locations.find((loc) => loc.name === destinationName)

    if (!destinationLocation) {
      // Create a new location
      destinationLocation = {
        id: `location-${Date.now()}`,
        name: destinationName,
        type: "building",
        position: {
          x: Math.random() * 500 + 100,
          y: Math.random() * 300 + 100,
        },
        roomNumbers: [],
      }

      setLocations([...locations, destinationLocation])
    }

    // Create the connection
    const newConnection = {
      id: `connection-${Date.now()}`,
      from: selectedLocation,
      to: destinationLocation.id,
      distance: Number.parseInt(distance),
    }

    setConnections([...connections, newConnection])
    setDestinationName("")
    setDistance("")

    toast({
      title: "Success",
      description: "Connection added successfully",
    })
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
          <span>Simple Graph Editor</span>
          <Button onClick={saveMap} className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Map
          </Button>
        </CardTitle>
        <CardDescription>Create a simple graph representation of your campus</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="visual" className="flex-1">
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex-1">
              Add Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual">
            <div className="border rounded-md overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={700}
                height={400}
                className="w-full cursor-pointer"
                onClick={handleCanvasClick}
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Click on the canvas to add a new location or select an existing one
            </div>
          </TabsContent>

          <TabsContent value="connections">
            <div className="grid gap-4 p-4 border rounded-md">
              <h3 className="text-lg font-medium">Add Connection</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source-location">From Location</Label>
                  <select
                    id="source-location"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedLocation || ""}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="">Select source location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination-name">To Location</Label>
                  <Input
                    id="destination-name"
                    value={destinationName}
                    onChange={(e) => setDestinationName(e.target.value)}
                    placeholder="e.g. Cafeteria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance</Label>
                  <Input
                    id="distance"
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>
              <Button onClick={addConnection} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Existing Connections</h3>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No connections added yet</div>
              ) : (
                <div className="space-y-2">
                  {connections.map((connection) => {
                    const fromLocation = locations.find((loc) => loc.id === connection.from)
                    const toLocation = locations.find((loc) => loc.id === connection.to)

                    return (
                      <div key={connection.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div>
                          <span className="text-sm">
                            {fromLocation?.name} → {toLocation?.name}{" "}
                            <span className="text-muted-foreground">({connection.distance} units)</span>
                          </span>
                          {connection.facilityNearby && (
                            <div className="text-xs text-amber-600 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {connection.facilityNearby}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConnections(connections.filter((c) => c.id !== connection.id))
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted-foreground">Don't forget to save your changes using the Save Map button</div>
      </CardFooter>
    </Card>
  )
}

