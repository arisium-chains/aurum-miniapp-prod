import { NextRequest, NextResponse } from "next/server";
import { getInviteStorage } from "@/lib/storage/invite-storage";
import { getUserFromRequest } from "@/lib/auth/session";
import { z } from "zod";

// Redeem invite schema
const redeemInviteSchema = z.object({
  code: z.string().min(8).max(8),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = redeemInviteSchema.parse(body);

    const inviteStorage = getInviteStorage();

    // Get user's IP address for logging
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const invite = await inviteStorage.redeemInviteCode({
      code: validatedData.code,
      userId: user.id,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Invite code redeemed successfully",
      invite,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("❌ Failed to redeem invite:", error);

    // Return specific error messages for common cases
    if (error instanceof Error) {
      if (error.message.includes("Maximum 3 invite codes")) {
        return NextResponse.json(
          { error: "You have reached the maximum limit of 3 invite codes" },
          { status: 400 }
        );
      }
      if (error.message.includes("Invalid invite code")) {
        return NextResponse.json(
          { error: "Invalid invite code" },
          { status: 404 }
        );
      }
      if (error.message.includes("already used")) {
        return NextResponse.json(
          { error: "This invite code has already been used" },
          { status: 400 }
        );
      }
      if (error.message.includes("expired")) {
        return NextResponse.json(
          { error: "This invite code has expired" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to redeem invite code" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const inviteStorage = getInviteStorage();
    const isValid = await inviteStorage.isInviteCodeValid(code);

    return NextResponse.json({
      isValid,
      code,
    });
  } catch (error) {
    console.error("❌ Failed to validate invite code:", error);
    return NextResponse.json(
      { error: "Failed to validate invite code" },
      { status: 500 }
    );
  }
}
