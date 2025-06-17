"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Map, Search, Plus, Settings } from "lucide-react"

export default function Header() {
  const { session, logout } = useAuth()
  const isAuthenticated = !!session?.user
  const isOwner = session?.user?.role === "owner"

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold flex items-center">
            <Map className="h-5 w-5 mr-2" />
            Campus Navigation
          </Link>

          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-2 mr-4">
                <Link href="/search">
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <Search className="h-4 w-4 mr-1" /> Search
                  </Button>
                </Link>

                {isOwner && (
                  <>
                    <Link href="/lectures/new">
                      <Button variant="ghost" size="sm" className="flex items-center">
                        <Plus className="h-4 w-4 mr-1" /> Add Lecture
                      </Button>
                    </Link>
                    <Link href="/admin/map-editor">
                      <Button variant="ghost" size="sm" className="flex items-center">
                        <Settings className="h-4 w-4 mr-1" /> Map Editor
                      </Button>
                    </Link>
                    <Link href="/admin/simple-graph">
                      <Button variant="ghost" size="sm" className="flex items-center">
                        <Map className="h-4 w-4 mr-1" /> Simple Graph
                      </Button>
                    </Link>
                  </>
                )}
              </nav>

              <div className="text-sm">
                Welcome, <span className="font-medium">{session.user.name}</span> ({isOwner ? "Admin" : "Student"})
              </div>
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

