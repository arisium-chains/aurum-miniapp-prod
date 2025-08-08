/**
 * Rate Limiting Middleware
 * Limits requests to API endpoints to prevent abuse
 */

import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

// Rate limit configuration
const RATE_LIMITS = {
  "/api/attractiveness/score": {
    limit: 10, // 10 requests
    window: 60, // per 60 seconds (1 minute)
  },
};

export async function rateLimitMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this path has rate limiting
  const rateLimitConfig = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS];
  if (!rateLimitConfig) {
    return null; // No rate limiting for this path
  }

  // Get IP address
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    (request as unknown as { ip?: string }).ip ||
    "unknown";

  // Create key for this IP and path
  const key = `rate_limit:${pathname}:${ip}`;

  try {
    // Increment the counter
    const count = await redis.incr(key);

    // Set expiration if this is the first request
    if (count === 1) {
      await redis.expire(key, rateLimitConfig.window);
    }

    // Check if rate limit exceeded
    if (count > rateLimitConfig.limit) {
      return NextResponse.json(
        {
          success: false,
          message: `Rate limit exceeded. Maximum ${rateLimitConfig.limit} requests per ${rateLimitConfig.window} seconds.`,
          error_type: "rate_limit_exceeded",
        },
        { status: 429 }
      );
    }

    return null; // Continue with the request
  } catch (error) {
    console.error("Rate limiting error:", error);
    // In case of Redis error, allow the request to proceed
    return null;
  }
}
