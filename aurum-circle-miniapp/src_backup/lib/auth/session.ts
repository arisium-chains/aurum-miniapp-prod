import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "24h"; // Updated to 24-hour expiration as required

export interface User {
  id: string;
  worldId: string;
  walletAddress?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export async function createJWTToken(user: User): Promise<string> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const alg = "HS256";

    const jwtPayload = {
      sub: user.id,
      worldId: user.worldId,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    const token = await new jwt.SignJWT(jwtPayload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    return token;
  } catch (error) {
    console.error("❌ Failed to create JWT token:", error);
    throw new Error("Failed to create authentication token");
  }
}

export async function verifyJWTToken(token: string): Promise<User | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwt.jwtVerify(token, secret);

    const user: User = {
      id: payload.sub as string,
      worldId: payload.worldId as string,
      walletAddress: payload.walletAddress as string,
      isVerified: payload.isVerified as boolean,
      createdAt: new Date((payload.iat || Date.now() / 1000) * 1000),
      lastLoginAt: new Date(),
    };

    return user;
  } catch (error) {
    console.error("❌ Failed to verify JWT token:", error);
    return null;
  }
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    const user = await verifyJWTToken(token);
    return user;
  } catch (error) {
    console.error("❌ Failed to get user from request:", error);
    return null;
  }
}

export async function setUserSession(
  response: NextResponse,
  user: User
): Promise<NextResponse> {
  try {
    const token = await createJWTToken(user);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    };

    response.cookies.set("auth-token", token, cookieOptions);
    return response;
  } catch (error) {
    console.error("❌ Failed to set user session:", error);
    throw new Error("Failed to create user session");
  }
}

export async function clearUserSession(
  response: NextResponse
): Promise<NextResponse> {
  try {
    response.cookies.delete("auth-token");
    return response;
  } catch (error) {
    console.error("❌ Failed to clear user session:", error);
    throw new Error("Failed to clear user session");
  }
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const user = await getUserFromRequest(request);
    return user !== null;
  } catch (error) {
    console.error("❌ Failed to check authentication:", error);
    return false;
  }
}

export async function requireAuth(request: NextRequest): Promise<User> {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw new Error("Authentication required");
    }
    return user;
  } catch (error) {
    console.error("❌ Authentication required:", error);
    throw new Error("Authentication required");
  }
}
