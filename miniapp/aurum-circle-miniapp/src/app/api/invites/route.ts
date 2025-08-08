import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function GET(request: NextRequest) {
  try {
    // 1. Verify session
    const sessionCookie = request.cookies.get('worldid-session')
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: 'Session required' }, { status: 401 })
    }

    const { payload } = await jwtVerify(sessionCookie.value, secret)
    if (!payload.profileCompleted || !payload.profileId) {
      return NextResponse.json({ success: false, message: 'Profile setup required' }, { status: 400 })
    }

    const userId = payload.profileId as string

    // 2. Fetch user's invites from the database
    const invites = await prisma.invite.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: invites,
    })
  } catch (error) {
    console.error('💥 Fetch invites error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch invites',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    )
  }
}
