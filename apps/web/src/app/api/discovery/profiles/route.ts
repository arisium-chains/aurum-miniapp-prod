import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function GET(request: NextRequest) {
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

    // Fetch profiles from the database
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: payload.profileId as string,
        },
      },
      take: 10, // Limit to 10 profiles for now
    })

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('💥 Fetch profiles error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profiles',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    )
  }
}
