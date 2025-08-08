import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { calculateBaZi, validateBirthData } from "@/lib/bazi-utils";
import { BirthData } from "@/types/bazi";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

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
    const { birthData } = body;

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

    console.log("🔮 BaZi calculated for user:", {
      worldId: (payload.worldId as string).substring(0, 10) + "...",
      birthDate: parsedBirthData.date.toISOString(),
      timezone: parsedBirthData.timezone,
      tags: baziData.mysticTags.map((tag) => tag.name),
    });

    return NextResponse.json({
      success: true,
      data: {
        baziData,
        birthData: parsedBirthData,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("💥 BaZi calculation error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to calculate BaZi",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to calculate BaZi",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's BaZi data
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

    // TODO: Retrieve user's BaZi data from database
    // For now, return a mock response
    console.log("🔮 Retrieving BaZi data for user:", {
      worldId: (payload.worldId as string).substring(0, 10) + "...",
    });

    return NextResponse.json({
      success: true,
      data: {
        // Mock data - replace with actual database query
        baziData: null,
        birthData: null,
        calculatedAt: null,
        message:
          "BaZi data not found. Please provide birth data to calculate your BaZi profile.",
      },
    });
  } catch (error) {
    console.error("💥 BaZi retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve BaZi data",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
