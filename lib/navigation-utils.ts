import type { Location, Connection, NavigationResult } from "./models"

// Dijkstra's algorithm implementation for finding the shortest path
export function findShortestPath(
  locations: Location[],
  connections: Connection[],
  startId: string,
  endId: string,
): NavigationResult | null {
  // Create a graph representation
  const graph: Record<string, Record<string, { distance: number; connection: Connection }>> = {}

  // Initialize graph
  locations.forEach((location) => {
    graph[location.id] = {}
  })

  // Add connections to the graph
  connections.forEach((connection) => {
    graph[connection.from][connection.to] = {
      distance: connection.distance,
      connection,
    }

    // If bidirectional, add the reverse connection
    if (connection.bidirectional) {
      graph[connection.to][connection.from] = {
        distance: connection.distance,
        connection,
      }
    }
  })

  // Check if start and end locations exist
  if (!graph[startId] || !graph[endId]) {
    return null
  }

  // Initialize distances and previous nodes
  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set<string>()

  // Set all initial distances to infinity
  locations.forEach((location) => {
    distances[location.id] = Number.POSITIVE_INFINITY
    previous[location.id] = null
    unvisited.add(location.id)
  })

  // Distance from start to start is 0
  distances[startId] = 0

  // Main Dijkstra algorithm loop
  while (unvisited.size > 0) {
    // Find the unvisited node with the smallest distance
    let current: string | null = null
    let smallestDistance = Number.POSITIVE_INFINITY

    unvisited.forEach((id) => {
      if (distances[id] < smallestDistance) {
        smallestDistance = distances[id]
        current = id
      }
    })

    // If we found the end or there's no path
    if (current === null || current === endId || smallestDistance === Number.POSITIVE_INFINITY) {
      break
    }

    // Remove current from unvisited
    unvisited.delete(current)

    // Check all neighbors of current
    Object.entries(graph[current]).forEach(([neighbor, { distance, connection }]) => {
      if (unvisited.has(neighbor)) {
        const tentativeDistance = distances[current] + distance

        if (tentativeDistance < distances[neighbor]) {
          distances[neighbor] = tentativeDistance
          previous[neighbor] = current
        }
      }
    })
  }

  // If end is not reachable
  if (distances[endId] === Number.POSITIVE_INFINITY) {
    return null
  }

  // Reconstruct the path
  const path: Location[] = []
  const pathConnections: Connection[] = []
  const directions: string[] = []
  let current = endId

  while (current !== null) {
    const location = locations.find((loc) => loc.id === current)
    if (location) {
      path.unshift(location)
    }

    if (previous[current] !== null) {
      const from = previous[current]!
      const connection = connections.find(
        (conn) =>
          (conn.from === from && conn.to === current) ||
          (conn.bidirectional && conn.from === current && conn.to === from),
      )

      if (connection) {
        pathConnections.unshift(connection)

        // Generate direction
        const fromLocation = locations.find((loc) => loc.id === from)
        const toLocation = locations.find((loc) => loc.id === current)

        if (fromLocation && toLocation) {
          let direction = `Go from ${fromLocation.name} to ${toLocation.name}`

          if (connection.type === "stairs") {
            direction += " using stairs"
          } else if (connection.type === "elevator") {
            direction += " using elevator"
          }

          direction += ` (${connection.distance} meters)`
          directions.unshift(direction)
        }
      }
    }

    current = previous[current]
  }

  // Calculate estimated time (assuming 1.2 meters per second walking speed)
  const totalDistance = distances[endId]
  const estimatedTime = Math.ceil(totalDistance / 72) // 1.2 m/s = 72 m/min

  return {
    path,
    connections: pathConnections,
    totalDistance,
    estimatedTime,
    directions,
  }
}

// Function to get all possible starting locations
export function getStartingLocations(locations: Location[]): Location[] {
  return locations.filter(
    (location) => location.type === "building" || location.type === "block" || location.type === "facility",
  )
}

// Function to get all possible destination locations
export function getDestinationLocations(locations: Location[]): Location[] {
  return locations.filter(
    (location) =>
      (location.type === "building" || location.type === "facility") &&
      location.roomNumbers &&
      location.roomNumbers.length > 0,
  )
}

// Function to find a location by room number
export function findLocationByRoom(locations: Location[], roomNumber: string): Location | undefined {
  return locations.find((location) => location.roomNumbers?.includes(roomNumber))
}

