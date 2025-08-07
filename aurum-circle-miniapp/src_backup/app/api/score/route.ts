import { NextRequest, NextResponse } from "next/server";
import { storeScore, getScore, canUserScore } from "@/lib/mock-score-storage";
import {
  generateMockScore,
  validateMockScore,
} from "@/lib/mock-score-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body || !body.userId || !body.sessionId || !body.imageData) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, session ID, and image data are required",
          error_type: "validation_error",
        },
        { status: 400 }
      );
    }

    const { userId, sessionId, imageData } = body;

    // Check if user can score (prevention logic)
    const canScore = await canUserScore(userId, sessionId);
    if (!canScore) {
      return NextResponse.json(
        {
          success: false,
          message: "Score already exists for this session",
          error_type: "duplicate_score_error",
        },
        { status: 409 }
      );
    }

    // Store the score (this will generate and store the mock score)
    const scoreResult = await storeScore(userId, sessionId, imageData);

    // Validate the generated score
    if (!validateMockScore(scoreResult)) {
      throw new Error("Invalid mock score generated");
    }

    // Calculate percentile
    const percentile = Math.round((scoreResult.totalScore / 100) * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        userId,
        sessionId,
        score: scoreResult.totalScore,
        percentile,
        components: scoreResult.components,
        processingTime: scoreResult.processingTime,
        timestamp: scoreResult.timestamp,
      },
      message: "Mock score generated successfully",
    });
  } catch (error: any) {
    console.error("Mock score generation error:", error);

    // Handle validation errors
    if (error.message && error.message.includes("required")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          error_type: "validation_error",
        },
        { status: 400 }
      );
    }

    if (error.message && error.message.includes("already exists")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          error_type: "duplicate_score_error",
        },
        { status: 409 }
      );
    }

    if (error.message && error.message.includes("Invalid mock score")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          error_type: "generation_error",
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during mock score generation",
        error_type: "processing_error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and session ID are required",
          error_type: "validation_error",
        },
        { status: 400 }
      );
    }

    // Get existing score for this session
    const storedScore = await getScore(userId, sessionId);

    if (!storedScore) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No score found for this session",
      });
    }

    // Calculate percentile
    const percentile =
      Math.round((storedScore.score.totalScore / 100) * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        userId,
        sessionId,
        score: storedScore.score.totalScore,
        percentile,
        components: storedScore.score.components,
        processingTime: storedScore.score.processingTime,
        timestamp: storedScore.score.timestamp,
        createdAt: storedScore.createdAt,
        expiresAt: storedScore.expiresAt,
      },
      message: "Score retrieved successfully",
    });
  } catch (error: any) {
    console.error("Error retrieving score:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while retrieving score",
        error_type: "processing_error",
      },
      { status: 500 }
    );
  }
}
