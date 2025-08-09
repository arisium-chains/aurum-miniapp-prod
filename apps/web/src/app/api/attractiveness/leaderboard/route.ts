import { NextRequest, NextResponse } from 'next/server'
import { attractivenessEngine } from '@/lib/attractiveness-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam))) : 50

    // Get leaderboard data
    const leaderboard = await attractivenessEngine.getLeaderboard(limit)

    return NextResponse.json({
      success: true,
      data: {
        users: leaderboard.users,
        totalUsers: leaderboard.totalUsers,
        distribution: leaderboard.distribution,
        metadata: {
          requestedLimit: limit,
          returnedCount: leaderboard.users.length,
          generatedAt: new Date().toISOString()
        }
      },
      message: `Top ${leaderboard.users.length} users out of ${leaderboard.totalUsers} total`
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve leaderboard',
      error_type: 'processing_error'
    }, { status: 500 })
  }
}