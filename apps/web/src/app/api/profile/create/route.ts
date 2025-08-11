import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const profileCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  university: z.string().min(1, 'University is required'),
  year: z.string().optional(),
  faculty: z.string().optional(),
  primaryVibe: z.string().min(1, 'Primary vibe is required'),
  secondaryVibes: z.array(z.string()).max(2, 'Maximum 2 secondary vibes'),
  bio: z.string().max(300, 'Bio too long').optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const sessionCookie = request.cookies.get('worldid-session');
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Session required' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(sessionCookie.value, secret);
    if (!payload.walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet connection required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = profileCreateSchema.parse(body);

    console.log('👤 Creating profile:', {
      worldId: (payload.worldId as string).substring(0, 10) + '...',
      name: validatedData.name,
      university: validatedData.university,
      primaryVibe: validatedData.primaryVibe,
    });

    // Store profile in database
    const user = await prisma.user.create({
      data: {
        worldId: payload.worldId as string,
        walletAddress: payload.walletAddress as string,
        handle:
          validatedData.name.toLowerCase().replace(/\s/g, '_') +
          '_' +
          crypto.randomUUID().slice(0, 4),
        displayName: validatedData.name,
        bio: validatedData.bio,
        vibe: validatedData.primaryVibe,
        tags: {
          university: validatedData.university,
          year: validatedData.year,
          faculty: validatedData.faculty,
          secondaryVibes: validatedData.secondaryVibes,
        },
        nftVerified: false, // This will be updated later
        status: 'active',
      },
    });

    // Update session with profile completion
    const updatedToken = await new SignJWT({
      ...payload,
      profileCompleted: true,
      profileId: user.id,
      profileCreatedAt: user.createdAt,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Extend session for active users
      .sign(secret);

    const responseObj = NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      data: {
        profileId: user.id,
        name: validatedData.name,
        university: validatedData.university,
        primaryVibe: validatedData.primaryVibe,
      },
    });

    responseObj.cookies.set('worldid-session', updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('✅ Profile created successfully');
    return responseObj;
  } catch (error) {
    console.error('💥 Profile creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid profile data',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create profile',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
