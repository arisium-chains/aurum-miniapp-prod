import { NextRequest, NextResponse } from "next/server";
import { getInviteStorage } from "@/lib/storage/invite-storage";
import { getUserFromRequest } from "@/lib/auth/session";
import { z } from "zod";

// Create invite schema
const createInviteSchema = z.object({
  expiresAt: z.string().optional(),
});

// Redeem invite schema
const redeemInviteSchema = z.object({
  code: z.string().min(8).max(8),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inviteStorage = getInviteStorage();
    const invites = await inviteStorage.getUserInviteCodes(user.id);

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("❌ Failed to get invites:", error);
    return NextResponse.json(
      { error: "Failed to get invites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInviteSchema.parse(body);

    const inviteStorage = getInviteStorage();
    const invite = await inviteStorage.createInviteCode({
      userId: user.id,
      expiresAt: validatedData.expiresAt
        ? new Date(validatedData.expiresAt)
        : undefined,
    });

    return NextResponse.json({ invite });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("❌ Failed to create invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
