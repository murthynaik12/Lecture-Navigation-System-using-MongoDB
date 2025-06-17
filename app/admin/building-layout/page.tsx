"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import Header from "@/components/header"
import BuildingEditor from "@/components/building-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function BuildingLayoutPage() {
  const { session } = useAuth()
  const router = useRouter()

  // Redirect if not an owner
  useEffect(() => {
    if (session && session.user.role !== "owner") {
      router.push("/search")
    }
  }, [session, router])

  if (!session) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Building Layout Editor</AlertTitle>
          <AlertDescription className="text-blue-700">
            Use this tool to create and edit the building layout for indoor navigation. Add rooms, hallways, stairs, and
            elevators, then connect them to create paths for navigation.
          </AlertDescription>
        </Alert>
        <BuildingEditor />
      </main>
    </div>
  )
}

