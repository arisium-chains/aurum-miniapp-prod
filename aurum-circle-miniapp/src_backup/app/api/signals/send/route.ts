import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { z } from 'zod'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const signalSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  signalType: z.enum(['rose', 'lightning', 'mask', 'fire'], {
    errorMap: () => ({ message: 'Invalid signal type' })
  })
})

const SIGNAL_COSTS = {
  rose: 0,      // Free signal
  lightning: 1, // Rare signal
  mask: 2,      // Legendary signal  
  fire: 1       // Rare signal
}

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const sessionCookie = request.cookies.get('worldid-session')
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Session required' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(sessionCookie.value, secret)
    if (!payload.profileCompleted) {
      return NextResponse.json(
        { success: false, message: 'Profile setup required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = signalSchema.parse(body)

    console.log('🌟 Sending secret signal:', {
      from: (payload.worldId as string).substring(0, 10) + '...',
      to: validatedData.profileId,
      type: validatedData.signalType
    })

    // TODO: Check user's signal balance and deduct cost
    const signalCost = SIGNAL_COSTS[validatedData.signalType]
    console.log(`💎 Signal cost: ${signalCost} (${validatedData.signalType})`)

    // TODO: Store signal in database and check for mutual signals
    const signalRecord = {
      id: crypto.randomUUID(),
      from: payload.worldId,
      to: validatedData.profileId,
      signalType: validatedData.signalType,
      timestamp: new Date().toISOString(),
      mutual: false // Check if recipient has also sent a signal
    }

    // Mock mutual signal detection (15% chance for demo)
    const isMutual = Math.random() > 0.85
    signalRecord.mutual = isMutual

    if (isMutual) {
      console.log('🔥 Mutual signal detected! Profile revealed.')
    }

    return NextResponse.json({
      success: true,
      message: 'Secret signal sent successfully',
      data: {
        signalId: signalRecord.id,
        signalType: validatedData.signalType,
        cost: signalCost,
        mutual: isMutual,
        timestamp: signalRecord.timestamp,
        ...(isMutual && {
          message: 'Mutual interest detected! Profile has been revealed.'
        })
      }
    })

  } catch (error) {
    console.error('💥 Signal sending error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid signal data',
          errors: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send signal',
        error: 'SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}