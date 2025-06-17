// Types for our campus navigation system

export interface Location {
  id: string
  name: string
  type: "building" | "block" | "facility" | "intersection"
  position?: { x: number; y: number }
  roomNumbers?: string[]
  floors?: number[]
  details?: string
}

export interface Connection {
  id: string
  from: string // Location ID
  to: string // Location ID
  distance: number // Distance in meters or arbitrary units
  type: "path" | "corridor" | "stairs" | "elevator"
  bidirectional: boolean // Whether the connection can be traversed in both directions
  facilityName?: string // Name of a facility located along this connection
  facilityDescription?: string // Detailed description of the facility
}

export interface CampusMap {
  locations: Location[]
  connections: Connection[]
}

export interface Lecture {
  _id?: string
  subjectName: string
  lectureName: string
  roomNumber: string
  buildingId?: string
  floor: number
}

export interface NavigationResult {
  path: Location[]
  connections: Connection[]
  totalDistance: number
  estimatedTime: number // in minutes
  directions: string[]
  facilities: Facility[]
}

export interface Facility {
  name: string
  description: string
  location: string // Description of where the facility is located
  connectionId: string // ID of the connection where this facility is located
}

export interface RouteStep {
  from: Location
  to: Location
  connection: Connection
  direction: string
}

export interface IndoorNavigationProps {
  roomNumber: string
  floor: number
  startRoom: string
  startFloor: number
  onClose: () => void
}

