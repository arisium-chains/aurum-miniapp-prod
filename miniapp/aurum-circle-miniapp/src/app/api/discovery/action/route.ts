import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { z } from 'zod'
import prisma from '@/lib/prisma'

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

    // Store swipe action in the database
    const swipe = await prisma.signal.create({
      data: {
        fromUserId: payload.profileId as string,
        toUserId: validatedData.profileId,
        type: validatedData.action,
      },
    });

    let isMatch = false;
    // Check for a mutual match if the action is 'like' or 'super_like'
    if (validatedData.action === 'like' || validatedData.action === 'super_like') {
      const mutualLike = await prisma.signal.findFirst({
        where: {
          fromUserId: validatedData.profileId,
          toUserId: payload.profileId as string,
          type: {
            in: ['like', 'super_like'],
          },
        },
      });

      if (mutualLike) {
        isMatch = true;
        // Create a match record
        await prisma.match.create({
          data: {
            user1Id: payload.profileId as string,
            user2Id: validatedData.profileId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Swipe action recorded',
      data: {
        isMatch,
      },
    });

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