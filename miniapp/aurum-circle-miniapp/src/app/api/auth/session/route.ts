import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('worldid-session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'No session found' },
        { status: 401 }
      )
    }

    // Verify the session token
    const { payload } = await jwtVerify(sessionCookie.value, secret)
    
    const sessionData = {
      worldId: payload.worldId,
      verificationLevel: payload.verificationLevel,
      verifiedAt: payload.verifiedAt,
      walletAddress: payload.walletAddress || null,
      walletConnectedAt: payload.walletConnectedAt || null,
      nftVerified: payload.nftVerified || false,
      profileCompleted: payload.profileCompleted || false
    }

    return NextResponse.json({
      success: true,
      message: 'Session valid',
      data: sessionData
    })

  } catch (error) {
    console.error('Session verification error:', error)
    
    return NextResponse.json(
      { success: false, message: 'Invalid session' },
      { status: 401 }
    )
  }
}