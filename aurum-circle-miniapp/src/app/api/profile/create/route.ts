import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { BirthData } from "@/types/bazi";
import { calculateBaZi, validateBirthData } from "@/lib/bazi-utils";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const birthDataSchema = z.object({
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  timezone: z.string().min(1, "Timezone is required"),
  isPrivate: z.boolean().default(true),
});

const profileCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  university: z.string().min(1, "University is required"),
  year: z.string().optional(),
  faculty: z.string().optional(),
  primaryVibe: z.string().min(1, "Primary vibe is required"),
  secondaryVibes: z.array(z.string()).max(2, "Maximum 2 secondary vibes"),
  bio: z.string().max(300, "Bio too long").optional(),
  birthData: birthDataSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const sessionCookie = request.cookies.get("worldid-session");
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: "Session required" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(sessionCookie.value, secret);
    if (!payload.walletAddress) {
      return NextResponse.json(
        { success: false, message: "Wallet connection required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = profileCreateSchema.parse(body);

    console.log("👤 Creating profile:", {
      worldId: (payload.worldId as string).substring(0, 10) + "...",
      name: validatedData.name,
      university: validatedData.university,
      primaryVibe: validatedData.primaryVibe,
    });

    // Validate birth data if provided
    let baziData = null;
    if (validatedData.birthData) {
      // Convert string date to Date object
      const birthData: BirthData = {
        date: new Date(validatedData.birthData.date),
        timezone: validatedData.birthData.timezone,
        isPrivate: validatedData.birthData.isPrivate,
      };

      // Validate birth data
      const validation = validateBirthData(birthData);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid birth data",
            errors: validation.errors,
          },
          { status: 400 }
        );
      }

      // Calculate BaZi data
      try {
        baziData = calculateBaZi(birthData);
      } catch (error) {
        console.error("BaZi calculation error:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to calculate BaZi data",
            error: "BAZI_CALCULATION_ERROR",
          },
          { status: 500 }
        );
      }
    }

    // TODO: Store profile in database
    // For now, we'll just update the session token with profile completion

    const profileData = {
      id: crypto.randomUUID(),
      worldId: payload.worldId,
      walletAddress: payload.walletAddress,
      name: validatedData.name,
      university: validatedData.university,
      year: validatedData.year || null,
      faculty: validatedData.faculty || null,
      primaryVibe: validatedData.primaryVibe,
      secondaryVibes: validatedData.secondaryVibes,
      bio: validatedData.bio || null,
      birthData: validatedData.birthData
        ? {
            date: new Date(validatedData.birthData.date),
            timezone: validatedData.birthData.timezone,
            isPrivate: validatedData.birthData.isPrivate,
          }
        : null,
      baziData: baziData,
      createdAt: new Date().toISOString(),
      isActive: true,
      inviteCodesUsed: 0,
      maxInviteCodes: 3,
    };

    // Update session with profile completion
    const updatedToken = await new SignJWT({
      ...payload,
      profileCompleted: true,
      profileId: profileData.id,
      profileCreatedAt: profileData.createdAt,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // Extend session for active users
      .sign(secret);

    const responseObj = NextResponse.json({
      success: true,
      message: "Profile created successfully",
      data: {
        profileId: profileData.id,
        name: profileData.name,
        university: profileData.university,
        primaryVibe: profileData.primaryVibe,
      },
    });

    responseObj.cookies.set("worldid-session", updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    console.log("✅ Profile created successfully");
    return responseObj;
  } catch (error) {
    console.error("💥 Profile creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid profile data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create profile",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
