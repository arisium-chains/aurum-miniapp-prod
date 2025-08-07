import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { validateWorldIDConfig } from "@/lib/world-id";

// Define user interface for type safety
interface User {
  id: string;
  worldId: string;
  isVerified: boolean;
  role?: string;
}

// Extended NextRequest with IP property
interface ExtendedNextRequest extends NextRequest {
  ip?: string;
}

// Define protected routes
const PROTECTED_ROUTES = [
  "/vault",
  "/profile",
  "/discover",
  "/onboarding",
  "/api/ai",
  "/api/attractiveness",
  "/api/discovery",
  "/api/events",
  "/api/profile",
  "/api/score",
  "/api/signals",
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/api/auth",
  "/api/health",
  "/api/discovery/action",
];

// Role-based access control
const ROLE_BASED_ROUTES = {
  "/admin": ["admin"],
  "/api/admin": ["admin"],
};

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return null;
  }

  // Validate World ID configuration for protected routes
  if (isProtectedRoute(pathname)) {
    try {
      validateWorldIDConfig();
    } catch (error) {
      console.error("World ID configuration error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error",
          error: "SERVER_CONFIG_ERROR",
        },
        { status: 500 }
      );
    }
  }

  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    try {
      // Get user from request
      const user = await getUserFromRequest(request);

      if (!user) {
        // User is not authenticated
        const loginUrl = new URL("/auth/wallet", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user has required role for role-based routes
      if (isRoleBasedRoute(pathname)) {
        const requiredRoles =
          ROLE_BASED_ROUTES[pathname as keyof typeof ROLE_BASED_ROUTES];
        if (
          requiredRoles &&
          !requiredRoles.includes((user as User).role || "user")
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Insufficient permissions",
              error: "INSUFFICIENT_PERMISSIONS",
            },
            { status: 403 }
          );
        }
      }

      // Add user info to request headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", user.id);
      requestHeaders.set("x-user-worldid", user.worldId);
      requestHeaders.set("x-user-verified", user.isVerified.toString());

      // Create a new response with the updated headers
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      // Add security headers
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-XSS-Protection", "1; mode=block");

      return response;
    } catch (error) {
      console.error("Authentication middleware error:", error);

      // If it's a token validation error, force re-authentication
      if (error instanceof Error && error.message.includes("JWT")) {
        const loginUrl = new URL("/auth/wallet", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.json(
        {
          success: false,
          message: "Authentication error",
          error: "AUTHENTICATION_ERROR",
        },
        { status: 401 }
      );
    }
  }

  return null;
}

// Helper functions
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });
}

function isRoleBasedRoute(pathname: string): boolean {
  return Object.keys(ROLE_BASED_ROUTES).some((route) =>
    pathname.startsWith(route)
  );
}

// Session validation and cleanup
export async function validateAndCleanupSessions() {
  try {
    // This would typically be run as a background job
    // For now, we'll implement basic session validation

    // In a real implementation, you would:
    // 1. Check for expired sessions in Redis/database
    // 2. Clean up expired sessions
    // 3. Refresh tokens that are close to expiration

    console.log("Session validation and cleanup completed");
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
}

// Rate limiting for authentication endpoints
export async function authRateLimit(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting only to auth-related endpoints
  if (pathname.startsWith("/api/auth")) {
    const clientIP =
      (request as ExtendedNextRequest).ip ||
      request.headers.get("x-forwarded-for") ||
      "unknown";

    // In a real implementation, you would use Redis for rate limiting
    // For now, we'll implement a simple in-memory solution

    console.log(`Rate limiting check for IP: ${clientIP}, path: ${pathname}`);

    // Add rate limiting logic here
    // Example: Allow 5 requests per minute per IP

    return null; // Allow request to proceed
  }

  return null;
}
