import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { z } from "zod";

// Signal schema
const signalSchema = z.object({
  targetUserId: z.string(),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(true),
});

// Mutual match detection schema
const mutualMatchSchema = z.object({
  userId1: z.string(),
  userId2: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get signals sent by this user
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'sent', 'received', 'matches'

    // This would typically query a database or storage system
    // For now, return empty arrays as placeholders
    const signals = {
      sent: [],
      received: [],
      matches: [],
    };

    if (type && signals[type as keyof typeof signals] !== undefined) {
      return NextResponse.json({
        signals: signals[type as keyof typeof signals],
      });
    }

    return NextResponse.json({ signals });
  } catch (error) {
    console.error("❌ Failed to get signals:", error);
    return NextResponse.json(
      { error: "Failed to get signals" },
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
    const validatedData = signalSchema.parse(body);

    // Create a signal record
    const signal = {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId: user.id,
      toUserId: validatedData.targetUserId,
      message: validatedData.message,
      isAnonymous: validatedData.isAnonymous,
      createdAt: new Date(),
      status: "pending", // pending, accepted, rejected
      isMutual: false,
    };

    // Store the signal (this would typically go to a database)
    console.log(
      `✅ Signal created: ${signal.id} from ${user.id} to ${validatedData.targetUserId}`
    );

    // Check for mutual match
    const isMutual = await checkMutualMatch(
      user.id,
      validatedData.targetUserId
    );

    if (isMutual) {
      // Update both signals as mutual
      signal.isMutual = true;
      signal.status = "accepted";

      console.log(
        `✅ Mutual match detected: ${user.id} <-> ${validatedData.targetUserId}`
      );
    }

    return NextResponse.json({
      success: true,
      signal,
      isMutual,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("❌ Failed to create signal:", error);
    return NextResponse.json(
      { error: "Failed to create signal" },
      { status: 500 }
    );
  }
}

/**
 * Check if there's a mutual match between two users
 */
async function checkMutualMatch(
  userId1: string,
  userId2: string
): Promise<boolean> {
  try {
    // This would typically query the database for signals between these users
    // For now, return false as a placeholder
    // In a real implementation, you would:
    // 1. Check if user1 has sent a signal to user2
    // 2. Check if user2 has sent a signal to user1
    // 3. If both exist, return true

    return false;
  } catch (error) {
    console.error("❌ Failed to check mutual match:", error);
    return false;
  }
}

/**
 * Get mutual matches for a user
 */
export async function findMutualMatches(userId: string): Promise<any[]> {
  try {
    // This would typically query the database for mutual matches
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error("❌ Failed to find mutual matches:", error);
    return [];
  }
}

/**
 * Accept or reject a signal
 */
export async function updateSignalStatus(
  signalId: string,
  status: "accepted" | "rejected",
  userId: string
): Promise<boolean> {
  try {
    // This would typically update the signal in the database
    console.log(
      `✅ Signal ${signalId} status updated to ${status} by ${userId}`
    );
    return true;
  } catch (error) {
    console.error("❌ Failed to update signal status:", error);
    return false;
  }
}
