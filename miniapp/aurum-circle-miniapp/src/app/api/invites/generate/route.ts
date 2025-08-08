import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'
import { customAlphabet } from 'nanoid'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6)

export async function POST(request: NextRequest) {
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

    // 2. Check if the user has reached their maximum number of active invites
    const userInvites = await prisma.invite.count({
      where: {
        userId: userId,
        claimedAt: null, // Only count unclaimed invites
      },
    })

    // TODO: Make this configurable
    const MAX_INVITES = 3
    if (userInvites >= MAX_INVITES) {
      return NextResponse.json(
        { success: false, message: `You have reached the maximum of ${MAX_INVITES} active invites.` },
        { status: 403 }
      )
    }

    // 3. Generate a new unique invite code
    let newCode: string
    let existingCode = true
    do {
      newCode = `AURUM-${nanoid()}`
      existingCode = !!(await prisma.invite.findUnique({ where: { code: newCode } }))
    } while (existingCode)

    // 4. Save the invite code to the database
    const invite = await prisma.invite.create({
      data: {
        code: newCode,
        userId: userId,
      },
    })

    // 5. Return the new invite code to the user
    return NextResponse.json({
      success: true,
      message: 'Invite code generated successfully',
      data: invite,
    })
  } catch (error) {
    console.error('💥 Generate invite error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate invite code',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    )
  }
}
