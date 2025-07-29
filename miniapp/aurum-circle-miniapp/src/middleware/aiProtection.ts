/**
 * AI Middleware Protection
 * Protects AI routes with API key validation
 */

import { NextRequest, NextResponse } from 'next/server';

export async function aiMiddleware(request: NextRequest) {
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.AI_API_KEY;
  
  // Allow in development without API key
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment && !apiKey) {
    return null; // Continue with request
  }
  
  // Validate API key
  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json({
      success: false,
      message: 'Unauthorized access to AI services',
      error_type: 'unauthorized'
    }, { status: 401 });
  }
  
  return null; // Continue with request
}