import { NextRequest, NextResponse } from 'next/server'
import { attractivenessEngine } from '@/lib/attractiveness-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(20, Math.max(1, parseInt(limitParam))) : 10

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required',
        error_type: 'validation_error'
      }, { status: 400 })
    }

    // Find similar users
    const similarUsers = await attractivenessEngine.findSimilarUsers(userId, limit)

    return NextResponse.json({
      success: true,
      data: {
        userId,
        similarUsers,
        count: similarUsers.length,
        metadata: {
          algorithm: 'cosine_similarity',
          embeddingModel: 'arcface_simulated',
          generatedAt: new Date().toISOString()
        }
      },
      message: `Found ${similarUsers.length} similar users`
    })

  } catch (error: any) {
    console.error('Similar users error:', error)

    if (error.message.includes('User not found')) {
      return NextResponse.json({
        success: false,
        message: 'User has not been scored yet',
        error_type: 'user_not_found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to find similar users',
      error_type: 'processing_error'
    }, { status: 500 })
  }
}