"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"

export default function LoginPage() {
  const { login, error, loading } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<"Owner" | "Student">("Owner")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitting login form:", { username, password, role })
    await login(username, password)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Blurred Background */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-md scale-105"
        style={{
          backgroundImage:
            "url('https://content3.jdmagicbox.com/comp/mangalore/d4/0824px824.x824.121018150858.v1d4/catalogue/sahyadri-college-of-engineering-and-management-adyar-mangalore-engineering-colleges-rb4yf376oa.jpg')",
        }}
      ></div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center space-y-6">
  {/* Title moved more above the login box */}
  <h1 className="-mt-6 text-4xl font-bold text-white bg-black/50 px-8 py-3 rounded-xl shadow-lg">
   Campus Navigation
  </h1>


        {/* Login Card */}
        <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-white/90">
          {/* Left Panel */}
          <div className="bg-black text-white flex flex-col justify-center items-center p-10 w-1/2">
            <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col justify-center p-10 w-1/2 space-y-6">
            {/* Role Selector */}
            <div className="flex justify-center space-x-4 mb-4">
              <Button
                type="button"
                variant={role === "Owner" ? "default" : "outline"}
                onClick={() => setRole("Owner")}
                className="w-1/2"
              >
                Owner
              </Button>
              <Button
                type="button"
                variant={role === "Student" ? "default" : "outline"}
                onClick={() => setRole("Student")}
                className="w-1/2"
              >
                Student
              </Button>
            </div>

            {/* Login Description */}
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">Login as</h2>
              <p className="text-gray-600 text-sm">
                {role === "Owner" ? "College Campus Owner Login" : "Student Login"}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    id="showPassword"
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="showPassword" className="text-sm">
                    Show Password
                  </Label>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-100 p-2 rounded border border-red-300">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <a href="#" className="text-blue-600 font-semibold hover:underline">
                Signup
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
