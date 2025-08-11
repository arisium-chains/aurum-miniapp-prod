import { NextRequest, NextResponse } from 'next/server';
import { RedisCache } from '@/lib/redis-cache';

interface AIScoreLog {
  userId: string;
  score: number;
  interpretation: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key in header
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.AI_API_KEY;

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized access',
          error_type: 'unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.userId || body.score === undefined || !body.interpretation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: userId, score, interpretation',
          error_type: 'validation_error',
        },
        { status: 400 }
      );
    }

    // Create log entry
    const logEntry: AIScoreLog = {
      userId: body.userId,
      score: body.score,
      interpretation: body.interpretation,
      timestamp: new Date().toISOString(),
      metadata: body.metadata,
    };

    // Store in Redis with a key that includes timestamp for uniqueness
    const key = `ai_score_log:${body.userId}:${Date.now()}`;
    await RedisCache.cacheLeaderboard(key, logEntry);

    return NextResponse.json({
      success: true,
      message: 'AI score logged successfully',
    });
  } catch (error: any) {
    console.error('AI score log error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during AI score logging',
        error_type: 'processing_error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for API key in header
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.AI_API_KEY;

    if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized access',
          error_type: 'unauthorized',
        },
        { status: 401 }
      );
    }

    // For now, return a simple response
    // In a production environment, you might want to implement pagination
    return NextResponse.json({
      success: true,
      message: 'AI score log endpoint is ready',
      data: [],
    });
  } catch (error: any) {
    console.error('AI score log error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error_type: 'processing_error',
      },
      { status: 500 }
    );
  }
}
