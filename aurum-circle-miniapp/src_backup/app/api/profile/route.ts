import { NextRequest, NextResponse } from "next/server";
import { getUserProfileStorage } from "@/lib/storage/user-profile-storage";
import { getUserFromRequest } from "@/lib/auth/session";
import { z } from "zod";

// Update profile schema
const updateProfileSchema = z.object({
  vibeTags: z.array(z.string()).optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  university: z.string().optional(),
  graduationYear: z.number().optional(),
  isProfileComplete: z.boolean().optional(),
  verificationBadges: z
    .object({
      worldId: z.boolean().optional(),
      nft: z.boolean().optional(),
      score: z.boolean().optional(),
    })
    .optional(),
  score: z
    .object({
      value: z.number(),
      percentile: z.number(),
      breakdown: z.object({
        facial: z.number(),
        university: z.number(),
        nft: z.number(),
      }),
      scoredAt: z.date(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileStorage = getUserProfileStorage();
    const profile = await profileStorage.getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("❌ Failed to get profile:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const profileStorage = getUserProfileStorage();
    const updatedProfile = await profileStorage.updateUserProfile(
      user.id,
      validatedData
    );

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("❌ Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileStorage = getUserProfileStorage();
    await profileStorage.deleteUserProfile(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Failed to delete profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}
