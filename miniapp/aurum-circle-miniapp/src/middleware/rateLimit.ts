/**
 * Rate Limiting Middleware
 * Limits requests to API endpoints to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { RedisCache } from '@/lib/redis-cache';

// Rate limit configuration
const RATE_LIMITS = {
  '/api/attractiveness/score': {
    limit: 10, // 10 requests
    window: 60 // per 60 seconds (1 minute)
  }
};

export async function rateLimitMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if this path has rate limiting
  const rateLimitConfig = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS];
  if (!rateLimitConfig) {
    return null; // No rate limiting for this path
  }
  
  // Get IP address
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.ip || 
             'unknown';
  
  // Create key for this IP and path
  const key = `rate_limit:${pathname}:${ip}`;
  
  try {
    // Get current count from Redis
    const countStr = await RedisCache.getLeaderboard(key);
    let count = countStr ? parseInt(countStr, 10) : 0;
    
    // If this is the first request in the window, reset the counter
    if (count === 0) {
      // Set the key with expiration
      await RedisCache.cacheLeaderboard(key, '1');
    } else if (count >= rateLimitConfig.limit) {
      // Rate limit exceeded
      return NextResponse.json({
        success: false,
        message: `Rate limit exceeded. Maximum ${rateLimitConfig.limit} requests per ${rateLimitConfig.window} seconds.`,
        error_type: 'rate_limit_exceeded'
      }, { status: 429 });
    } else {
      // Increment the counter
      await RedisCache.cacheLeaderboard(key, (count + 1).toString());
    }
    
    return null; // Continue with the request
  } catch (error) {
    console.error('Rate limiting error:', error);
    // In case of Redis error, allow the request to proceed
    return null;
  }
}