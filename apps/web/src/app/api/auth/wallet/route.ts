import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { z } from 'zod'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const walletConnectionSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  signature: z.string().min(1, 'Signature is required')
})

export async function POST(request: NextRequest) {
  try {
    // Verify World ID session exists
    const sessionCookie = request.cookies.get('worldid-session')
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'World ID session required' },
        { status: 401 }
      )
    }

    // Verify the session token
    const { payload } = await jwtVerify(sessionCookie.value, secret)
    if (!payload.worldId) {
      return NextResponse.json(
        { success: false, message: 'Invalid World ID session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = walletConnectionSchema.parse(body)

    console.log('💳 Connecting wallet:', {
      worldId: (payload.worldId as string).substring(0, 10) + '...',
      address: validatedData.address.substring(0, 6) + '...',
      hasSignature: !!validatedData.signature
    })

    // TODO: Store wallet connection in database
    // For now, we'll just update the session token

    // Create updated session token with wallet info
    const { SignJWT } = await import('jose')
    const updatedToken = await new SignJWT({
      ...payload,
      walletAddress: validatedData.address,
      walletConnectedAt: new Date().toISOString()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    const responseObj = NextResponse.json({
      success: true,
      message: 'Wallet connected successfully',
      data: {
        address: validatedData.address
      }
    })

    // Update the session cookie with wallet info
    responseObj.cookies.set('worldid-session', updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    console.log('✅ Wallet connected successfully')
    return responseObj

  } catch (error) {
    console.error('💥 Wallet connection error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid wallet data',
          errors: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect wallet',
        error: 'SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}