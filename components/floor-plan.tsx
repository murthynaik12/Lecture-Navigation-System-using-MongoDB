// Completely rewrite the floor plan component to fix the routing algorithm and animation

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navigation, ArrowRight } from "lucide-react"

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

interface FloorPlanProps {
  startRoom: string
  startFloor: number
  endRoom: string
  endFloor: number
  currentFloor: number
  onFloorChange: (floor: number) => void
  onAnimationStateChange: (isAnimating: boolean) => void
}

export default function FloorPlan({
  startRoom,
  startFloor,
  endRoom,
  endFloor,
  currentFloor,
  onFloorChange,
  onAnimationStateChange,
}: FloorPlanProps) {
  const [buildingData, setBuildingData] = useState<Record<number, FloorData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [calculatedPath, setCalculatedPath] = useState<Point[][]>([])
  const [currentPathSegment, setCurrentPathSegment] = useState<Point[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const animationProgressRef = useRef<number>(0)

  // Fetch building data
  useEffect(() => {
    const fetchBuildingData = async () => {
      try {
        // In a real app, this would be an API call to fetch the building data
        // For now, we'll use mock data
        const mockBuildingData = getMockBuildingData()
        setBuildingData(mockBuildingData)

        // Calculate path once we have the building data
        const path = calculateFullPath(mockBuildingData, startRoom, startFloor, endRoom, endFloor)
        setCalculatedPath(path)

        // Set the current path segment based on the current floor
        updateCurrentPathSegment(path, currentFloor)
      } catch (err) {
        console.error("Error fetching building data:", err)
        setError("Failed to load building data")
      } finally {
        setLoading(false)
      }
    }

    fetchBuildingData()
  }, [startRoom, startFloor, endRoom, endFloor])

  // Update current path segment when floor changes
  useEffect(() => {
    if (calculatedPath.length > 0) {
      updateCurrentPathSegment(calculatedPath, currentFloor)
    }
  }, [currentFloor, calculatedPath])

  // Function to update the current path segment based on the current floor
  const updateCurrentPathSegment = (path: Point[][], floor: number) => {
    // Find the path segment for the current floor
    const segment = path.find((segment) => segment.length > 0 && segment[0].floor === floor)

    setCurrentPathSegment(segment || [])
  }

  // Draw the floor plan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading || !buildingData[currentFloor]) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const floorData = buildingData[currentFloor]

    // Draw connections
    ctx.strokeStyle = "#d1d5db" // Gray
    ctx.lineWidth = 3

    for (const conn of floorData.connections) {
      const point1 = floorData.points.find((p) => p.id === conn.from)
      const point2 = floorData.points.find((p) => p.id === conn.to)

      if (point1 && point2) {
        ctx.beginPath()
        ctx.moveTo(point1.x, point1.y)
        ctx.lineTo(point2.x, point2.y)
        ctx.stroke()
      }
    }

    // Draw points
    for (const point of floorData.points) {
      let isStart = false
      let isEnd = false

      // Check if this point is the start or end point
      if (point.type === "room" && point.roomNumber === startRoom && point.floor === startFloor) {
        isStart = true
      }

      if (point.type === "room" && point.roomNumber === endRoom && point.floor === endFloor) {
        isEnd = true
      }

      // Special case for entrance
      if (startRoom === "entrance" && point.type === "entrance" && point.floor === startFloor) {
        isStart = true
      }

      switch (point.type) {
        case "stairs":
          // Draw stairs icon
          ctx.fillStyle = isStart || isEnd ? "#f59e0b" : "#f59e0b" // Amber
          ctx.beginPath()
          ctx.arc(point.x, point.y, isStart || isEnd ? 12 : 10, 0, Math.PI * 2)
          ctx.fill()

          // Draw stairs symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "12px Arial"
          ctx.fillText("S", point.x - 4, point.y + 4)
          break

        case "elevator":
          // Draw elevator icon
          ctx.fillStyle = isStart || isEnd ? "#3b82f6" : "#3b82f6" // Blue
          ctx.beginPath()
          ctx.arc(point.x, point.y, isStart || isEnd ? 12 : 10, 0, Math.PI * 2)
          ctx.fill()

          // Draw elevator symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "12px Arial"
          ctx.fillText("E", point.x - 4, point.y + 4)
          break

        case "room":
          // Draw room
          ctx.fillStyle = isStart ? "#3b82f6" : isEnd ? "#ef4444" : "#10b981" // Blue for start, Red for end, Green for others
          ctx.fillRect(point.x - 15, point.y - 15, 30, 30)

          // Draw room number
          ctx.fillStyle = "#ffffff"
          ctx.font = "10px Arial"
          ctx.fillText(point.roomNumber || "", point.x - 14, point.y + 4)
          break

        case "entrance":
          // Draw entrance
          ctx.fillStyle = isStart ? "#3b82f6" : "#8b5cf6" // Blue for start, Purple for others
          ctx.beginPath()
          ctx.arc(point.x, point.y, isStart ? 12 : 10, 0, Math.PI * 2)
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
    }

    // Draw the current path segment if we're not animating
    if (currentPathSegment.length > 1 && !isAnimating) {
      ctx.strokeStyle = "#ef4444" // Red
      ctx.lineWidth = 3

      ctx.beginPath()
      ctx.moveTo(currentPathSegment[0].x, currentPathSegment[0].y)

      for (let i = 1; i < currentPathSegment.length; i++) {
        ctx.lineTo(currentPathSegment[i].x, currentPathSegment[i].y)
      }

      ctx.stroke()
    }

    // Draw start and end markers
    if (currentFloor === startFloor) {
      const startPoint = floorData.points.find(
        (p) => (p.type === "room" && p.roomNumber === startRoom) || (startRoom === "entrance" && p.type === "entrance"),
      )

      if (startPoint) {
        ctx.fillStyle = "#3b82f6" // Blue
        ctx.beginPath()
        ctx.arc(startPoint.x, startPoint.y - 25, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = "bold 12px Arial"
        ctx.fillStyle = "#3b82f6"
        ctx.fillText("START", startPoint.x - 20, startPoint.y - 35)
      }
    }

    if (currentFloor === endFloor) {
      const endPoint = floorData.points.find((p) => p.type === "room" && p.roomNumber === endRoom)

      if (endPoint) {
        ctx.fillStyle = "#ef4444" // Red
        ctx.beginPath()
        ctx.arc(endPoint.x, endPoint.y - 25, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = "bold 12px Arial"
        ctx.fillStyle = "#ef4444"
        ctx.fillText("END", endPoint.x - 15, endPoint.y - 35)
      }
    }
  }, [currentFloor, buildingData, loading, startRoom, startFloor, endRoom, endFloor, currentPathSegment, isAnimating])

  // Animate the path
  const animatePath = () => {
    if (calculatedPath.length === 0) {
      setError("No path found between the selected locations")
      return
    }

    setIsAnimating(true)
    onAnimationStateChange(true)
    animationProgressRef.current = 0

    // Start with the first floor in the path
    const firstFloor = calculatedPath[0][0]?.floor
    if (firstFloor !== undefined && firstFloor !== currentFloor) {
      onFloorChange(firstFloor)
    }

    // Start animation
    cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(animationStep)
  }

  const animationStep = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      setIsAnimating(false)
      onAnimationStateChange(false)
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setIsAnimating(false)
      onAnimationStateChange(false)
      return
    }

    // Clear canvas and redraw base floor plan
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw the floor plan
    const floorData = buildingData[currentFloor]

    // Draw connections
    ctx.strokeStyle = "#d1d5db" // Gray
    ctx.lineWidth = 3

    for (const conn of floorData.connections) {
      const point1 = floorData.points.find((p) => p.id === conn.from)
      const point2 = floorData.points.find((p) => p.id === conn.to)

      if (point1 && point2) {
        ctx.beginPath()
        ctx.moveTo(point1.x, point1.y)
        ctx.lineTo(point2.x, point2.y)
        ctx.stroke()
      }
    }

    // Draw points
    for (const point of floorData.points) {
      let isStart = false
      let isEnd = false

      // Check if this point is the start or end point
      if (point.type === "room" && point.roomNumber === startRoom && point.floor === startFloor) {
        isStart = true
      }

      if (point.type === "room" && point.roomNumber === endRoom && point.floor === endFloor) {
        isEnd = true
      }

      // Special case for entrance
      if (startRoom === "entrance" && point.type === "entrance" && point.floor === startFloor) {
        isStart = true
      }

      switch (point.type) {
        case "stairs":
          // Draw stairs icon
          ctx.fillStyle = isStart || isEnd ? "#f59e0b" : "#f59e0b" // Amber
          ctx.beginPath()
          ctx.arc(point.x, point.y, isStart || isEnd ? 12 : 10, 0, Math.PI * 2)
          ctx.fill()

          // Draw stairs symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "12px Arial"
          ctx.fillText("S", point.x - 4, point.y + 4)
          break

        case "elevator":
          // Draw elevator icon
          ctx.fillStyle = isStart || isEnd ? "#3b82f6" : "#3b82f6" // Blue
          ctx.beginPath()
          ctx.arc(point.x, point.y, isStart || isEnd ? 12 : 10, 0, Math.PI * 2)
          ctx.fill()

          // Draw elevator symbol
          ctx.fillStyle = "#ffffff"
          ctx.font = "12px Arial"
          ctx.fillText("E", point.x - 4, point.y + 4)
          break

        case "room":
          // Draw room
          ctx.fillStyle = isStart ? "#3b82f6" : isEnd ? "#ef4444" : "#10b981" // Blue for start, Red for end, Green for others
          ctx.fillRect(point.x - 15, point.y - 15, 30, 30)

          // Draw room number
          ctx.fillStyle = "#ffffff"
          ctx.font = "10px Arial"
          ctx.fillText(point.roomNumber || "", point.x - 14, point.y + 4)
          break

        case "entrance":
          // Draw entrance
          ctx.fillStyle = isStart ? "#3b82f6" : "#8b5cf6" // Blue for start, Purple for others
          ctx.beginPath()
          ctx.arc(point.x, point.y, isStart ? 12 : 10, 0, Math.PI * 2)
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
    }

    // Find the current path segment for this floor
    const pathSegment = calculatedPath.find((segment) => segment.length > 0 && segment[0].floor === currentFloor) || []

    if (pathSegment.length > 1) {
      // Calculate how much of the path to draw based on animation progress
      const progress = Math.min(1, animationProgressRef.current)
      const totalLength = pathSegment.length - 1
      const segmentsToDraw = Math.floor(totalLength * progress)

      // Draw the animated path
      ctx.strokeStyle = "#ef4444" // Red
      ctx.lineWidth = 3

      ctx.beginPath()
      ctx.moveTo(pathSegment[0].x, pathSegment[0].y)

      for (let i = 1; i <= segmentsToDraw; i++) {
        ctx.lineTo(pathSegment[i].x, pathSegment[i].y)
      }

      // If we're not at the end of the segment, draw a partial line to the next point
      if (segmentsToDraw < totalLength) {
        const partialProgress = (progress * totalLength) % 1
        const currentPoint = pathSegment[segmentsToDraw]
        const nextPoint = pathSegment[segmentsToDraw + 1]

        const partialX = currentPoint.x + (nextPoint.x - currentPoint.x) * partialProgress
        const partialY = currentPoint.y + (nextPoint.y - currentPoint.y) * partialProgress

        ctx.lineTo(partialX, partialY)
      }

      ctx.stroke()

      // Draw a moving dot at the current position
      if (segmentsToDraw < totalLength) {
        const partialProgress = (progress * totalLength) % 1
        const currentPoint = pathSegment[segmentsToDraw]
        const nextPoint = pathSegment[segmentsToDraw + 1]

        const dotX = currentPoint.x + (nextPoint.x - currentPoint.x) * partialProgress
        const dotY = currentPoint.y + (nextPoint.y - currentPoint.y) * partialProgress

        ctx.fillStyle = "#ef4444"
        ctx.beginPath()
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw start and end markers
    if (currentFloor === startFloor) {
      const startPoint = floorData.points.find(
        (p) => (p.type === "room" && p.roomNumber === startRoom) || (startRoom === "entrance" && p.type === "entrance"),
      )

      if (startPoint) {
        ctx.fillStyle = "#3b82f6" // Blue
        ctx.beginPath()
        ctx.arc(startPoint.x, startPoint.y - 25, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = "bold 12px Arial"
        ctx.fillStyle = "#3b82f6"
        ctx.fillText("START", startPoint.x - 20, startPoint.y - 35)
      }
    }

    if (currentFloor === endFloor) {
      const endPoint = floorData.points.find((p) => p.type === "room" && p.roomNumber === endRoom)

      if (endPoint) {
        ctx.fillStyle = "#ef4444" // Red
        ctx.beginPath()
        ctx.arc(endPoint.x, endPoint.y - 25, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = "bold 12px Arial"
        ctx.fillStyle = "#ef4444"
        ctx.fillText("END", endPoint.x - 15, endPoint.y - 35)
      }
    }

    // Increment animation progress
    animationProgressRef.current += 0.01

    // Check if we need to change floors
    if (animationProgressRef.current >= 1) {
      // Find the current path segment index
      const currentSegmentIndex = calculatedPath.findIndex(
        (segment) => segment.length > 0 && segment[0].floor === currentFloor,
      )

      // If there's another segment, move to the next floor
      if (currentSegmentIndex < calculatedPath.length - 1) {
        const nextFloor = calculatedPath[currentSegmentIndex + 1][0].floor
        onFloorChange(nextFloor)
        animationProgressRef.current = 0

        // Add a small delay before continuing animation
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(animationStep)
        }, 1000)
        return
      } else {
        // Animation complete
        setIsAnimating(false)
        onAnimationStateChange(false)
        return
      }
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(animationStep)
  }

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Calculate full path between start and end points
  const calculateFullPath = (
    buildingData: Record<number, FloorData>,
    startRoom: string,
    startFloor: number,
    endRoom: string,
    endFloor: number,
  ): Point[][] => {
    const paths: Point[][] = []

    // Find start and end points
    const startPoint = findPointByRoom(buildingData, startRoom, startFloor)
    const endPoint = findPointByRoom(buildingData, endRoom, endFloor)

    if (!startPoint || !endPoint) {
      console.error("Start or end point not found")
      return []
    }

    // If on the same floor, calculate direct path
    if (startFloor === endFloor) {
      const path = findShortestPath(buildingData[startFloor], startPoint, endPoint)
      if (path.length > 0) {
        paths.push(path)
      }
      return paths
    }

    // Multi-floor path
    // First find path to stairs/elevator on starting floor
    const startFloorData = buildingData[startFloor]
    if (!startFloorData) return []

    const transitPoints = startFloorData.points.filter((p) => p.type === "stairs" || p.type === "elevator")

    if (transitPoints.length === 0) return []

    // Find the best transit point (closest to start)
    let bestTransitPoint: Point | null = null
    let shortestPath: Point[] = []

    for (const transitPoint of transitPoints) {
      const path = findShortestPath(startFloorData, startPoint, transitPoint)
      if (path.length > 0 && (shortestPath.length === 0 || path.length < shortestPath.length)) {
        shortestPath = path
        bestTransitPoint = transitPoint
      }
    }

    if (!bestTransitPoint || shortestPath.length === 0) return []

    // Add path to transit point
    paths.push(shortestPath)

    // If there are intermediate floors, add paths for those
    if (Math.abs(startFloor - endFloor) > 1) {
      const direction = startFloor < endFloor ? 1 : -1
      let currentFloor = startFloor

      while (currentFloor !== endFloor - direction) {
        currentFloor += direction

        // Find corresponding transit points on this floor
        const floorData = buildingData[currentFloor]
        if (!floorData) continue

        const fromTransitPoint = floorData.points.find(
          (p) => p.type === bestTransitPoint!.type && p.label === bestTransitPoint!.label,
        )

        const toTransitPoint = floorData.points.find(
          (p) => p.type === bestTransitPoint!.type && p.label === bestTransitPoint!.label,
        )

        if (fromTransitPoint && toTransitPoint) {
          // Just add a simple path between the same transit point on this floor
          paths.push([fromTransitPoint, toTransitPoint])
        }
      }
    }

    // Find corresponding transit point on destination floor
    const endFloorData = buildingData[endFloor]
    if (!endFloorData) return paths

    const correspondingTransitPoint = endFloorData.points.find(
      (p) => p.type === bestTransitPoint!.type && p.label === bestTransitPoint!.label,
    )

    if (!correspondingTransitPoint) return paths

    // Find path from transit point to destination
    const pathToDestination = findShortestPath(endFloorData, correspondingTransitPoint, endPoint)
    if (pathToDestination.length > 0) {
      paths.push(pathToDestination)
    }

    return paths
  }

  // Find a point by room number or entrance
  const findPointByRoom = (
    buildingData: Record<number, FloorData>,
    roomNumber: string,
    floor: number,
  ): Point | null => {
    const floorData = buildingData[floor]
    if (!floorData) return null

    if (roomNumber === "entrance") {
      return floorData.points.find((p) => p.type === "entrance") || null
    }

    return floorData.points.find((p) => p.type === "room" && p.roomNumber === roomNumber) || null
  }

  // Dijkstra's algorithm implementation
  const findShortestPath = (floorData: FloorData, start: Point, end: Point): Point[] => {
    // Create graph representation
    const graph: Record<string, Record<string, number>> = {}

    // Initialize graph
    for (const point of floorData.points) {
      graph[point.id] = {}
    }

    // Add connections
    for (const conn of floorData.connections) {
      graph[conn.from][conn.to] = conn.weight
      graph[conn.to][conn.from] = conn.weight // Assuming bidirectional connections
    }

    // Dijkstra's algorithm
    const distances: Record<string, number> = {}
    const previous: Record<string, string | null> = {}
    const unvisited = new Set<string>()

    // Initialize
    for (const point of floorData.points) {
      distances[point.id] = Number.POSITIVE_INFINITY
      previous[point.id] = null
      unvisited.add(point.id)
    }
    distances[start.id] = 0

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let minDistance = Number.POSITIVE_INFINITY
      let current: string | null = null

      for (const id of unvisited) {
        if (distances[id] < minDistance) {
          minDistance = distances[id]
          current = id
        }
      }

      if (current === null || current === end.id) break

      unvisited.delete(current)

      // Update distances to neighbors
      for (const neighbor in graph[current]) {
        if (unvisited.has(neighbor)) {
          const alt = distances[current] + graph[current][neighbor]
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt
            previous[neighbor] = current
          }
        }
      }
    }

    // Reconstruct path
    const path: Point[] = []
    let current: string | null = end.id

    if (previous[end.id] === null && end.id !== start.id) {
      // No path found
      return []
    }

    while (current !== null) {
      const point = floorData.points.find((p) => p.id === current)
      if (point) path.unshift(point)
      current = previous[current]
    }

    return path
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
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">Loading building data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative border rounded-md overflow-hidden bg-gray-50">
          <canvas ref={canvasRef} width={500} height={300} className="w-full" />

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
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
              <span>Entrance</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            onClick={animatePath}
            disabled={isAnimating || calculatedPath.length === 0}
            className="flex items-center"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isAnimating ? "Navigating..." : "Show Route"}
          </Button>

          {calculatedPath.length > 0 &&
            currentPathSegment.length === 0 &&
            currentFloor !== startFloor &&
            currentFloor !== endFloor && (
              <div className="ml-4 text-sm text-amber-600 flex items-center">
                <ArrowRight className="h-4 w-4 mr-1" />
                No path on this floor. Try floor {startFloor} or {endFloor}.
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}

