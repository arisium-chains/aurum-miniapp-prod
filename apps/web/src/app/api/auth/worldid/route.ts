import { NextRequest, NextResponse } from 'next/server'
import { worldIdProofSchema } from '@/lib/validations'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = worldIdProofSchema.parse(body)
    
    console.log('🔍 Verifying World ID proof:', {
      app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
      nullifier_hash: validatedData.nullifier_hash.substring(0, 10) + '...',
      verification_level: validatedData.verification_level
    })
    
    // Verify the World ID proof with Worldcoin's API
    const verificationPayload = {
      nullifier_hash: validatedData.nullifier_hash,
      merkle_root: validatedData.merkle_root,
      proof: validatedData.proof,
      verification_level: validatedData.verification_level,
      action: 'verify-human'
    }

    const response = await fetch(`https://developer.worldcoin.org/api/v1/verify/${process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationPayload)
    })

    const verificationResult = await response.json()
    
    console.log('📡 World ID API response:', {
      status: response.status,
      success: verificationResult.success,
      detail: verificationResult.detail
    })

    if (!response.ok || !verificationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: verificationResult.detail || 'World ID verification failed',
          error: verificationResult.code || 'VERIFICATION_FAILED'
        },
        { status: 400 }
      )
    }

    // Create a session token for the verified user
    const sessionToken = await new SignJWT({ 
      worldId: validatedData.nullifier_hash,
      verificationLevel: validatedData.verification_level,
      verifiedAt: new Date().toISOString(),
      action: 'verify-human'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Set secure cookie
    const responseObj = NextResponse.json({ 
      success: true, 
      message: 'World ID verified successfully',
      data: {
        nullifier_hash: validatedData.nullifier_hash,
        verification_level: validatedData.verification_level
      }
    })

    responseObj.cookies.set('worldid-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    console.log('✅ World ID verification successful')
    return responseObj

  } catch (error) {
    console.error('💥 World ID verification error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message,
          error: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: 'SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}