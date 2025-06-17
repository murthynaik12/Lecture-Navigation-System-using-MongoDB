"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation, ArrowRight, Info } from "lucide-react"

interface Location {
  id: string
  name: string
  type: string
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

interface NavigationStep {
  from: string
  to: string
  distance: number
  direction: string
  facilityNearby?: string
}

export default function SimpleNavigation() {
  const [locations, setLocations] = useState<Location[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [startLocation, setStartLocation] = useState<string>("")
  const [startRoom, setStartRoom] = useState<string>("")
  const [endLocation, setEndLocation] = useState<string>("")
  const [endRoom, setEndRoom] = useState<string>("")
  const [route, setRoute] = useState<NavigationStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [availableStartRooms, setAvailableStartRooms] = useState<string[]>([])
  const [availableEndRooms, setAvailableEndRooms] = useState<string[]>([])

  // Load map data
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
    }
  }, [])

  // Update available rooms when start location changes
  useEffect(() => {
    if (startLocation) {
      const location = locations.find((loc) => loc.id === startLocation)
      setAvailableStartRooms(location?.roomNumbers || [])
      setStartRoom("")
    } else {
      setAvailableStartRooms([])
      setStartRoom("")
    }
  }, [startLocation, locations])

  // Update available rooms when end location changes
  useEffect(() => {
    if (endLocation) {
      const location = locations.find((loc) => loc.id === endLocation)
      setAvailableEndRooms(location?.roomNumbers || [])
      setEndRoom("")
    } else {
      setAvailableEndRooms([])
      setEndRoom("")
    }
  }, [endLocation, locations])

  // Find route when start and end are selected
  const findRoute = () => {
    if (!startLocation || !endLocation) return

    // Simple implementation of Dijkstra's algorithm
    const graph: Record<string, Record<string, { distance: number; facilityNearby?: string }>> = {}

    // Initialize graph
    locations.forEach((location) => {
      graph[location.id] = {}
    })

    // Add connections to the graph
    connections.forEach((connection) => {
      graph[connection.from][connection.to] = {
        distance: connection.distance,
        facilityNearby: connection.facilityNearby,
      }
      // Assuming all connections are bidirectional
      graph[connection.to][connection.from] = {
        distance: connection.distance,
        facilityNearby: connection.facilityNearby,
      }
    })

    // Find shortest path using Dijkstra's algorithm
    const distances: Record<string, number> = {}
    const previous: Record<string, string | null> = {}
    const unvisited = new Set<string>()

    // Initialize
    locations.forEach((location) => {
      distances[location.id] = Number.POSITIVE_INFINITY
      previous[location.id] = null
      unvisited.add(location.id)
    })

    distances[startLocation] = 0

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let current: string | null = null
      let minDistance = Number.POSITIVE_INFINITY

      unvisited.forEach((id) => {
        if (distances[id] < minDistance) {
          minDistance = distances[id]
          current = id
        }
      })

      if (current === null || current === endLocation || minDistance === Number.POSITIVE_INFINITY) {
        break
      }

      unvisited.delete(current)

      // Update distances to neighbors
      Object.entries(graph[current]).forEach(([neighbor, { distance }]) => {
        if (unvisited.has(neighbor)) {
          const alt = distances[current] + distance
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt
            previous[neighbor] = current
          }
        }
      })
    }

    // Reconstruct path
    const path: string[] = []
    let current = endLocation

    if (previous[endLocation] === null && endLocation !== startLocation) {
      // No path found
      setRoute([])
      return
    }

    while (current) {
      path.unshift(current)
      current = previous[current] || ""
    }

    // Convert path to navigation steps
    const steps: NavigationStep[] = []
    for (let i = 0; i < path.length - 1; i++) {
      const fromId = path[i]
      const toId = path[i + 1]
      const fromLocation = locations.find((loc) => loc.id === fromId)
      const toLocation = locations.find((loc) => loc.id === toId)

      if (fromLocation && toLocation) {
        const connectionInfo = graph[fromId][toId]
        steps.push({
          from: fromId,
          to: toId,
          distance: connectionInfo.distance,
          direction: `Go from ${fromLocation.name} to ${toLocation.name}`,
          facilityNearby: connectionInfo.facilityNearby,
        })
      }
    }

    setRoute(steps)
    setCurrentStep(0)
  }

  // Next step in navigation
  const nextStep = () => {
    if (currentStep < route.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Previous step in navigation
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Campus Navigator</CardTitle>
        <CardDescription>Find your way around campus</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start Location</Label>
              <Select value={startLocation} onValueChange={setStartLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc.type === "building" || loc.type === "block")
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {availableStartRooms.length > 0 && (
              <div className="space-y-2">
                <Label>Start Room</Label>
                <Select value={startRoom} onValueChange={setStartRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStartRooms.map((room) => (
                      <SelectItem key={room} value={room}>
                        Room {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={endLocation} onValueChange={setEndLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc.type === "building" || loc.type === "block")
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {availableEndRooms.length > 0 && (
              <div className="space-y-2">
                <Label>Destination Room</Label>
                <Select value={endRoom} onValueChange={setEndRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEndRooms.map((room) => (
                      <SelectItem key={room} value={room}>
                        Room {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <Button onClick={findRoute} className="w-full mb-6" disabled={!startLocation || !endLocation}>
          <Navigation className="h-4 w-4 mr-2" />
          Find Route
        </Button>

        {route.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">Total Distance:</span>{" "}
                {route.reduce((total, step) => total + step.distance, 0)} meters
              </div>
              <div className="text-sm">
                <span className="font-medium">Estimated Time:</span>{" "}
                {Math.ceil(route.reduce((total, step) => total + step.distance, 0) / 80)} minutes
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                <span className="font-medium">
                  Step {currentStep + 1} of {route.length}:
                </span>{" "}
                {route[currentStep].direction}
                {route[currentStep].facilityNearby && (
                  <span className="block mt-1 text-sm">
                    <strong>Nearby:</strong> {route[currentStep].facilityNearby}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setRoute([])}>
                Reset
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                  Previous
                </Button>
                <Button variant="outline" onClick={nextStep} disabled={currentStep >= route.length - 1}>
                  <ArrowRight className="h-4 w-4 mr-1" /> Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Select start and destination locations to find a route
          </div>
        )}
      </CardContent>
    </Card>
  )
}

