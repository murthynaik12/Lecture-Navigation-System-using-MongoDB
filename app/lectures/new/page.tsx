"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Header from "@/components/header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, Plus, Save, Trash2, MapPin } from "lucide-react"

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
  type: "building" | "block" | "facility"
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

export default function NewLecture() {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState("lectures")

  // Lecture form states
  const [subjectName, setSubjectName] = useState("")
  const [lectureName, setLectureName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [floor, setFloor] = useState("")
  const [loading, setLoading] = useState(false)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [fetchingLectures, setFetchingLectures] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Campus map states
  const [locations, setLocations] = useState<Location[]>([])
  const [connections, setConnections] = useState<Connection[]>([])

  // Location form states
  const [locationName, setLocationName] = useState("")
  const [locationType, setLocationType] = useState<"building" | "block" | "facility">("building")
  const [locationRooms, setLocationRooms] = useState("")
  const [locationFloors, setLocationFloors] = useState("")

  // Connection form states
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [distance, setDistance] = useState("")
  const [facilityNearby, setFacilityNearby] = useState("")

  // Load lectures and map data
  useEffect(() => {
    async function fetchData() {
      try {
        setFetchingLectures(true)

        // Fetch lectures
        const response = await fetch("/api/lectures")
        const data = await response.json()

        if (response.ok) {
          setLectures(Array.isArray(data) ? data : [])

          // Check if we're in demo mode (mock data)
          if (data.length > 0 && data[0]._id?.startsWith("mock")) {
            setIsDemoMode(true)
          }
        } else {
          // Handle API error response
          throw new Error(data.error || "Failed to fetch lectures")
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
        setError(error instanceof Error ? error.message : "Failed to load data. Please try again later.")
        setIsDemoMode(true) // Assume demo mode if there's an error
      } finally {
        setFetchingLectures(false)
      }
    }

    fetchData()
  }, [])

  // Handle lecture submission
  const handleSubmitLecture = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate input
      if (!subjectName || !lectureName || !roomNumber || !floor) {
        throw new Error("All fields are required")
      }

      const lectureData = {
        subjectName,
        lectureName,
        roomNumber,
        floor: Number.parseInt(floor, 10) || 0,
      }

      console.log("Submitting lecture data:", lectureData)

      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lectureData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lecture created successfully",
        })

        // Add the new lecture to the list
        if (data.lecture) {
          setLectures([...lectures, data.lecture])

          // Check if we're in demo mode
          if (data.lecture._id?.startsWith("mock")) {
            setIsDemoMode(true)
          }
        }

        // Reset form
        setSubjectName("")
        setLectureName("")
        setRoomNumber("")
        setFloor("")
      } else {
        throw new Error(data.error || "Failed to create lecture")
      }
    } catch (error) {
      console.error("Error creating lecture:", error)
      setError(error instanceof Error ? error.message : "Failed to create lecture")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lecture",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete a lecture
  const handleDeleteLecture = async (id: string) => {
    if (confirm("Are you sure you want to delete this lecture?")) {
      try {
        // For demo mode, just remove from local state
        if (isDemoMode) {
          setLectures(lectures.filter((lecture) => lecture._id !== id))
          toast({
            title: "Success",
            description: "Lecture deleted successfully (Demo Mode)",
          })
          return
        }

        const response = await fetch(`/api/lectures/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setLectures(lectures.filter((lecture) => lecture._id !== id))
          toast({
            title: "Success",
            description: "Lecture deleted successfully",
          })
        } else {
          const data = await response.json()
          throw new Error(data.error || "Failed to delete lecture")
        }
      } catch (error) {
        console.error("Error deleting lecture:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete lecture",
          variant: "destructive",
        })
      }
    }
  }

  // Add a new location
  const handleAddLocation = () => {
    if (!locationName) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      })
      return
    }

    const newLocation: Location = {
      id: `${locationType}-${Date.now()}`,
      name: locationName,
      type: locationType,
    }

    if (locationType === "building" || locationType === "block") {
      // Parse room numbers from comma-separated string
      const roomNumbersArray = locationRooms
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r)

      // Parse floors from comma-separated string
      const floorsArray = locationFloors
        .split(",")
        .map((f) => Number.parseInt(f.trim()))
        .filter((f) => !isNaN(f))

      newLocation.roomNumbers = roomNumbersArray
      newLocation.floors = floorsArray
    }

    setLocations([...locations, newLocation])

    // Reset form
    setLocationName("")
    setLocationRooms("")
    setLocationFloors("")

    toast({
      title: "Success",
      description: "Location added successfully",
    })
  }

  // Delete a location
  const handleDeleteLocation = (id: string) => {
    // Delete the location
    setLocations(locations.filter((loc) => loc.id !== id))

    // Delete any connections involving this location
    setConnections(connections.filter((conn) => conn.from !== id && conn.to !== id))

    toast({
      title: "Success",
      description: "Location deleted successfully",
    })
  }

  // Add a new connection
  const handleAddConnection = () => {
    if (!fromLocation || !toLocation || !distance) {
      toast({
        title: "Error",
        description: "From location, to location, and distance are required",
        variant: "destructive",
      })
      return
    }

    if (fromLocation === toLocation) {
      toast({
        title: "Error",
        description: "From and To locations cannot be the same",
        variant: "destructive",
      })
      return
    }

    const distanceValue = Number.parseInt(distance)
    if (isNaN(distanceValue) || distanceValue <= 0) {
      toast({
        title: "Error",
        description: "Distance must be a positive number",
        variant: "destructive",
      })
      return
    }

    // Check if connection already exists
    const connectionExists = connections.some(
      (conn) =>
        (conn.from === fromLocation && conn.to === toLocation) ||
        (conn.from === toLocation && conn.to === fromLocation),
    )

    if (connectionExists) {
      toast({
        title: "Error",
        description: "This connection already exists",
        variant: "destructive",
      })
      return
    }

    const newConnection: Connection = {
      id: `connection-${Date.now()}`,
      from: fromLocation,
      to: toLocation,
      distance: distanceValue,
    }

    if (facilityNearby) {
      newConnection.facilityNearby = facilityNearby
    }

    setConnections([...connections, newConnection])

    // Reset form
    setFromLocation("")
    setToLocation("")
    setDistance("")
    setFacilityNearby("")

    toast({
      title: "Success",
      description: "Connection added successfully",
    })
  }

  // Delete a connection
  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter((conn) => conn.id !== id))

    toast({
      title: "Success",
      description: "Connection deleted successfully",
    })
  }

  // Save map data
  const handleSaveMap = () => {
    try {
      localStorage.setItem("campusMap", JSON.stringify({ locations, connections }))
      toast({
        title: "Success",
        description: "Campus map saved successfully",
      })
    } catch (error) {
      console.error("Error saving map:", error)
      toast({
        title: "Error",
        description: "Failed to save campus map",
        variant: "destructive",
      })
    }
  }

  if (!session) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto py-8 px-4">
        {isDemoMode && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Demo Mode Active</AlertTitle>
            <AlertDescription className="text-blue-700">
              MongoDB connection is not available. The application is running in demo mode with mock data.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full">
            <TabsTrigger value="lectures" className="flex-1">
              Lectures
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex-1">
              Campus Locations
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex-1">
              Connections
            </TabsTrigger>
          </TabsList>

          {/* Lectures Tab */}
          <TabsContent value="lectures">
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Lecture</CardTitle>
                  <CardDescription>Enter the details for the new lecture</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitLecture}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subjectName">Subject Name</Label>
                      <Input
                        id="subjectName"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lectureName">Lecture Name</Label>
                      <Input
                        id="lectureName"
                        value={lectureName}
                        onChange={(e) => setLectureName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Room Number</Label>
                      <Input
                        id="roomNumber"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floor">Floor</Label>
                      <Input
                        id="floor"
                        type="number"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        required
                      />
                    </div>
                    {error && !isDemoMode && (
                      <div className="text-sm font-medium text-red-500 p-2 bg-red-50 rounded border border-red-200">
                        {error}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Saving..." : "Add Lecture"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Lectures</CardTitle>
                  <CardDescription>Manage your campus lectures</CardDescription>
                </CardHeader>
                <CardContent>
                  {fetchingLectures ? (
                    <div className="text-center py-4">Loading lectures...</div>
                  ) : error && !isDemoMode ? (
                    <div className="text-center py-4 text-red-500">{error}</div>
                  ) : lectures.length === 0 ? (
                    <div className="text-center py-4">No lectures added yet</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lectures.map((lecture) => (
                          <TableRow key={lecture._id}>
                            <TableCell className="font-medium">{lecture.subjectName}</TableCell>
                            <TableCell>{lecture.roomNumber}</TableCell>
                            <TableCell>{lecture.floor}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleDeleteLecture(lecture._id)}>
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campus Locations Tab */}
          <TabsContent value="locations">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Campus Locations</span>
                    <Button onClick={handleSaveMap} className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Map
                    </Button>
                  </CardTitle>
                  <CardDescription>Add buildings, blocks, and facilities to your campus map</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 p-4 border rounded-md mb-6">
                    <h3 className="text-lg font-medium">Add New Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location-type">Location Type</Label>
                        <Select value={locationType} onValueChange={(value: any) => setLocationType(value)}>
                          <SelectTrigger id="location-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="building">Building</SelectItem>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="facility">Facility</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location-name">Location Name</Label>
                        <Input
                          id="location-name"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder="e.g. Main Building, Library"
                        />
                      </div>

                      {(locationType === "building" || locationType === "block") && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="room-numbers">Room Numbers (comma-separated)</Label>
                            <Input
                              id="room-numbers"
                              value={locationRooms}
                              onChange={(e) => setLocationRooms(e.target.value)}
                              placeholder="e.g. 101, 102, 103"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="floors">Floors (comma-separated)</Label>
                            <Input
                              id="floors"
                              value={locationFloors}
                              onChange={(e) => setLocationFloors(e.target.value)}
                              placeholder="e.g. 0, 1, 2"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <Button onClick={handleAddLocation} className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Existing Locations</h3>
                    {locations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Rooms</TableHead>
                            <TableHead>Floors</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {locations.map((location) => (
                            <TableRow key={location.id}>
                              <TableCell className="font-medium">{location.name}</TableCell>
                              <TableCell className="capitalize">{location.type}</TableCell>
                              <TableCell>{location.roomNumbers?.join(", ") || "-"}</TableCell>
                              <TableCell>{location.floors?.join(", ") || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleDeleteLocation(location.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No locations added yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Campus Connections</span>
                  <Button onClick={handleSaveMap} className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Map
                  </Button>
                </CardTitle>
                <CardDescription>Connect locations and add nearby facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 p-4 border rounded-md mb-6">
                  <h3 className="text-lg font-medium">Add New Connection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-location">From Location</Label>
                      <Select value={fromLocation} onValueChange={setFromLocation}>
                        <SelectTrigger id="from-location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="to-location">To Location</Label>
                      <Select value={toLocation} onValueChange={setToLocation}>
                        <SelectTrigger id="to-location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance (meters)</Label>
                      <Input
                        id="distance"
                        type="number"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder="e.g. 100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facility-nearby">Nearby Facility</Label>
                      <Input
                        id="facility-nearby"
                        value={facilityNearby}
                        onChange={(e) => setFacilityNearby(e.target.value)}
                        placeholder="e.g. ATM, Cafeteria, Library"
                      />
                    </div>
                  </div>

                  <Button onClick={handleAddConnection} className="w-full mt-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Existing Connections</h3>
                  {connections.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Nearby Facility</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connections.map((connection) => {
                          const fromLoc = locations.find((loc) => loc.id === connection.from)
                          const toLoc = locations.find((loc) => loc.id === connection.to)

                          return (
                            <TableRow key={connection.id}>
                              <TableCell className="font-medium">{fromLoc?.name || "Unknown"}</TableCell>
                              <TableCell>{toLoc?.name || "Unknown"}</TableCell>
                              <TableCell>{connection.distance} meters</TableCell>
                              <TableCell>{connection.facilityNearby || "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteConnection(connection.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No connections added yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

