"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  _id: string
  email: string
  name: string
  role: "student" | "owner"
}

interface Session {
  user: User
}

interface AuthContextType {
  session: Session | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check for user info on initial load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await fetch("/api/auth/me")

        if (response.ok) {
          const data = await response.json()
          setSession({ user: data.user })
        }
      } catch (error) {
        console.error("Failed to check user session", error)
      } finally {
        setLoading(false)
      }
    }

    checkUserSession()
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSession({ user: data.user })
        router.push(data.user.role === "owner" ? "/" : "/search")
      } else {
        throw new Error(data.error || "Login failed")
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unknown error occurred")
      }
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      setSession(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return <AuthContext.Provider value={{ session, loading, login, logout, error }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

