import { NextRequest, NextResponse } from "next/server";
import { resetScoreHistory } from "@/lib/mock-score-storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
          error_type: "validation_error",
        },
        { status: 400 }
      );
    }

    const { userId } = body;

    // Reset user score history
    await resetScoreHistory(userId);

    return NextResponse.json({
      success: true,
      message: "Score history reset successfully",
      data: {
        userId,
        resetAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error resetting score history:", error);

    // Handle specific errors
    if (error.message && error.message.includes("does not exist")) {
      return NextResponse.json(
        {
          success: false,
          message: "No score history found for this user",
          error_type: "not_found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while resetting score history",
        error_type: "processing_error",
      },
      { status: 500 }
    );
  }
}
