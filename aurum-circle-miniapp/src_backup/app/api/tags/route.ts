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
    const userId = searchParams.get("userId");
    const includeCompatibility =
      searchParams.get("includeCompatibility") === "true";

    console.log("🏷️ Fetching tags for user:", {
      worldId: (payload.worldId as string).substring(0, 10) + "...",
      userId,
      includeCompatibility,
    });

    // TODO: Fetch user's tags from database
    // For now, return all available mystic tags
    const tags = includeCompatibility
      ? addCompatibilityScores(MYSTIC_TAGS)
      : MYSTIC_TAGS;

    return NextResponse.json({
      success: true,
      data: {
        tags,
        count: tags.length,
        available: true,
      },
    });
  } catch (error) {
    console.error("💥 Tags fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tags",
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
    const { birthData, forceRegenerate = false } = body;

    if (!birthData) {
      return NextResponse.json(
        { success: false, message: "Birth data is required" },
        { status: 400 }
      );
    }

    // Convert and validate birth data
    const parsedBirthData: BirthData = {
      date: new Date(birthData.date),
      timezone: birthData.timezone,
      isPrivate: birthData.isPrivate ?? true,
    };

    // Validate birth data
    const validation = validateBirthData(parsedBirthData);
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
    const baziData = calculateBaZi(parsedBirthData);

    console.log("🏷️ Generated tags for user:", {
      worldId: (payload.worldId as string).substring(0, 10) + "...",
      birthDate: parsedBirthData.date.toISOString(),
      tags: baziData.mysticTags.map((tag) => tag.name),
      forceRegenerate,
    });

    // TODO: Store user's tags in database
    // For now, just return the calculated tags

    return NextResponse.json({
      success: true,
      data: {
        tags: baziData.mysticTags,
        baziData,
        birthData: parsedBirthData,
        calculatedAt: new Date().toISOString(),
        forceRegenerated: forceRegenerate,
      },
    });
  } catch (error) {
    console.error("💥 Tags generation error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to generate tags",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate tags",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// Helper function to add compatibility scores between tags
function addCompatibilityScores(tags: typeof MYSTIC_TAGS) {
  const tagsWithCompatibility = tags.map((tag) => ({
    ...tag,
    compatibility: {} as Record<string, number>,
  }));

  // Calculate compatibility scores between all tag pairs
  for (let i = 0; i < tagsWithCompatibility.length; i++) {
    for (let j = 0; j < tagsWithCompatibility.length; j++) {
      if (i !== j) {
        const tag1 = tagsWithCompatibility[i];
        const tag2 = tagsWithCompatibility[j];

        let score = 50; // Base compatibility

        // Same element bonus
        if (tag1.element === tag2.element) {
          score += 30;
        }

        // Element generation bonus
        const elementRelationships = {
          fire: "earth",
          earth: "metal",
          metal: "water",
          water: "wood",
          wood: "fire",
        };

        if (elementRelationships[tag1.element] === tag2.element) {
          score += 20;
        }

        // Element overcoming bonus
        const elementOvercoming = {
          fire: "metal",
          metal: "wood",
          wood: "earth",
          earth: "water",
          water: "fire",
        };

        if (elementOvercoming[tag1.element] === tag2.element) {
          score += 10;
        }

        // Same type bonus
        if (tag1.type === tag2.type) {
          score += 15;
        }

        tag1.compatibility[tag2.id] = Math.min(100, Math.max(0, score));
      }
    }
  }

  return tagsWithCompatibility;
}
