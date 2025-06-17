"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function HomePage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (session?.user) {
        if (session.user.role === "owner") {
          router.push("/lectures/new")
        } else {
          router.push("/search")
        }
      } else {
        router.push("/login")
      }
    }
  }, [session, loading, router])

  // Show loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Campus Navigation System</h1>
        <p>Loading...</p>
      </div>
    </div>
  )
}

