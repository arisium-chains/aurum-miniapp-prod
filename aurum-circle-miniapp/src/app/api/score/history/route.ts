import { NextRequest, NextResponse } from "next/server";
import { getScoreHistory } from "@/lib/mock-score-storage";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request (in a real app, this would come from authentication)
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
          error_type: "validation_error",
        },
        { status: 400 }
      );
    }

    // Get user score history
    const history = await getScoreHistory(userId);

    if (!history) {
      return NextResponse.json({
        success: true,
        data: {
          userId,
          scores: [],
          totalScores: 0,
          lastScoredAt: null,
        },
        message: "No score history found",
      });
    }

    return NextResponse.json({
      success: true,
      data: history,
      message: "Score history retrieved successfully",
    });
  } catch (error: any) {
    console.error("Error retrieving score history:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while retrieving score history",
        error_type: "processing_error",
      },
      { status: 500 }
    );
  }
}
