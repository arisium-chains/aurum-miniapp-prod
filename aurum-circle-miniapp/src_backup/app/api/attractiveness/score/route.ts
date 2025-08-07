import { NextRequest, NextResponse } from 'next/server'
import { attractivenessEngine, attractivenessEngineSimulated } from '@/lib/attractiveness-engine'
import { ScoringRequest } from '@/lib/attractiveness-engine'
import { mlModelIntegration } from '@/lib/ml-models/model-integration'
import { rateLimitMiddleware } from '@/middleware/rateLimit'
import { RedisCache } from '@/lib/redis-cache'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  try {
    const body = await request.json()
    const { userId, image, nftVerified, wldVerified, useRealML = false } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
        error_type: 'validation_error'
      }, { status: 400 })
    }

    if (!image) {
      return NextResponse.json({
        success: false,
        message: 'Image is required',
        error_type: 'validation_error'
      }, { status: 400 })
    }

    // Validate image format
    if (!image.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid image format (must be base64)',
        error_type: 'validation_error'
      }, { status: 400 })
    }

    // Validate image size
    if (image.length < 5000) {
      return NextResponse.json({
        success: false,
        message: 'Image too small for analysis',
        error_type: 'validation_error'
      }, { status: 400 })
    }

    if (image.length > 3000000) { // ~3MB limit
      return NextResponse.json({
        success: false,
        message: 'Image too large (max 3MB)',
        error_type: 'validation_error'
      }, { status: 400 })
    }

    // Create scoring request
    const scoringRequest: ScoringRequest = {
      userId,
      imageBase64: image,
      metadata: {
        nftVerified: nftVerified || false,
        wldVerified: wldVerified || false,
        timestamp: new Date().toISOString()
      }
    }

    // Check ML model availability and choose engine
    let actualEngine = useRealML ? attractivenessEngine : attractivenessEngineSimulated
    let actualMLMode = useRealML ? 'production_ml' : 'simulated_ml'
    let fallbackUsed = false
    
    if (useRealML) {
      try {
        const healthCheck = await mlModelIntegration.healthCheck()
        if (healthCheck.status === 'unhealthy') {
          console.warn('Real ML models unavailable, falling back to simulated mode')
          actualEngine = attractivenessEngineSimulated
          actualMLMode = 'simulated_fallback'
          fallbackUsed = true
        }
      } catch (error) {
        console.warn('ML health check failed, falling back to simulated mode:', error)
        actualEngine = attractivenessEngineSimulated
        actualMLMode = 'simulated_fallback'
        fallbackUsed = true
      }
    }
    
    // Process the scoring request
    const result = await actualEngine.scoreUser(scoringRequest)
    
    // Cache the facial score
    await RedisCache.cacheFacialScore(request.userId, result.score)

    const message = fallbackUsed 
      ? `Scored successfully (fallback mode)! Rank #${result.metadata.userRank} out of ${result.metadata.totalUsers} users`
      : `Scored successfully! Rank #${result.metadata.userRank} out of ${result.metadata.totalUsers} users`

    return NextResponse.json({
      success: true,
      data: {
        score: result.score,
        percentile: result.percentile,
        vibeTags: result.vibeTags,
        timestamp: result.timestamp,
        metadata: result.metadata,
        distribution: result.distribution
      },
      message,
      debug: {
        processingPipeline: actualMLMode === 'production_ml'
          ? 'real_ml_detection -> arcface_embedding -> vector_comparison -> percentile_calculation -> vibe_clustering'
          : 'simulated_detection -> simulated_embedding -> vector_comparison -> percentile_calculation -> vibe_clustering',
        mlMode: actualMLMode,
        fallbackUsed,
        confidence: result.metadata.confidence,
        faceMetrics: {
          quality: result.metadata.faceQuality,
          frontality: result.metadata.frontality,
          symmetry: result.metadata.symmetry,
          resolution: result.metadata.resolution
        }
      }
    })

  } catch (error: any) {
    console.error('Attractiveness scoring error:', error)

    // Handle specific error types
    if (error.message.includes('already has a score')) {
      return NextResponse.json({
        success: false,
        message: 'You have already been scored. Only one scoring session is allowed per user.',
        error_type: 'one_time_rule_violation'
      }, { status: 409 })
    }

    if (error.message.includes('No face detected')) {
      return NextResponse.json({
        success: false,
        message: 'No face detected in the image. Please upload a clear portrait photo.',
        error_type: 'face_detection_failed'
      }, { status: 400 })
    }

    if (error.message.includes('Face quality too low')) {
      return NextResponse.json({
        success: false,
        message: 'Face quality is too low for accurate scoring. Please ensure good lighting, frontal angle, and clear resolution.',
        error_type: 'face_quality_insufficient'
      }, { status: 400 })
    }

    if (error.message.includes('NFT verification required')) {
      return NextResponse.json({
        success: false,
        message: 'NFT verification is required before scoring.',
        error_type: 'nft_verification_required'
      }, { status: 403 })
    }

    if (error.message.includes('WorldCoin verification required')) {
      return NextResponse.json({
        success: false,
        message: 'WorldCoin verification is required before scoring.',
        error_type: 'wld_verification_required'
      }, { status: 403 })
    }

    // Generic error
    return NextResponse.json({
      success: false,
      message: 'Internal server error during scoring analysis',
      error_type: 'processing_error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
        error_type: 'validation_error'
      }, { status: 400 })
    }

    // Try to get cached facial score first
    const cachedScore = await RedisCache.getFacialScore(userId)
    if (cachedScore !== null) {
      // Return cached score
      return NextResponse.json({
        success: true,
        data: {
          score: cachedScore,
          percentile: cachedScore / 100,
          message: 'Score retrieved from cache'
        }
      })
    }

    // Get existing user score from vector store
    const result = await attractivenessEngine.getUserScore(userId)

    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'User has not been scored yet',
        error_type: 'user_not_found'
      }, { status: 404 })
    }

    // Cache the score for future requests
    await RedisCache.cacheFacialScore(userId, result.score)

    return NextResponse.json({
      success: true,
      data: {
        score: result.score,
        percentile: result.percentile,
        vibeTags: result.vibeTags,
        timestamp: result.timestamp,
        metadata: result.metadata,
        distribution: result.distribution
      },
      message: `Current rank: #${result.metadata.userRank} out of ${result.metadata.totalUsers} users`
    })

  } catch (error) {
    console.error('Get score error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error_type: 'processing_error'
    }, { status: 500 })
  }
}