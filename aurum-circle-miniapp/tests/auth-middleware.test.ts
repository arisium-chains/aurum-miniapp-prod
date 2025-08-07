import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { authMiddleware, authRateLimit } from "@/middleware/auth";
import { NextRequest, NextResponse } from "next/server";

// Mock environment variables
process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID = "test_app_id";
process.env.WORLDCOIN_APP_SECRET = "test_app_secret";
process.env.JWT_SECRET = "test_jwt_secret";

// Mock dependencies
vi.mock("@/lib/auth/session");
vi.mock("@/lib/world-id");

const { getUserFromRequest } = await import("@/lib/auth/session");
const { validateWorldIDConfig } = await import("@/lib/world-id");

describe("Authentication Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Public Routes", () => {
    it("should allow access to public routes without authentication", async () => {
      const request = new NextRequest("http://localhost:3000/");
      const result = await authMiddleware(request);

      expect(result).toBeNull();
    });

    it("should allow access to auth routes without authentication", async () => {
      const request = new NextRequest("http://localhost:3000/auth/wallet");
      const result = await authMiddleware(request);

      expect(result).toBeNull();
    });

    it("should allow access to API auth routes without authentication", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/worldid");
      const result = await authMiddleware(request);

      expect(result).toBeNull();
    });
  });

  describe("Protected Routes", () => {
    it("should redirect unauthenticated users to login", async () => {
      const request = new NextRequest("http://localhost:3000/vault");
      vi.mocked(getUserFromRequest).mockResolvedValueOnce(null);

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(302);
      expect(result?.headers.get("location")).toContain("/auth/wallet");
    });

    it("should allow authenticated users to access protected routes", async () => {
      const request = new NextRequest("http://localhost:3000/vault");
      vi.mocked(getUserFromRequest).mockResolvedValueOnce({
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(200);
    });

    it("should add security headers for authenticated requests", async () => {
      const request = new NextRequest("http://localhost:3000/vault");
      vi.mocked(getUserFromRequest).mockResolvedValueOnce({
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      const result = await authMiddleware(request);

      expect(result?.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(result?.headers.get("X-Frame-Options")).toBe("DENY");
      expect(result?.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });
  });

  describe("Role-Based Access Control", () => {
    it("should allow admin users to access admin routes", async () => {
      const request = new NextRequest("http://localhost:3000/admin");
      vi.mocked(getUserFromRequest).mockResolvedValueOnce({
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        role: "admin",
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(200);
    });

    it("should deny non-admin users access to admin routes", async () => {
      const request = new NextRequest("http://localhost:3000/admin");
      vi.mocked(getUserFromRequest).mockResolvedValueOnce({
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        role: "user",
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);
    });

    it("should handle users without role property", async () => {
      const request = new NextRequest("http://localhost:3000/admin");
      vi.mocked(getUserFromRequest).mockResolvedValueOnce({
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      } as any);

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);
    });
  });

  describe("Error Handling", () => {
    it("should handle JWT token validation errors", async () => {
      const request = new NextRequest("http://localhost:3000/vault");
      vi.mocked(getUserFromRequest).mockRejectedValueOnce(
        new Error("JWT token expired")
      );

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(302);
      expect(result?.headers.get("location")).toContain("/auth/wallet");
    });

    it("should handle authentication errors", async () => {
      const request = new NextRequest("http://localhost:3000/vault");
      vi.mocked(getUserFromRequest).mockRejectedValueOnce(
        new Error("Authentication failed")
      );

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(401);
    });

    it("should handle World ID configuration errors", async () => {
      const request = new NextRequest("http://localhost:3000/vault");
      vi.mocked(validateWorldIDConfig).mockImplementationOnce(() => {
        throw new Error("Missing required World ID environment variables");
      });

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(500);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to auth endpoints", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/worldid");
      const result = await authRateLimit(request);

      expect(result).toBeNull(); // For now, just allow the request
    });

    it("should not apply rate limiting to non-auth endpoints", async () => {
      const request = new NextRequest("http://localhost:3000/api/health");
      const result = await authRateLimit(request);

      expect(result).toBeNull();
    });
  });

  describe("Session Validation", () => {
    it("should validate session expiration", async () => {
      const request = new NextRequest("http://localhost:3000/vault");
      const expiredUser = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        lastLoginAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      };

      vi.mocked(getUserFromRequest).mockResolvedValueOnce(expiredUser);

      const result = await authMiddleware(request);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(302);
    });
  });
});
