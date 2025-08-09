import { NextRequest, NextResponse } from 'next/server'
import { calculateFinalScore, UserProfile } from '@/lib/final-score-calculator'
import { RedisCache } from '@/lib/redis-cache'

// University Score Map (Bangkok only)
const universityScoreMap: Record<string, number> = {
  "Chulalongkorn University": 20,
  "Mahidol International College": 20,
  "Thammasat Rangsit": 20,
  "Siriraj Hospital (Mahidol)": 20,
  "Kasetsart University": 10,
  "KMUTT": 10,
  "Srinakharinwirot University": 10,
  "Silpakorn University": 10,
  "TU Tha Prachan": 10,
  "Bangkok University": 5,
  "Rangsit University": 5,
  "Sripatum University": 5,
  "Assumption University (ABAC)": 5
  // All others default to 0
}

// NFT Tier Score Table (for Male only)
const nftScoreMap: Record<string, number> = {
  "none": 0,
  "basic": 3,
  "rare": 5,
  "elite": 10,
  "legendary": 15
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    if (!body) {
      return NextResponse.json({
        success: false,
        message: 'Request body is required',
        error_type: 'validation_error'
      }, { status: 400 })
    }
    
    // Calculate final score
    const result = calculateFinalScore(body as UserProfile)
    
    // Get component scores
    const facialScore = result.facialScore || 0
    const universityScore = universityScoreMap[result.university] || 0
    const nftScore = result.gender === "male" ? (nftScoreMap[result.nftTier || "none"] || 0) : 0
    
    // Cache the final score
    await RedisCache.cacheFacialScore(result.userId, result.finalScore || 0)
    
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        score: result.finalScore,
        percentile: result.finalScore ? Math.round((result.finalScore / 100) * 100) / 100 : 0,
        components: {
          facial: facialScore,
          university: universityScore,
          nft: nftScore
        }
      },
      message: 'Final score calculated successfully'
    })
    
  } catch (error: any) {
    console.error('Final score calculation error:', error)
    
    // Handle validation errors
    if (error.message && error.message.includes('required')) {
      return NextResponse.json({
        success: false,
        message: error.message,
        error_type: 'validation_error'
      }, { status: 400 })
    }
    
    if (error.message && error.message.includes('Invalid NFT tier')) {
      return NextResponse.json({
        success: false,
        message: error.message,
        error_type: 'validation_error'
      }, { status: 400 })
    }
    
    if (error.message && error.message.includes('Gender must be')) {
      return NextResponse.json({
        success: false,
        message: error.message,
        error_type: 'validation_error'
      }, { status: 400 })
    }
    
    // Generic error
    return NextResponse.json({
      success: false,
      message: 'Internal server error during final score calculation',
      error_type: 'processing_error'
    }, { status: 500 })
  }
}