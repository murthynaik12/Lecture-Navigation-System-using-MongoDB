"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Plus, Save, Trash2 } from "lucide-react"

interface Location {
  id: string
  name: string
  type: "building" | "block" | "facility" | "intersection"
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

export default function SimpleGraphInput() {
  const [locations, setLocations] = useState<Location[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeTab, setActiveTab] = useState("locations")

  // Form states for adding a location
  const [locationType, setLocationType] = useState<"building" | "block" | "facility" | "intersection">("building")
  const [locationName, setLocationName] = useState("")
  const [roomNumbers, setRoomNumbers] = useState("")
  const [floors, setFloors] = useState("")

  // Form states for adding a connection
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [distance, setDistance] = useState("")
  const [facilityNearby, setFacilityNearby] = useState("")

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
    }
  }, [])

  // Add a new location
  const addLocation = () => {
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
      const roomNumbersArray = roomNumbers
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r)

      // Parse floors from comma-separated string
      const floorsArray = floors
        .split(",")
        .map((f) => Number.parseInt(f.trim()))
        .filter((f) => !isNaN(f))

      newLocation.roomNumbers = roomNumbersArray
      newLocation.floors = floorsArray
    }

    setLocations([...locations, newLocation])

    // Reset form
    setLocationName("")
    setRoomNumbers("")
    setFloors("")

    toast({
      title: "Success",
      description: "Location added successfully",
    })
  }

  // Add a new connection
  const addConnection = () => {
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

  // Delete a location
  const deleteLocation = (id: string) => {
    // Delete the location
    setLocations(locations.filter((loc) => loc.id !== id))

    // Delete any connections involving this location
    setConnections(connections.filter((conn) => conn.from !== id && conn.to !== id))

    toast({
      title: "Success",
      description: "Location deleted successfully",
    })
  }

  // Delete a connection
  const deleteConnection = (id: string) => {
    setConnections(connections.filter((conn) => conn.id !== id))

    toast({
      title: "Success",
      description: "Connection deleted successfully",
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
          <span>Campus Map Editor</span>
          <Button onClick={saveMap} className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Map
          </Button>
        </CardTitle>
        <CardDescription>Add locations and connections to create your campus map</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="locations" className="flex-1">
              Locations
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex-1">
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            <div className="grid gap-6">
              <div className="grid gap-4 p-4 border rounded-md">
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
                        <SelectItem value="intersection">Intersection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input
                      id="location-name"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Main Building"
                    />
                  </div>

                  {(locationType === "building" || locationType === "block") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="room-numbers">Room Numbers (comma-separated)</Label>
                        <Input
                          id="room-numbers"
                          value={roomNumbers}
                          onChange={(e) => setRoomNumbers(e.target.value)}
                          placeholder="e.g. 101, 102, 103"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="floors">Floors (comma-separated)</Label>
                        <Input
                          id="floors"
                          value={floors}
                          onChange={(e) => setFloors(e.target.value)}
                          placeholder="e.g. 1, 2, 3"
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={addLocation} className="w-full mt-2">
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
                            <Button variant="outline" size="sm" onClick={() => deleteLocation(location.id)}>
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
            </div>
          </TabsContent>

          <TabsContent value="connections">
            <div className="grid gap-6">
              <div className="grid gap-4 p-4 border rounded-md">
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
                    <Label htmlFor="facility-nearby">Nearby Facility (optional)</Label>
                    <Input
                      id="facility-nearby"
                      value={facilityNearby}
                      onChange={(e) => setFacilityNearby(e.target.value)}
                      placeholder="e.g. ATM, Cafeteria"
                    />
                  </div>
                </div>

                <Button onClick={addConnection} className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
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
                              <Button variant="outline" size="sm" onClick={() => deleteConnection(connection.id)}>
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

