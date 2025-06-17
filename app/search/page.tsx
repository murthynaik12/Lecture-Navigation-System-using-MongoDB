"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { SearchIcon, Navigation } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Header from "@/components/header"

interface Lecture {
  _id: string
  subjectName: string
  lectureName: string
  roomNumber: string
  floor: number
}

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

interface Facility {
  location: string
  description: string
  from: string
  to: string
}

export default function SearchPage() {
  const { session } = useAuth()
  const [query, setQuery] = useState("")
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNavigation, setShowNavigation] = useState(false)
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)

  // Map data
  const [locations, setLocations] = useState<Location[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [route, setRoute] = useState<NavigationStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [facilitiesAlongRoute, setFacilitiesAlongRoute] = useState<Facility[]>([])

  // Canvas for graph animation
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animationFrame, setAnimationFrame] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch lectures
        const response = await fetch("/api/lectures")
        const data = await response.json()

        if (response.ok) {
          // Ensure data is an array
          const lecturesArray = Array.isArray(data) ? data : []
          setLectures(lecturesArray)
          setFilteredLectures([])
        }

        // Load map data from localStorage
        const savedMapData = localStorage.getItem("campusMap")
        if (savedMapData) {
          try {
            const { locations, connections } = JSON.parse(savedMapData)
            setLocations(locations || [])
            setConnections(connections || [])
          } catch (error) {
            console.error("Error loading map data:", error)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Clean up animation on unmount
    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  // Draw the graph animation
  useEffect(() => {
    if (!showNavigation || !selectedLecture) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Check if we have a simple graph available
    const savedSimpleGraph = localStorage.getItem("campusSimpleGraph")
    const savedFacilities = localStorage.getItem("campusFacilities")

    if (savedSimpleGraph) {
      try {
        const simpleGraph = JSON.parse(savedSimpleGraph)
        const facilitiesData = savedFacilities ? JSON.parse(savedFacilities) : {}

        // Calculate positions for each node
        const nodes: { [key: string]: { x: number; y: number } } = {}
        const nodeCount = Object.keys(simpleGraph).length

        if (nodeCount === 0) return

        // Position nodes in a circle
        const radius = Math.min(canvas.width, canvas.height) / 2.5
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        Object.keys(simpleGraph).forEach((node, index) => {
          const angle = (index / nodeCount) * 2 * Math.PI
          nodes[node] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          }
        })

        // Draw edges
        Object.entries(simpleGraph).forEach(([node, connections]) => {
          Object.entries(connections as { [key: string]: number }).forEach(([target, weight]) => {
            // Only draw each edge once
            if (node < target) {
              const startPos = nodes[node]
              const endPos = nodes[target]

              // Draw line
              ctx.beginPath()
              ctx.moveTo(startPos.x, startPos.y)
              ctx.lineTo(endPos.x, endPos.y)
              ctx.strokeStyle = "#94a3b8"
              ctx.lineWidth = 2
              ctx.stroke()

              // Draw weight
              const midX = (startPos.x + endPos.x) / 2
              const midY = (startPos.y + endPos.y) / 2

              // Draw background for weight
              ctx.fillStyle = "white"
              ctx.beginPath()
              ctx.arc(midX, midY, 12, 0, 2 * Math.PI)
              ctx.fill()
              ctx.strokeStyle = "#e2e8f0"
              ctx.lineWidth = 1
              ctx.stroke()

              // Draw weight text
              ctx.fillStyle = "#334155"
              ctx.font = "10px Arial"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(weight.toString(), midX, midY)

              // Check if there's a facility on this path
              const facilityKey = `${node}-${target}`
              const reverseFacilityKey = `${target}-${node}`

              if (facilitiesData[facilityKey] || facilitiesData[reverseFacilityKey]) {
                const facility = facilitiesData[facilityKey] || facilitiesData[reverseFacilityKey]

                // Calculate offset for facility icon
                const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x)
                const offsetX = Math.sin(angle) * 20
                const offsetY = -Math.cos(angle) * 20

                // Draw facility icon
                ctx.fillStyle = "#f59e0b"
                ctx.beginPath()
                ctx.arc(midX + offsetX, midY + offsetY, 8, 0, 2 * Math.PI)
                ctx.fill()

                // Draw facility name
                ctx.fillStyle = "#1e293b"
                ctx.font = "10px Arial"
                ctx.fillText(facility.location, midX + offsetX, midY + offsetY - 15)
              }
            }
          })
        })

        // Draw nodes
        Object.entries(nodes).forEach(([node, pos]) => {
          // Highlight if this is part of the test path
          const isInPath = route.some((step) => step.from === node || step.to === node)

          // Draw node
          ctx.fillStyle = isInPath ? "#3b82f6" : "#10b981"
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI)
          ctx.fill()

          // Draw node label
          ctx.fillStyle = "white"
          ctx.font = "bold 10px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(node.substring(0, 2), pos.x, pos.y)

          // Draw full node name below
          ctx.fillStyle = "#1e293b"
          ctx.font = "12px Arial"
          ctx.fillText(node, pos.x, pos.y + 25)
        })

        // Draw path if available
        if (route.length > 0) {
          ctx.strokeStyle = "#ef4444"
          ctx.lineWidth = 3

          // Get unique locations in the route
          const pathLocations: string[] = []
          route.forEach((step) => {
            if (!pathLocations.includes(step.from)) pathLocations.push(step.from)
            if (!pathLocations.includes(step.to)) pathLocations.push(step.to)
          })

          // Draw path segments
          for (let i = 0; i < pathLocations.length - 1; i++) {
            const from = pathLocations[i]
            const to = pathLocations[i + 1]

            if (nodes[from] && nodes[to]) {
              ctx.beginPath()
              ctx.moveTo(nodes[from].x, nodes[from].y)
              ctx.lineTo(nodes[to].x, nodes[to].y)
              ctx.stroke()
            }
          }
        }

        return
      } catch (error) {
        console.error("Error drawing simple graph:", error)
        // Fall back to original drawing method
      }
    }

    // Original drawing method (complex graph)
    // Draw locations
    locations.forEach((location) => {
      // Skip locations without position data (we'll calculate positions)
      const x = 100 + Math.random() * (canvas.width - 200)
      const y = 100 + Math.random() * (canvas.height - 200)

      // Draw different shapes based on location type
      ctx.fillStyle = location.type === "building" ? "#10b981" : location.type === "block" ? "#3b82f6" : "#f59e0b"

      ctx.beginPath()
      if (location.type === "facility") {
        ctx.arc(x, y, 10, 0, Math.PI * 2)
      } else {
        ctx.rect(x - 12, y - 12, 24, 24)
      }
      ctx.fill()

      // Draw location name
      ctx.fillStyle = "#1e293b"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(location.name, x, y + 25)
    })

    // Animate the route
    if (route.length > 0 && animationProgress > 0) {
      const totalSteps = route.length
      const progress = Math.min(animationProgress, 1)
      const completedSteps = Math.floor(progress * totalSteps)

      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 3

      // Draw completed route segments
      for (let i = 0; i < completedSteps; i++) {
        const step = route[i]
        const fromLoc = locations.find((loc) => loc.id === step.from)
        const toLoc = locations.find((loc) => loc.id === step.to)

        if (fromLoc && toLoc) {
          const fromX = 100 + Math.random() * (canvas.width - 200)
          const fromY = 100 + Math.random() * (canvas.height - 200)
          const toX = 100 + Math.random() * (canvas.width - 200)
          const toY = 100 + Math.random() * (canvas.height - 200)

          ctx.beginPath()
          ctx.moveTo(fromX, fromY)
          ctx.lineTo(toX, toY)
          ctx.stroke()

          // Draw facility if available
          if (step.facilityNearby) {
            const midX = (fromX + toX) / 2
            const midY = (fromY + toY) / 2

            ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
            ctx.beginPath()
            ctx.roundRect(midX - 40, midY - 10, 80, 20, 5)
            ctx.fill()

            ctx.fillStyle = "#1e293b"
            ctx.font = "10px Arial"
            ctx.textAlign = "center"
            ctx.fillText(step.facilityNearby, midX, midY)
          }
        }
      }
    }
  }, [showNavigation, selectedLecture, route, animationProgress, locations, connections])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      setFilteredLectures([])
      return
    }

    // Simple client-side filtering
    const searchTerm = query.toLowerCase()
    const results = lectures.filter(
      (lecture) =>
        lecture.subjectName.toLowerCase().includes(searchTerm) ||
        lecture.lectureName.toLowerCase().includes(searchTerm) ||
        lecture.roomNumber.toLowerCase().includes(searchTerm),
    )

    setFilteredLectures(results)
  }

  const handleNavigate = (lecture: Lecture) => {
    setSelectedLecture(lecture)

    // Check if we have a simple graph available
    const savedSimpleGraph = localStorage.getItem("campusSimpleGraph")
    if (savedSimpleGraph) {
      try {
        const simpleGraph = JSON.parse(savedSimpleGraph)
        const savedFacilities = localStorage.getItem("campusFacilities")
        const facilitiesData = savedFacilities ? JSON.parse(savedFacilities) : {}

        // For demo purposes, use the first location as start
        const startLocation = Object.keys(simpleGraph)[0]
        // And a random location as destination
        const destinationLocation =
          Object.keys(simpleGraph)[Math.floor(Math.random() * Object.keys(simpleGraph).length)]

        if (startLocation && destinationLocation) {
          const result = dijkstraSimpleGraph(simpleGraph, startLocation, destinationLocation)

          if (result.path.length > 1) {
            // Convert path to navigation steps
            const steps: NavigationStep[] = []
            for (let i = 0; i < result.path.length - 1; i++) {
              const from = result.path[i]
              const to = result.path[i + 1]

              steps.push({
                from,
                to,
                distance: simpleGraph[from][to],
                direction: `Go from ${from} to ${to}`,
                facilityNearby: getFacilityBetween(facilitiesData, from, to)?.location || "",
              })
            }

            setRoute(steps)

            // Get facilities along the path
            const facilities = getFacilitiesAlongPath(facilitiesData, result.path)
            setFacilitiesAlongRoute(facilities)

            setShowNavigation(true)

            // Start animation
            setAnimationProgress(0)
            const startTime = Date.now()
            const duration = 5000 // 5 seconds for full animation

            const animate = () => {
              const elapsed = Date.now() - startTime
              const progress = Math.min(elapsed / duration, 1)
              setAnimationProgress(progress)

              if (progress < 1) {
                const frame = requestAnimationFrame(animate)
                setAnimationFrame(frame)
              }
            }

            const frame = requestAnimationFrame(animate)
            setAnimationFrame(frame)

            return
          }
        }
      } catch (error) {
        console.error("Error using simple graph for navigation:", error)
        // Fall back to original method
      }
    }

    // Original method (complex graph)
    // Find the building that contains this room
    const building = locations.find(
      (loc) => (loc.type === "building" || loc.type === "block") && loc.roomNumbers?.includes(lecture.roomNumber),
    )

    if (!building) {
      alert("Building not found for this room. Please add campus locations first.")
      return
    }

    // Find a path to this building
    findRoute(building.id)
    setShowNavigation(true)

    // Start animation
    setAnimationProgress(0)
    const startTime = Date.now()
    const duration = 5000 // 5 seconds for full animation

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimationProgress(progress)

      if (progress < 1) {
        const frame = requestAnimationFrame(animate)
        setAnimationFrame(frame)
      }
    }

    const frame = requestAnimationFrame(animate)
    setAnimationFrame(frame)
  }

  // Find route between locations
  const findRoute = (destinationId: string) => {
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

    // Use first location as starting point (for demo)
    const startId = locations.length > 0 ? locations[0].id : null

    if (!startId) {
      setRoute([])
      return
    }

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

    distances[startId] = 0

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

      if (current === null || current === destinationId || minDistance === Number.POSITIVE_INFINITY) {
        break
      }

      unvisited.delete(current)

      // Update distances to neighbors
      Object.entries(graph[current] || {}).forEach(([neighbor, { distance }]) => {
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
    let current = destinationId

    if (previous[destinationId] === null && destinationId !== startId) {
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

  // Helper function to get facility between two locations
  const getFacilityBetween = (facilitiesData: any, from: string, to: string) => {
    const key1 = `${from}-${to}`
    const key2 = `${to}-${from}`

    return facilitiesData[key1] || facilitiesData[key2]
  }

  // Helper function to get all facilities along a path
  const getFacilitiesAlongPath = (facilitiesData: any, path: string[]) => {
    const facilities: Facility[] = []

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]
      const to = path[i + 1]

      const facility = getFacilityBetween(facilitiesData, from, to)
      if (facility) {
        facilities.push({
          ...facility,
          from,
          to,
        })
      }
    }

    return facilities
  }

  if (!session) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8 px-4">
        {showNavigation ? (
          <div className="mb-4">
            <Button variant="outline" onClick={() => setShowNavigation(false)} className="mb-4">
              Back to Search
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Campus Navigation</CardTitle>
                <CardDescription>
                  {selectedLecture && `Finding route to ${selectedLecture.roomNumber} (${selectedLecture.subjectName})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full border rounded-md bg-white"
                  ></canvas>
                </div>

                {route.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium">Total Distance:</span>{" "}
                        {route.reduce((total, step) => total + step.distance, 0)} units
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Estimated Time:</span>{" "}
                        {Math.ceil(route.reduce((total, step) => total + step.distance, 0) / 80)} minutes
                      </div>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
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

                    {/* Facilities along the route */}
                    {facilitiesAlongRoute.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Facilities Along Route</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Facility</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {facilitiesAlongRoute.map((facility, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{facility.location}</TableCell>
                                <TableCell>
                                  Between {facility.from} and {facility.to}
                                </TableCell>
                                <TableCell>{facility.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setShowNavigation(false)}>
                        Back to Search
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                          Previous
                        </Button>
                        <Button variant="outline" onClick={nextStep} disabled={currentStep >= route.length - 1}>
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No route found. Please make sure you have added campus locations and connections.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Find Your Way Around Campus</CardTitle>
                <CardDescription>Search for a subject, lecture or room</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for a subject, lecture or room..."
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="text-center py-8">Loading lectures...</div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>
                    {query
                      ? `${filteredLectures.length} ${filteredLectures.length === 1 ? "lecture" : "lectures"} found`
                      : "Enter a search term to find lectures"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredLectures.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Lecture Name</TableHead>
                          <TableHead>Room Number</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLectures.map((lecture) => (
                          <TableRow key={lecture._id}>
                            <TableCell className="font-medium">{lecture.subjectName}</TableCell>
                            <TableCell>{lecture.lectureName}</TableCell>
                            <TableCell>{lecture.roomNumber}</TableCell>
                            <TableCell>{lecture.floor}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleNavigate(lecture)}>
                                <Navigation className="h-4 w-4 mr-2" />
                                Navigate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">No lectures found. Try a different search term.</div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// Dijkstra's algorithm implementation for simple graph
const dijkstraSimpleGraph = (graph: any, start: string, end: string) => {
  const distances: { [key: string]: number } = {}
  const previous: { [key: string]: string | null } = {}
  const unvisited = new Set<string>()

  // Initialize
  Object.keys(graph).forEach((node) => {
    distances[node] = Number.POSITIVE_INFINITY
    previous[node] = null
    unvisited.add(node)
  })

  distances[start] = 0

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current: string | null = null
    let minDistance = Number.POSITIVE_INFINITY

    unvisited.forEach((node) => {
      if (distances[node] < minDistance) {
        minDistance = distances[node]
        current = node
      }
    })

    if (current === null || current === end || minDistance === Number.POSITIVE_INFINITY) {
      break
    }

    unvisited.delete(current)

    // Update distances to neighbors
    Object.entries(graph[current]).forEach(([neighbor, weight]) => {
      if (unvisited.has(neighbor)) {
        const alt = distances[current] + (weight as number)
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt
          previous[neighbor] = current
        }
      }
    })
  }

  // Reconstruct path
  const path: string[] = []
  let current = end

  if (previous[end] === null && end !== start) {
    return { path: [], distance: Number.POSITIVE_INFINITY }
  }

  while (current) {
    path.unshift(current)
    current = previous[current] || ""
  }

  return { path, distance: distances[end] }
}

