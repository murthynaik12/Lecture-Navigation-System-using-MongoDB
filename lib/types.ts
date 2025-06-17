// Type definitions for the campus navigation system

// Basic coordinate type
export interface Coordinate {
  x: number
  y: number
}

// Building representation
export interface Building {
  id: string
  name: string
  position: Coordinate
  width: number
  height: number
  floors: number
  entrances: Entrance[]
}

// Entrance to a building
export interface Entrance {
  id: string
  buildingId: string
  position: Coordinate
  name: string
}

// Room within a building
export interface Room {
  id: string
  buildingId: string
  name: string
  number: string
  floor: number
  position: Coordinate
  type: "classroom" | "lab" | "office" | "other"
}

// Path between locations (outdoors)
export interface Path {
  id: string
  from: string // ID of location (building entrance, intersection, etc)
  to: string // ID of location
  distance: number
  type: "walkway" | "road" | "stairs"
}

// Indoor connection between rooms
export interface IndoorConnection {
  id: string
  buildingId: string
  from: string // Room ID
  to: string // Room ID
  type: "hallway" | "stairs" | "elevator"
  distance: number
}

// Intersection (node in the outdoor path network)
export interface Intersection {
  id: string
  position: Coordinate
  name?: string
}

// Location type for navigation (union of all possible locations)
export type Location = Building | Room | Entrance | Intersection

// Campus map containing all elements
export interface CampusMap {
  buildings: Building[]
  rooms: Room[]
  paths: Path[]
  entrances: Entrance[]
  intersections: Intersection[]
  indoorConnections: IndoorConnection[]
}

// Lecture information
export interface Lecture {
  _id?: string
  subjectName: string
  lectureName: string
  roomId: string
  buildingId: string
  startTime: string
  endTime: string
  dayOfWeek: string
  createdAt: Date
  updatedAt?: Date
}

// Navigation route
export interface Route {
  steps: RouteStep[]
  totalDistance: number
  estimatedTime: number // in minutes
}

// Step in a navigation route
export interface RouteStep {
  type: "outdoor" | "indoor" | "entrance" | "exit"
  from: Location
  to: Location
  distance: number
  direction: string
  floor?: number
}

// User types
export interface User {
  _id?: string
  email: string
  password: string
  name: string
  role: "student" | "owner"
  createdAt: Date
}

export interface Session {
  user: {
    _id: string
    email: string
    name: string
    role: "student" | "owner"
  }
}

