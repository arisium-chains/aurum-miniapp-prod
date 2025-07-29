import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { z } from 'zod'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const swipeActionSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  action: z.enum(['like', 'pass', 'super_like'], {
    errorMap: () => ({ message: 'Action must be like, pass, or super_like' })
  })
})

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
    const validatedData = swipeActionSchema.parse(body)

    console.log('🎯 Recording swipe action:', {
      userId: (payload.worldId as string).substring(0, 10) + '...',
      profileId: validatedData.profileId,
      action: validatedData.action
    })

    // TODO: Store swipe action in database
    // For now, we'll just log and return success
    const swipeRecord = {
      id: crypto.randomUUID(),
      userId: payload.worldId,
      profileId: validatedData.profileId,
      action: validatedData.action,
      timestamp: new Date().toISOString()
    }

    // Check for mutual match (mock logic for demo)
    const isMatch = validatedData.action === 'like' && Math.random() > 0.7 // 30% match rate for demo

    console.log('✅ Swipe action recorded:', {
      action: validatedData.action,
      isMatch
    })

    return NextResponse.json({
      success: true,
      message: 'Swipe action recorded',
      data: {
        swipeId: swipeRecord.id,
        action: validatedData.action,
        isMatch,
        timestamp: swipeRecord.timestamp
      }
    })

  } catch (error) {
    console.error('💥 Swipe action error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid swipe data',
          errors: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to record swipe action',
        error: 'SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}