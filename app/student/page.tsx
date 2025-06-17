"use client"

import type React from "react"

import { useEffect, useState } from "react"
import CampusNavigator from "@/components/campus-navigator"
import Header from "@/components/header"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Navigation, Info, Search, ArrowRight, BookOpen } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Facility {
  id: string
  name: string
  description: string
  location: string
  locationId?: string
}

interface Lecture {
  _id: string
  subjectName: string
  lectureName: string
  roomNumber: string
  floor: number
  buildingId?: string
  locationId?: string
}

interface UserLocation {
  latitude: number | null
  longitude: number | null
  nearestLocation: string | null
  nearestLocationId: string | null
}

export default function StudentPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([])
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("facilities")
  const [userLocation, setUserLocation] = useState<UserLocation>({
    latitude: null,
    longitude: null,
    nearestLocation: null,
    nearestLocationId: null,
  })
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [showRoute, setShowRoute] = useState(false)
  const [mapLocations, setMapLocations] = useState<any[]>([])
  const [searchInstructions, setSearchInstructions] = useState(false)

  useEffect(() => {
    if (!loading && !session) {
      router.push("/")
    } else if (session) {
      // Load facilities data
      loadFacilities()
      // Load lectures data
      loadLectures()
      // Load map data
      loadMapData()
      // Get user's current location
      getCurrentLocation()
    }
  }, [session, loading, router])

  // Load map data to get location IDs
  const loadMapData = () => {
    try {
      const savedData = localStorage.getItem("campusMap")
      if (savedData) {
        const { locations } = JSON.parse(savedData)
        setMapLocations(locations || [])
      }
    } catch (error) {
      console.error("Error loading map data:", error)
    }
  }

  // Load lectures data
  const loadLectures = async () => {
    try {
      const response = await fetch("/api/lectures")
      if (response.ok) {
        const data = await response.json()

        // Map lectures to include locationId
        const lecturesWithLocation = data.map((lecture: any) => {
          // Find building for this room number
          const building = mapLocations.find((loc: any) => loc.roomNumbers?.includes(lecture.roomNumber))

          return {
            ...lecture,
            locationId: building?.id || "library", // Default to library if not found
          }
        })

        setLectures(lecturesWithLocation)
        setFilteredLectures([])
      } else {
        // Use mock data if API fails
        const mockLectures = [
          {
            _id: "lec1",
            subjectName: "Computer Science",
            lectureName: "Introduction to Databases",
            roomNumber: "CS101",
            floor: 1,
            locationId: "block1",
          },
          {
            _id: "lec2",
            subjectName: "Mathematics",
            lectureName: "Linear Algebra",
            roomNumber: "M201",
            floor: 2,
            locationId: "library",
          },
          {
            _id: "lec3",
            subjectName: "Physics",
            lectureName: "Mechanics",
            roomNumber: "P001",
            floor: 0,
            locationId: "block1",
          },
          {
            _id: "lec4",
            subjectName: "Chemistry",
            lectureName: "Organic Chemistry",
            roomNumber: "C002",
            floor: 0,
            locationId: "library",
          },
        ]
        setLectures(mockLectures)
        setFilteredLectures([])
      }
    } catch (error) {
      console.error("Error loading lectures:", error)
      // Use mock data if API fails
      const mockLectures = [
        {
          _id: "lec1",
          subjectName: "Computer Science",
          lectureName: "Introduction to Databases",
          roomNumber: "CS101",
          floor: 1,
          locationId: "block1",
        },
        {
          _id: "lec2",
          subjectName: "Mathematics",
          lectureName: "Linear Algebra",
          roomNumber: "M201",
          floor: 2,
          locationId: "library",
        },
        {
          _id: "lec3",
          subjectName: "Physics",
          lectureName: "Mechanics",
          roomNumber: "P001",
          floor: 0,
          locationId: "block1",
        },
        {
          _id: "lec4",
          subjectName: "Chemistry",
          lectureName: "Organic Chemistry",
          roomNumber: "C002",
          floor: 0,
          locationId: "library",
        },
      ]
      setLectures(mockLectures)
      setFilteredLectures([])
    }
  }

  const loadFacilities = () => {
    try {
      const savedData = localStorage.getItem("campusMap")
      if (savedData) {
        const { connections, locations } = JSON.parse(savedData)

        // Extract facilities from connections
        const facilitiesList: Facility[] = []
        connections.forEach((conn: any) => {
          if (conn.facilityName) {
            // Find the location names
            const fromLocation = locations.find((loc: any) => loc.id === conn.from)
            const toLocation = locations.find((loc: any) => loc.id === conn.to)

            facilitiesList.push({
              id: `facility-${conn.id}`,
              name: conn.facilityName,
              description: conn.facilityDescription || "No description available",
              location: `Between ${fromLocation?.name || "unknown"} and ${toLocation?.name || "unknown"}`,
              locationId: conn.from, // Use the "from" location as the facility's location
            })
          }
        })

        // Add building and block locations as facilities too
        locations.forEach((loc: any) => {
          if (loc.type === "building" || loc.type === "facility" || loc.type === "block") {
            facilitiesList.push({
              id: loc.id,
              name: loc.name,
              description: loc.details || `${loc.type.charAt(0).toUpperCase() + loc.type.slice(1)} on campus`,
              location: loc.type === "building" ? "Main Campus" : "Campus Area",
              locationId: loc.id,
            })
          }
        })

        setFacilities(facilitiesList)
        setFilteredFacilities(facilitiesList)
      } else {
        // Mock data if no saved data
        const mockFacilities = [
          {
            id: "library",
            name: "Library",
            description: "Main campus library with study areas",
            location: "Central Campus",
            locationId: "library",
          },
          {
            id: "cafeteria",
            name: "Cafeteria",
            description: "Food and beverages",
            location: "Near Block B",
            locationId: "cafeteria",
          },
          {
            id: "computer-lab",
            name: "Computer Lab",
            description: "Open access computers",
            location: "IT Building, 2nd Floor",
            locationId: "it-block",
          },
          {
            id: "sports-complex",
            name: "Sports Complex",
            description: "Indoor and outdoor sports facilities",
            location: "East Campus",
            locationId: "sports-complex",
          },
          {
            id: "health-center",
            name: "Health Center",
            description: "Medical services for students",
            location: "Admin Block, Ground Floor",
            locationId: "admin-block",
          },
        ]
        setFacilities(mockFacilities)
        setFilteredFacilities(mockFacilities)
      }
    } catch (error) {
      console.error("Error loading facilities:", error)
      toast({
        title: "Error",
        description: "Failed to load campus facilities",
        variant: "destructive",
      })
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      })
      return
    }

    setLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // Find nearest campus location
        const nearest = findNearestCampusLocation(latitude, longitude)

        setUserLocation({
          latitude,
          longitude,
          nearestLocation: nearest.name,
          nearestLocationId: nearest.id,
        })
        setLoadingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        toast({
          title: "Location Error",
          description: error.message || "Failed to get your current location",
          variant: "destructive",
        })
        setLoadingLocation(false)
      },
      { enableHighAccuracy: true },
    )
  }

  // Find nearest campus location based on coordinates
  const findNearestCampusLocation = (latitude: number, longitude: number) => {
    // For testing purposes, return a specific location that exists in your map
    // Replace "building1" with the actual ID of a building in your map
    const defaultLocation = {
      name: "Computer Science Building", // Use the exact name you gave your building
      id: "building1", // Use the actual ID of your building
    }

    // Try to use locations from map data if available
    if (mapLocations.length > 0) {
      // For testing, return the first building or block from the map
      const buildingLocation = mapLocations.find(
        (loc) =>
          (loc.type === "building" || loc.type === "block") && loc.roomNumbers && loc.roomNumbers.includes("CS101"),
      )

      if (buildingLocation) {
        return {
          name: buildingLocation.name,
          id: buildingLocation.id,
        }
      }

      // Fallback to first location if no matching building found
      return {
        name: mapLocations[0].name,
        id: mapLocations[0].id,
      }
    }

    return defaultLocation
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim() === "") {
      setFilteredFacilities(facilities)
      setFilteredLectures([])
    } else {
      // Filter facilities
      const filteredFacs = facilities.filter(
        (facility) =>
          facility.name.toLowerCase().includes(query.toLowerCase()) ||
          facility.description.toLowerCase().includes(query.toLowerCase()) ||
          facility.location.toLowerCase().includes(query.toLowerCase()),
      )
      setFilteredFacilities(filteredFacs)

      // Filter lectures
      const filteredLecs = lectures.filter(
        (lecture) =>
          lecture.subjectName.toLowerCase().includes(query.toLowerCase()) ||
          lecture.lectureName.toLowerCase().includes(query.toLowerCase()) ||
          lecture.roomNumber.toLowerCase().includes(query.toLowerCase()),
      )
      setFilteredLectures(filteredLecs)

      // Switch to appropriate tab if results are found
      if (filteredLecs.length > 0 && filteredFacs.length === 0) {
        setActiveTab("subjects")
      } else if (filteredFacs.length > 0 && filteredLecs.length === 0) {
        setActiveTab("facilities")
      }
    }
  }

  // Handle facility selection
  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility)
    setSelectedLecture(null)
    setShowRoute(true)

    // Scroll to the navigation component
    setTimeout(() => {
      document.getElementById("navigation-section")?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Handle lecture selection
  const handleSelectLecture = (lecture: Lecture) => {
    setSelectedLecture(lecture)
    setSelectedFacility(null)
    setShowRoute(true)

    // Scroll to the navigation component
    setTimeout(() => {
      document.getElementById("navigation-section")?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Reset route view
  const handleResetRoute = () => {
    setSelectedFacility(null)
    setSelectedLecture(null)
    setShowRoute(false)
  }

  // Toggle search instructions
  const toggleSearchInstructions = () => {
    setSearchInstructions(!searchInstructions)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Student Navigation</h1>

        {/* Current Location Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-500" />
              Your Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLocation ? (
              <div className="text-center py-2">Detecting your location...</div>
            ) : userLocation.latitude && userLocation.longitude ? (
              <div className="space-y-2">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">You are near: {userLocation.nearestLocation}</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Coordinates: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={getCurrentLocation}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Update Location
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="mb-2">Location not available</p>
                <Button size="sm" onClick={getCurrentLocation}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Get My Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Campus Search</span>
              <Button variant="outline" size="sm" onClick={toggleSearchInstructions}>
                {searchInstructions ? "Hide Instructions" : "How to Search"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchInstructions && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">How to Search</AlertTitle>
                <AlertDescription className="text-green-700">
                  <ol className="list-decimal pl-5 space-y-1 mt-2">
                    <li>Type a keyword in the search box (e.g., "library", "computer science", "CS101")</li>
                    <li>Results will appear in both "Facilities" and "Subjects" tabs</li>
                    <li>Click on a facility or subject to see its details</li>
                    <li>Click "Get Directions" to find the route from your current location</li>
                    <li>Follow the step-by-step navigation instructions to reach your destination</li>
                  </ol>
                  <div className="mt-2 font-medium">Example:</div>
                  <div className="bg-white p-2 rounded mt-1 text-sm">
                    Search for "computer" → Find "Computer Science" subject → Click "Get Directions" → Follow route from
                    your current location to the Computer Science classroom
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for facilities, subjects, or room numbers..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="facilities" className="flex-1">
                    Facilities {filteredFacilities.length > 0 && `(${filteredFacilities.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="subjects" className="flex-1">
                    Subjects {filteredLectures.length > 0 && `(${filteredLectures.length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="facilities" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredFacilities.length > 0 ? (
                      filteredFacilities.map((facility) => (
                        <div key={facility.id} className="border rounded-md p-3 bg-white">
                          <h3 className="font-medium text-lg">{facility.name}</h3>
                          <p className="text-sm text-gray-600">{facility.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {facility.location}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleSelectFacility(facility)}
                              disabled={!userLocation.nearestLocationId}
                            >
                              <Navigation className="h-4 w-4 mr-1" />
                              Get Directions
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "No facilities found matching your search"
                          : "Enter a search term to find facilities"}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="subjects" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredLectures.length > 0 ? (
                      filteredLectures.map((lecture) => (
                        <div key={lecture._id} className="border rounded-md p-3 bg-white">
                          <h3 className="font-medium text-lg">{lecture.subjectName}</h3>
                          <p className="text-sm font-medium">{lecture.lectureName}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Room {lecture.roomNumber}, Floor {lecture.floor}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleSelectLecture(lecture)}
                              disabled={!userLocation.nearestLocationId}
                            >
                              <Navigation className="h-4 w-4 mr-1" />
                              Get Directions
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "No subjects found matching your search"
                          : "Enter a search term to find subjects"}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Search for facilities, subjects, or room numbers to find your way around campus
          </CardFooter>
        </Card>

        {/* Navigation Section */}
        <div id="navigation-section">
          {showRoute && (selectedFacility || selectedLecture) && userLocation.nearestLocationId ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Route to {selectedFacility ? selectedFacility.name : selectedLecture?.subjectName}
                </h2>
                <Button variant="outline" size="sm" onClick={handleResetRoute}>
                  Back to Search
                </Button>
              </div>

              <Alert className="mb-4 bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Finding route</AlertTitle>
                <AlertDescription className="text-green-700 flex items-center">
                  From: {userLocation.nearestLocation}
                  <ArrowRight className="mx-2 h-4 w-4" />
                  To:{" "}
                  {selectedFacility
                    ? selectedFacility.name
                    : selectedLecture
                      ? `${selectedLecture.subjectName} (Room ${selectedLecture.roomNumber})`
                      : ""}
                </AlertDescription>
              </Alert>

              <CampusNavigator
                startRoomId={userLocation.nearestLocationId}
                destinationRoomId={selectedFacility ? selectedFacility.locationId : selectedLecture?.locationId}
              />
            </div>
          ) : (
            <CampusNavigator />
          )}
        </div>
      </div>
    </div>
  )
}

