import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const claimInviteSchema = z.object({
  code: z.string().min(1, 'Invite code is required'),
})

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
    const claimingUserId = payload.profileId as string

    // 2. Validate request body
    const body = await request.json()
    const validatedData = claimInviteSchema.parse(body)
    const code = validatedData.code.toUpperCase()

    // 3. Check if the invite code is valid
    const invite = await prisma.invite.findUnique({
      where: { code },
    })

    if (!invite) {
      return NextResponse.json({ success: false, message: 'Invalid invite code' }, { status: 404 })
    }
    if (invite.claimedAt) {
      return NextResponse.json({ success: false, message: 'This invite code has already been claimed' }, { status: 410 })
    }
    if (invite.userId === claimingUserId) {
      return NextResponse.json({ success: false, message: 'You cannot claim your own invite code' }, { status: 400 })
    }

    // 4. Mark the invite code as claimed
    const updatedInvite = await prisma.invite.update({
      where: { id: invite.id },
      data: {
        claimedBy: claimingUserId,
        claimedAt: new Date(),
      },
    })

    // TODO: Reward the inviter with an additional invite code

    return NextResponse.json({
      success: true,
      message: 'Invite code claimed successfully',
      data: {
        code: updatedInvite.code,
      },
    })
  } catch (error) {
    console.error('💥 Claim invite error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to claim invite code',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    )
  }
}
