"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowLeft, MapPin } from "lucide-react"
import FloorPlan from "./floor-plan"

interface IndoorNavigationProps {
  roomNumber: string
  floor: number
  startRoom: string
  startFloor: number
  onClose: () => void
}

export default function IndoorNavigation({ roomNumber, floor, startRoom, startFloor, onClose }: IndoorNavigationProps) {
  const [currentFloor, setCurrentFloor] = useState(startFloor)
  const [isAnimating, setIsAnimating] = useState(false)

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          Indoor Navigation
        </CardTitle>
        <CardDescription>
          From {startRoom} (Floor {startFloor}) to {roomNumber} (Floor {floor})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm font-medium">Current Floor: {currentFloor}</span>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((f) => (
              <Button
                key={f}
                variant={currentFloor === f ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentFloor(f)}
                disabled={isAnimating}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <FloorPlan
          startRoom={startRoom}
          startFloor={startFloor}
          endRoom={roomNumber}
          endFloor={floor}
          currentFloor={currentFloor}
          onFloorChange={setCurrentFloor}
          onAnimationStateChange={setIsAnimating}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">Use the floor buttons above to view different floors</div>
      </CardFooter>
    </Card>
  )
}

