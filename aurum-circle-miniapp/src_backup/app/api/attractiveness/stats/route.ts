import { NextRequest, NextResponse } from 'next/server'
import { attractivenessEngine } from '@/lib/attractiveness-engine'

export async function GET(request: NextRequest) {
  try {
    // Get system statistics
    const stats = await attractivenessEngine.getSystemStats()

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: stats.totalUsers,
        averageScore: stats.averageScore,
        distribution: stats.distribution,
        topPercentiles: stats.topPercentiles,
        systemHealth: {
          status: 'operational',
          vectorStoreCapacity: `${stats.totalUsers}/10000`,
          lastUpdated: new Date().toISOString()
        }
      },
      message: `System statistics for ${stats.totalUsers} users`
    })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve system statistics',
      error_type: 'processing_error'
    }, { status: 500 })
  }
}