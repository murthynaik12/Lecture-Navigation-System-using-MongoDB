import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths that don't need authentication
  if (
    path === "/" ||
    path === "/login" ||
    path === "/register" ||
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path.includes("favicon.ico")
  ) {
    return NextResponse.next()
  }

  // Check for user_info cookie
  const userInfo = request.cookies.get("user_info")?.value

  if (!userInfo) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const user = JSON.parse(userInfo)

    // Owner-only paths
    if (
      (path.startsWith("/lectures/new") || path.startsWith("/lectures/edit") || path.startsWith("/admin")) &&
      user.role !== "owner"
    ) {
      return NextResponse.redirect(new URL("/search", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Invalid user info
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

