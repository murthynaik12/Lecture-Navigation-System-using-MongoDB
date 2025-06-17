"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Navigation, ArrowRight, Info } from "lucide-react"
import CampusMap from "./campus-map"
import { Alert, AlertDescription } from "@/components/ui/alert"
import IndoorNavigation from "./indoor-navigation"
import type { Location, Connection, Facility } from "@/lib/models"

interface CampusNavigatorProps {
  startRoomId?: string
  destinationRoomId?: string
}

interface RouteStep {
  from: string
  to: string
  distance: number
  direction: string
  facilityName?: string
  facilityDescription?: string
}

export default function CampusNavigator({ startRoomId, destinationRoomId }: CampusNavigatorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [route, setRoute] = useState<RouteStep[] | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showIndoorNav, setShowIndoorNav] = useState(false)
  const [indoorNavDetails, setIndoorNavDetails] = useState({
    roomNumber: "",
    floor: 0,
    startRoom: "",
    startFloor: 0,
  })
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [autoRouteApplied, setAutoRouteApplied] = useState(false)
  const [destinationDetails, setDestinationDetails] = useState<{
    name: string
    type: string
    roomNumber?: string
  } | null>(null)

  // Load locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true)

        // Try to load from localStorage first
        const savedData = localStorage.getItem("campusMap")
        if (savedData) {
          try {
            const { locations, connections } = JSON.parse(savedData)
            if (locations && locations.length > 0) {
              setLocations(locations)
              setConnections(connections || [])

              // Set initial values if provided
              if (startRoomId) {
                setSelectedStart(startRoomId)
              }

              if (destinationRoomId) {
                setSelectedDestination(destinationRoomId)

                // Get destination details
                const destination = locations.find((loc) => loc.id === destinationRoomId)
                if (destination) {
                  setDestinationDetails({
                    name: destination.name,
                    type: destination.type,
                    roomNumber: destination.roomNumbers?.[0],
                  })
                }
              }

              setLoading(false)
              return
            }
          } catch (error) {
            console.error("Error parsing saved map data:", error)
          }
        }

        // Fallback to mock data
        const mockLocations: Location[] = [
          {
            id: "gandhi-chowk",
            name: "Gandhi Chowk",
            type: "intersection",
            details: "Central intersection connecting main campus areas",
            position: { x: 400, y: 300 },
          },
          {
            id: "library",
            name: "Library",
            type: "building",
            roomNumbers: ["LIB101", "LIB102", "LIB201"],
            details: "Main campus library with study areas and computer labs",
            position: { x: 200, y: 200 },
          },
          {
            id: "block1",
            name: "Block 1",
            type: "block",
            roomNumbers: ["B101", "B102", "B103"],
            details: "Science department with laboratories and lecture halls",
            position: { x: 300, y: 400 },
          },
          {
            id: "nescafe",
            name: "Nescafe",
            type: "facility",
            details: "Coffee shop with seating area and snacks",
            position: { x: 400, y: 450 },
          },
        ]

        const mockConnections: Connection[] = [
          {
            id: "conn1",
            from: "gandhi-chowk",
            to: "library",
            distance: 150,
            facilityName: "Stationery Shop",
            facilityDescription: "Shop selling books, stationery and printing services",
            type: "path",
            bidirectional: true,
          },
          {
            id: "conn2",
            from: "gandhi-chowk",
            to: "block1",
            distance: 100,
            facilityName: "ATM",
            facilityDescription: "24-hour ATM service with cash deposit facility",
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
        ]

        setLocations(mockLocations)
        setConnections(mockConnections)

        // Set initial values if provided
        if (startRoomId) {
          setSelectedStart(startRoomId)
        }

        if (destinationRoomId) {
          setSelectedDestination(destinationRoomId)

          // Get destination details from mock data
          const destination = mockLocations.find((loc) => loc.id === destinationRoomId)
          if (destination) {
            setDestinationDetails({
              name: destination.name,
              type: destination.type,
              roomNumber: destination.roomNumbers?.[0],
            })
          }
        }
      } catch (error) {
        console.error("Error loading locations:", error)
        toast({
          title: "Error",
          description: "Failed to load locations",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [startRoomId, destinationRoomId])

  // Find route when start and destination are selected
  useEffect(() => {
    if (selectedStart && selectedDestination) {
      findRoute(selectedStart, selectedDestination)

      // If this is from props (auto-routing), set the flag
      if (startRoomId && destinationRoomId && !autoRouteApplied) {
        setAutoRouteApplied(true)
      }
    } else {
      setRoute(null)
    }
  }, [selectedStart, selectedDestination, startRoomId, destinationRoomId, autoRouteApplied])

  // Find location by room number
  const findLocationByRoom = (locations: Location[], roomNumber: string): Location | null => {
    for (const location of locations) {
      if (location.roomNumbers && location.roomNumbers.includes(roomNumber)) {
        return location
      }
    }
    return null
  }

  // Find route between two locations
  const findRoute = (startId: string, destId: string) => {
    // In a real app, this would call an API
    // For now, use the connections data to build a route

    // Find a path using a simple algorithm
    const path = findPath(startId, destId)

    if (path.length < 2) {
      toast({
        title: "No Route Found",
        description: "Could not find a route between these locations",
        variant: "destructive",
      })
      setRoute(null)
      return
    }

    // Convert path to route steps
    const steps: RouteStep[] = []
    const routeFacilities: Facility[] = []

    for (let i = 0; i < path.length - 1; i++) {
      const fromId = path[i]
      const toId = path[i + 1]

      // Find the connection between these locations
      const connection = connections.find(
        (conn) =>
          (conn.from === fromId && conn.to === toId) ||
          (conn.bidirectional && conn.from === toId && conn.to === fromId),
      )

      if (connection) {
        const fromLocation = locations.find((loc) => loc.id === fromId)
        const toLocation = locations.find((loc) => loc.id === toId)

        if (fromLocation && toLocation) {
          steps.push({
            from: fromId,
            to: toId,
            distance: connection.distance,
            direction: `Go from ${fromLocation.name} to ${toLocation.name}`,
            facilityName: connection.facilityName,
            facilityDescription: connection.facilityDescription,
          })

          // Add facility to the list if it exists
          if (connection.facilityName) {
            routeFacilities.push({
              name: connection.facilityName,
              description: connection.facilityDescription || "",
              location: `Between ${fromLocation.name} and ${toLocation.name}`,
              connectionId: connection.id,
            })
          }
        }
      }
    }

    setRoute(steps)
    setFacilities(routeFacilities)
    setCurrentStep(0)
  }

  // Simple path finding algorithm (breadth-first search)
  const findPath = (startId: string, endId: string): string[] => {
    const queue: string[] = [startId]
    const visited = new Set<string>([startId])
    const previous: Record<string, string | null> = {}
    previous[startId] = null

    while (queue.length > 0) {
      const current = queue.shift()!

      if (current === endId) {
        // Path found, reconstruct it
        const path: string[] = []
        let curr = current
        while (curr !== null) {
          path.unshift(curr)
          curr = previous[curr]!
        }
        return path
      }

      // Find all connected locations
      for (const conn of connections) {
        let nextId: string | null = null

        if (conn.from === current) {
          nextId = conn.to
        } else if (conn.bidirectional && conn.to === current) {
          nextId = conn.from
        }

        if (nextId && !visited.has(nextId)) {
          visited.add(nextId)
          queue.push(nextId)
          previous[nextId] = current
        }
      }
    }

    return [] // No path found
  }

  // Handle location selection
  const handleLocationSelect = (locationType: "start" | "destination", locationId: string) => {
    if (locationType === "start") {
      setSelectedStart(locationId)
    } else {
      setSelectedDestination(locationId)

      // Get destination details
      const destination = locations.find((loc) => loc.id === locationId)
      if (destination) {
        setDestinationDetails({
          name: destination.name,
          type: destination.type,
          roomNumber: destination.roomNumbers?.[0],
        })
      }
    }
  }

  // Next step in navigation
  const nextStep = () => {
    if (route && currentStep < route.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // If we're at the last step, show indoor navigation
      if (selectedDestination) {
        const destLocation = locations.find((loc) => loc.id === selectedDestination)
        if (destLocation && destLocation.roomNumbers && destLocation.roomNumbers.length > 0) {
          setIndoorNavDetails({
            roomNumber: destLocation.roomNumbers[0],
            floor: 1, // Assuming floor 1 for demo
            startRoom: "entrance",
            startFloor: 0,
          })
          setShowIndoorNav(true)
        }
      }
    }
  }

  // Previous step in navigation
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">Loading map data...</div>
        </CardContent>
      </Card>
    )
  }

  if (showIndoorNav) {
    return (
      <IndoorNavigation
        roomNumber={indoorNavDetails.roomNumber}
        floor={indoorNavDetails.floor}
        startRoom={indoorNavDetails.startRoom}
        startFloor={indoorNavDetails.startFloor}
        onClose={() => setShowIndoorNav(false)}
      />
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Campus Navigator</CardTitle>
        <CardDescription>
          {destinationDetails
            ? `Finding route to ${destinationDetails.name}${destinationDetails.roomNumber ? ` (Room ${destinationDetails.roomNumber})` : ""}`
            : "Find your way around campus"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!autoRouteApplied && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Location</label>
              <Select value={selectedStart || ""} onValueChange={(value) => handleLocationSelect("start", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc.type !== "intersection")
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedStart && (
                <div className="text-xs text-muted-foreground">
                  {locations.find((loc) => loc.id === selectedStart)?.details}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Select
                value={selectedDestination || ""}
                onValueChange={(value) => handleLocationSelect("destination", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc.type !== "intersection")
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedDestination && (
                <div className="text-xs text-muted-foreground">
                  {locations.find((loc) => loc.id === selectedDestination)?.details}
                </div>
              )}
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => findRoute(selectedStart!, selectedDestination!)}
                className="w-full"
                disabled={!selectedStart || !selectedDestination}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Find Route
              </Button>
            </div>
          </div>
        )}

        <CampusMap
          startPoint={selectedStart || undefined}
          endPoint={selectedDestination || undefined}
          showRoute={!!route}
        />

        {route && (
          <div className="space-y-4 mt-6">
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
                <div className="font-medium">{route[currentStep].direction}</div>
                {route[currentStep].facilityName && (
                  <div className="mt-2">
                    <div className="font-medium">Nearby: {route[currentStep].facilityName}</div>
                    <div className="text-sm">{route[currentStep].facilityDescription}</div>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Facilities along the route */}
            {facilities.length > 0 && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50">
                <h3 className="text-lg font-medium mb-2">Facilities Along Route</h3>
                <ul className="space-y-2">
                  {facilities.map((facility, index) => (
                    <li key={index} className="border-b pb-2 last:border-0">
                      <div className="font-medium">{facility.name}</div>
                      <div className="text-sm text-gray-600">{facility.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{facility.location}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setRoute(null)}>
                Reset
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                  Previous
                </Button>
                <Button variant="outline" onClick={nextStep}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  {currentStep >= route.length - 1 ? "Enter Building" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

