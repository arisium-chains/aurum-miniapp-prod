import { NextRequest, NextResponse } from "next/server";
import { verifyWorldIDProof } from "@/lib/world-id";
import { SignJWT } from "jose";
import { validateWorldIDConfig } from "@/lib/world-id";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    // Validate World ID configuration
    validateWorldIDConfig();

    const body = await request.json();

    console.log("🔍 Processing World ID callback:", {
      app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
      nullifier_hash: body.nullifier_hash?.substring(0, 10) + "...",
      verification_level: body.verification_level,
    });

    // Verify the World ID proof server-side
    const verificationResult = await verifyWorldIDProof({
      nullifier_hash: body.nullifier_hash,
      merkle_root: body.merkle_root,
      proof: body.proof,
      verification_level: body.verification_level,
    });

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            verificationResult.data?.detail || "World ID verification failed",
          error: "VERIFICATION_FAILED",
        },
        { status: 400 }
      );
    }

    // Create a session token for the verified user
    const sessionToken = await new SignJWT({
      worldId: body.nullifier_hash,
      verificationLevel: body.verification_level,
      verifiedAt: new Date().toISOString(),
      action: "verify-human",
      verificationResult: verificationResult.data,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // 24-hour expiration as required
      .sign(secret);

    // Set secure cookie
    const responseObj = NextResponse.json({
      success: true,
      message: "World ID verified successfully",
      data: {
        nullifier_hash: body.nullifier_hash,
        verification_level: body.verification_level,
        verification_result: verificationResult.data,
      },
    });

    responseObj.cookies.set("worldid-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Add security headers
    responseObj.headers.set("X-Content-Type-Options", "nosniff");
    responseObj.headers.set("X-Frame-Options", "DENY");
    responseObj.headers.set("X-XSS-Protection", "1; mode=block");

    console.log("✅ World ID verification successful");
    return responseObj;
  } catch (error) {
    console.error("💥 World ID callback error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (
        error.message.includes(
          "Missing required World ID environment variables"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Server configuration error",
            error: "SERVER_CONFIG_ERROR",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: error.message,
          error: "VERIFICATION_ERROR",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin":
        process.env.NODE_ENV === "production"
          ? process.env.CORS_ORIGIN || "https://aurum-circle.com"
          : "http://localhost:3000",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
