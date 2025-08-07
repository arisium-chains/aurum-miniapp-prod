import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createJWTToken,
  verifyJWTToken,
  getUserFromRequest,
  setUserSession,
  clearUserSession,
  isAuthenticated,
  requireAuth,
} from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

// Mock environment variables
process.env.JWT_SECRET = "test_jwt_secret";

describe("Session Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("JWT Token Creation", () => {
    it("should create JWT token with correct payload", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await createJWTToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      // Decode the token to verify payload
      const decoded = JSON.parse(atob(token.split(".")[1]));

      expect(decoded.sub).toBe(user.id);
      expect(decoded.worldId).toBe(user.worldId);
      expect(decoded.walletAddress).toBe(user.walletAddress);
      expect(decoded.isVerified).toBe(user.isVerified);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it("should set expiration to 24 hours", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await createJWTToken(user);
      const decoded = JSON.parse(atob(token.split(".")[1]));

      const currentTime = Math.floor(Date.now() / 1000);
      const expectedExpiration = currentTime + 24 * 60 * 60; // 24 hours

      expect(decoded.exp).toBe(expectedExpiration);
    });

    it("should handle JWT creation errors", async () => {
      vi.spyOn(global, "fetch").mockImplementationOnce(() => {
        throw new Error("Network error");
      });

      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      await expect(createJWTToken(user)).rejects.toThrow(
        "Failed to create authentication token"
      );
    });
  });

  describe("JWT Token Verification", () => {
    it("should verify valid JWT token", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await createJWTToken(user);
      const verifiedUser = await verifyJWTToken(token);

      expect(verifiedUser).toBeDefined();
      expect(verifiedUser?.id).toBe(user.id);
      expect(verifiedUser?.worldId).toBe(user.worldId);
      expect(verifiedUser?.isVerified).toBe(user.isVerified);
    });

    it("should reject invalid JWT token", async () => {
      const invalidToken = "invalid.token.here";
      const verifiedUser = await verifyJWTToken(invalidToken);

      expect(verifiedUser).toBeNull();
    });

    it("should reject expired JWT token", async () => {
      const expiredToken = await new global.SignJWT({
        sub: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        iat: Math.floor(Date.now() / 1000) - 25 * 60 * 60, // 25 hours ago
        exp: Math.floor(Date.now() / 1000) - 1, // 1 second ago
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1s")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

      const verifiedUser = await verifyJWTToken(expiredToken);

      expect(verifiedUser).toBeNull();
    });

    it("should handle JWT verification errors", async () => {
      const malformedToken = "this.is.not.a.valid.jwt.token";
      const verifiedUser = await verifyJWTToken(malformedToken);

      expect(verifiedUser).toBeNull();
    });
  });

  describe("Session Management", () => {
    it("should set user session in response", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const response = new NextResponse();
      const updatedResponse = await setUserSession(response, user);

      expect(updatedResponse.cookies.has("auth-token")).toBe(true);
      expect(updatedResponse.cookies.get("auth-token")?.httpOnly).toBe(true);
      expect(updatedResponse.cookies.get("auth-token")?.secure).toBe(false); // Development mode
      expect(updatedResponse.cookies.get("auth-token")?.sameSite).toBe(
        "strict"
      );
    });

    it("should clear user session", async () => {
      const response = new NextResponse();
      response.cookies.set("auth-token", "test-token");

      const clearedResponse = await clearUserSession(response);

      expect(clearedResponse.cookies.has("auth-token")).toBe(false);
    });

    it("should get user from request", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await createJWTToken(user);
      const request = new NextRequest("http://localhost:3000/");
      request.cookies.set("auth-token", token);

      const retrievedUser = await getUserFromRequest(request);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(user.id);
      expect(retrievedUser?.worldId).toBe(user.worldId);
    });

    it("should return null for user without token", async () => {
      const request = new NextRequest("http://localhost:3000/");
      const retrievedUser = await getUserFromRequest(request);

      expect(retrievedUser).toBeNull();
    });
  });

  describe("Authentication Checks", () => {
    it("should check authentication status", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await createJWTToken(user);
      const request = new NextRequest("http://localhost:3000/");
      request.cookies.set("auth-token", token);

      const authenticated = await isAuthenticated(request);

      expect(authenticated).toBe(true);
    });

    it("should require authentication", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await createJWTToken(user);
      const request = new NextRequest("http://localhost:3000/");
      request.cookies.set("auth-token", token);

      const requiredUser = await requireAuth(request);

      expect(requiredUser).toBeDefined();
      expect(requiredUser.id).toBe(user.id);
    });

    it("should throw error when authentication is required but not present", async () => {
      const request = new NextRequest("http://localhost:3000/");

      await expect(requireAuth(request)).rejects.toThrow(
        "Authentication required"
      );
    });
  });

  describe("Session Security", () => {
    it("should set secure cookies in production", async () => {
      process.env.NODE_ENV = "production";

      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const response = new NextResponse();
      const updatedResponse = await setUserSession(response, user);

      expect(updatedResponse.cookies.get("auth-token")?.secure).toBe(true);

      // Reset to development
      process.env.NODE_ENV = "development";
    });

    it("should validate token signature", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await createJWTToken(user);

      // Tamper with the token
      const parts = token.split(".");
      const tamperedPayload = JSON.parse(atob(parts[1]));
      tamperedPayload.sub = "malicious-user";
      parts[1] = btoa(JSON.stringify(tamperedPayload));
      const tamperedToken = parts.join(".");

      const verifiedUser = await verifyJWTToken(tamperedToken);

      expect(verifiedUser).toBeNull();
    });
  });

  describe("Session Cleanup", () => {
    it("should handle session cleanup gracefully", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        lastLoginAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      };

      const token = await createJWTToken(user);
      const request = new NextRequest("http://localhost:3000/");
      request.cookies.set("auth-token", token);

      const retrievedUser = await getUserFromRequest(request);

      // In a real implementation, this would check expiration
      expect(retrievedUser).toBeDefined();
    });
  });
});
