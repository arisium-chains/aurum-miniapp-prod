import { NextRequest, NextResponse } from 'next/server'
import { mlModelIntegration } from '@/lib/ml-models/model-integration'

export async function GET(request: NextRequest) {
  try {
    // Get ML model health status
    const healthCheck = await mlModelIntegration.healthCheck()
    const modelInfo = mlModelIntegration.getModelInfo()
    
    return NextResponse.json({
      success: true,
      data: {
        health: healthCheck,
        info: modelInfo,
        recommendations: {
          shouldUseRealML: healthCheck.status === 'healthy',
          fallbackMode: healthCheck.status !== 'healthy',
          estimatedLatency: healthCheck.latency ? `${healthCheck.latency}ms` : 'unknown'
        }
      },
      message: `ML models are ${healthCheck.status}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('ML status check error:', error)
    
    return NextResponse.json({
      success: false,
      data: {
        health: {
          status: 'unhealthy',
          details: {
            faceDetection: false,
            faceEmbedding: false,
            overall: false
          }
        },
        info: {
          initialized: false,
          models: {
            faceDetection: false,
            faceEmbedding: false
          },
          version: 'unknown'
        },
        recommendations: {
          shouldUseRealML: false,
          fallbackMode: true,
          estimatedLatency: 'unknown'
        }
      },
      message: 'ML model status check failed',
      error_type: 'ml_status_error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}