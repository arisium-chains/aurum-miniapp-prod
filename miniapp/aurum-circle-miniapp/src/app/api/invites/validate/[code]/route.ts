import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json({ success: false, message: 'Invite code is required' }, { status: 400 })
    }

    const invite = await prisma.invite.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        user: {
          select: {
            displayName: true,
            profileImage: true,
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json({ success: false, message: 'Invalid invite code' }, { status: 404 })
    }

    if (invite.claimedAt) {
      return NextResponse.json({ success: false, message: 'This invite code has already been claimed' }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invite code is valid',
      data: {
        code: invite.code,
        invitedBy: invite.user.displayName,
      },
    })
  } catch (error) {
    console.error('💥 Validate invite error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to validate invite code',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    )
  }
}
