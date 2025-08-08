import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { calculateBaZi, validateBirthData } from "@/lib/bazi-utils";
import { BirthData, MYSTIC_TAGS } from "@/types/bazi";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("targetUserId");
    const compatibilityThreshold = parseInt(
      searchParams.get("compatibilityThreshold") || "70"
    );

    console.log("🔮 Checking tag compatibility for user:", {
      worldId: (payload.worldId as string).substring(0, 10) + "...",
      targetUserId,
      compatibilityThreshold,
    });

    // TODO: Fetch both users' tags from database
    // For now, simulate with mock data

    // Mock current user tags (would be fetched from database)
    const currentUserTags = [
      {
        id: "phoenix",
        name: "Phoenix",
        element: "fire",
        type: "celestial" as const,
        emoji: "🦅",
        description: "Reborn from ashes, passionate and transformative",
        compatibility: {},
      },
      {
        id: "lotus",
        name: "Lotus",
        element: "water",
        type: "terrestrial" as const,
        emoji: "🪷",
        description: "Pure and elegant, rising above challenges",
        compatibility: {},
      },
    ];

    // Mock target user tags (would be fetched from database)
    const targetUserTags = [
      {
        id: "dragon",
        name: "Dragon",
        element: "earth",
        type: "celestial" as const,
        emoji: "🐉",
        description: "Mighty and wise, natural leader",
        compatibility: {},
      },
      {
        id: "bamboo",
        name: "Bamboo",
        element: "wood",
        type: "terrestrial" as const,
        emoji: "🎋",
        description: "Flexible yet strong, adaptable and resilient",
        compatibility: {},
      },
    ];

    // Calculate compatibility scores
    const compatibilityResults = calculateTagCompatibility(
      currentUserTags,
      targetUserTags
    );
    const overallScore = calculateOverallCompatibility(compatibilityResults);

    console.log("🔮 Compatibility results:", {
      overallScore,
      compatibilityResults,
      isCompatible: overallScore >= compatibilityThreshold,
    });

    return NextResponse.json({
      success: true,
      data: {
        compatibility: {
          overallScore,
          threshold: compatibilityThreshold,
          isCompatible: overallScore >= compatibilityThreshold,
          details: compatibilityResults,
        },
        currentUserTags,
        targetUserTags,
        recommendation: generateCompatibilityRecommendation(
          overallScore,
          compatibilityResults
        ),
      },
    });
  } catch (error) {
    console.error("💥 Tag compatibility check error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to check tag compatibility",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

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
    const { targetUserId, birthData: targetBirthData } = body;

    if (!targetUserId || !targetBirthData) {
      return NextResponse.json(
        {
          success: false,
          message: "Target user ID and birth data are required",
        },
        { status: 400 }
      );
    }

    // Convert and validate target birth data
    const parsedTargetBirthData: BirthData = {
      date: new Date(targetBirthData.date),
      timezone: targetBirthData.timezone,
      isPrivate: targetBirthData.isPrivate ?? true,
    };

    // Validate birth data
    const validation = validateBirthData(parsedTargetBirthData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid target birth data",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Calculate BaZi data for target user
    const targetBaziData = calculateBaZi(parsedTargetBirthData);

    // TODO: Fetch current user's tags from database
    // For now, simulate with mock data
    const currentUserTags = [
      {
        id: "phoenix",
        name: "Phoenix",
        element: "fire",
        type: "celestial" as const,
        emoji: "🦅",
        description: "Reborn from ashes, passionate and transformative",
        compatibility: {},
      },
      {
        id: "lotus",
        name: "Lotus",
        element: "water",
        type: "terrestrial" as const,
        emoji: "🪷",
        description: "Pure and elegant, rising above challenges",
        compatibility: {},
      },
    ];

    // Calculate compatibility with target user's tags
    const compatibilityResults = calculateTagCompatibility(
      currentUserTags,
      targetBaziData.mysticTags
    );
    const overallScore = calculateOverallCompatibility(compatibilityResults);

    console.log("🔮 Tag-based match analysis:", {
      worldId: (payload.worldId as string).substring(0, 10) + "...",
      targetUserId,
      overallScore,
      targetTags: targetBaziData.mysticTags.map((tag) => tag.name),
    });

    return NextResponse.json({
      success: true,
      data: {
        matchScore: overallScore,
        compatibility: {
          overallScore,
          details: compatibilityResults,
        },
        currentUserTags,
        targetUserTags: targetBaziData.mysticTags,
        targetBaziData,
        recommendation: generateCompatibilityRecommendation(
          overallScore,
          compatibilityResults
        ),
        matchFactors: analyzeMatchFactors(
          currentUserTags,
          targetBaziData.mysticTags
        ),
      },
    });
  } catch (error) {
    console.error("💥 Tag-based matching error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to perform tag-based matching",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform tag-based matching",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// Helper functions for tag compatibility calculations

function calculateTagCompatibility(
  user1Tags: Array<{ element: string; type: string; name?: string }>,
  user2Tags: Array<{ element: string; type: string; name?: string }>
) {
  const results: Array<{
    tag1: string;
    tag2: string;
    score: number;
    reason: string;
  }> = [];

  user1Tags.forEach((tag1) => {
    user2Tags.forEach((tag2) => {
      let score = 50; // Base compatibility
      let reason = "Neutral compatibility";

      // Same element bonus
      if (tag1.element === tag2.element) {
        score += 30;
        reason = "Strong connection - same element";
      }

      // Element generation bonus
      const elementRelationships: Record<string, string> = {
        fire: "earth",
        earth: "metal",
        metal: "water",
        water: "wood",
        wood: "fire",
      };

      if (elementRelationships[tag1.element] === tag2.element) {
        score += 20;
        reason = "Harmonious connection - element generation";
      }

      // Element overcoming bonus
      const elementOvercoming: Record<string, string> = {
        fire: "metal",
        metal: "wood",
        wood: "earth",
        earth: "water",
        water: "fire",
      };

      if (elementOvercoming[tag1.element] === tag2.element) {
        score += 10;
        reason = "Dynamic connection - element overcoming";
      }

      // Same type bonus
      if (tag1.type === tag2.type) {
        score += 15;
        reason += " + Same type affinity";
      }

      const finalScore = Math.min(100, Math.max(0, score));
      results.push({
        tag1: tag1.name || tag1.element,
        tag2: tag2.name || tag2.element,
        score: finalScore,
        reason,
      });
    });
  });

  return results;
}

function calculateOverallCompatibility(compatibilityResults: any[]) {
  if (compatibilityResults.length === 0) return 0;

  const totalScore = compatibilityResults.reduce(
    (sum, result) => sum + result.score,
    0
  );
  return Math.round(totalScore / compatibilityResults.length);
}

function generateCompatibilityRecommendation(
  overallScore: number,
  details: any[]
) {
  if (overallScore >= 80) {
    return {
      level: "Excellent",
      message:
        "Your BaZi elements are highly compatible! This suggests strong potential for harmony and mutual growth.",
      color: "text-green-600",
    };
  } else if (overallScore >= 65) {
    return {
      level: "Good",
      message:
        "Your BaZi elements show good compatibility with some areas for growth and understanding.",
      color: "text-blue-600",
    };
  } else if (overallScore >= 50) {
    return {
      level: "Moderate",
      message:
        "Your BaZi elements have neutral compatibility. Understanding and communication will be key.",
      color: "text-yellow-600",
    };
  } else {
    return {
      level: "Challenging",
      message:
        "Your BaZi elements have low compatibility, but this can lead to personal growth and balance.",
      color: "text-orange-600",
    };
  }
}

function analyzeMatchFactors(
  user1Tags: Array<{ element: string; type: string }>,
  user2Tags: Array<{ element: string; type: string }>
) {
  const factors = {
    elementBalance: {
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0,
      wood: 0,
    } as Record<string, number>,
    typeDistribution: { celestial: 0, terrestrial: 0, elemental: 0 } as Record<
      string,
      number
    >,
    harmoniousPairs: 0,
    challengingPairs: 0,
  };

  // Count elements and types
  [...user1Tags, ...user2Tags].forEach((tag) => {
    factors.elementBalance[tag.element] =
      (factors.elementBalance[tag.element] || 0) + 1;
    factors.typeDistribution[tag.type] =
      (factors.typeDistribution[tag.type] || 0) + 1;
  });

  // Analyze pair relationships
  const compatibilityResults = calculateTagCompatibility(user1Tags, user2Tags);
  compatibilityResults.forEach((result) => {
    if (result.score >= 70) factors.harmoniousPairs++;
    else if (result.score < 50) factors.challengingPairs++;
  });

  return factors;
}
