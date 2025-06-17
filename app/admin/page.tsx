"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import Header from "@/components/header"
import CampusMapEditor from "@/components/campus-map-editor"

export default function AdminPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!session || session.user.role !== "owner")) {
      router.push("/")
    }
  }, [session, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Portal</h1>
        <CampusMapEditor />
      </div>
    </div>
  )
}

