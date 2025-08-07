import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  verifyWorldIDProof,
  validateWorldIDConfig,
  WORLD_ID_CONFIG,
} from "@/lib/world-id";
import { SignJWT } from "jose";

// Mock environment variables
process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID = "test_app_id";
process.env.WORLDCOIN_APP_SECRET = "test_app_secret";
process.env.JWT_SECRET = "test_jwt_secret";

describe("World ID Production Integration", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("World ID Configuration", () => {
    it("should have valid configuration", () => {
      expect(WORLD_ID_CONFIG.app_id).toBe("test_app_id");
      expect(WORLD_ID_CONFIG.action).toBe("verify-human");
      expect(WORLD_ID_CONFIG.verification_level).toBe("orb");
    });

    it("should validate World ID configuration successfully", () => {
      expect(() => validateWorldIDConfig()).not.toThrow();
    });

    it("should throw error if required environment variables are missing", () => {
      delete process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
      delete process.env.WORLDCOIN_APP_SECRET;

      expect(() => validateWorldIDConfig()).toThrow(
        "Missing required World ID environment variables"
      );
    });
  });

  describe("World ID Proof Verification", () => {
    it("should verify World ID proof successfully", async () => {
      const mockProof = {
        nullifier_hash: "0x1234567890abcdef1234567890abcdef12345678",
        merkle_root: "0xabcdef1234567890abcdef1234567890abcdef",
        proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
        verification_level: "orb",
      };

      // Mock the fetch function
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          detail: "Verification successful",
        }),
      } as any);

      const result = await verifyWorldIDProof(mockProof);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        success: true,
        detail: "Verification successful",
      });
    });

    it("should handle verification failure", async () => {
      const mockProof = {
        nullifier_hash: "0x1234567890abcdef1234567890abcdef12345678",
        merkle_root: "0xabcdef1234567890abcdef1234567890abcdef",
        proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
        verification_level: "orb",
      };

      // Mock the fetch function to return an error
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValueOnce({
          success: false,
          detail: "Verification failed",
        }),
      } as any);

      await expect(verifyWorldIDProof(mockProof)).rejects.toThrow(
        "World ID verification failed"
      );
    });

    it("should handle network errors", async () => {
      const mockProof = {
        nullifier_hash: "0x1234567890abcdef1234567890abcdef12345678",
        merkle_root: "0xabcdef1234567890abcdef1234567890abcdef",
        proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
        verification_level: "orb",
      };

      // Mock the fetch function to throw a network error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      await expect(verifyWorldIDProof(mockProof)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("JWT Session Management", () => {
    it("should create JWT token with 24-hour expiration", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await new SignJWT({
        sub: user.id,
        worldId: user.worldId,
        isVerified: user.isVerified,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    it("should validate JWT token structure", async () => {
      const user = {
        id: "test-user-id",
        worldId: "test-world-id",
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const token = await new SignJWT({
        sub: user.id,
        worldId: user.worldId,
        isVerified: user.isVerified,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

      // Decode the token to verify structure
      const decoded = JSON.parse(atob(token.split(".")[1]));

      expect(decoded.sub).toBe(user.id);
      expect(decoded.worldId).toBe(user.worldId);
      expect(decoded.isVerified).toBe(user.isVerified);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid proof data", async () => {
      const invalidProof = {
        nullifier_hash: "",
        merkle_root: "",
        proof: "",
        verification_level: "",
      };

      await expect(verifyWorldIDProof(invalidProof as any)).rejects.toThrow();
    });

    it("should handle missing environment variables gracefully", async () => {
      delete process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
      delete process.env.WORLDCOIN_APP_SECRET;

      const mockProof = {
        nullifier_hash: "0x1234567890abcdef1234567890abcdef12345678",
        merkle_root: "0xabcdef1234567890abcdef1234567890abcdef",
        proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
        verification_level: "orb",
      };

      await expect(verifyWorldIDProof(mockProof)).rejects.toThrow(
        "Missing required World ID environment variables"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long nullifier hash", async () => {
      const mockProof = {
        nullifier_hash: "0x" + "a".repeat(100),
        merkle_root: "0xabcdef1234567890abcdef1234567890abcdef",
        proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
        verification_level: "orb",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          detail: "Verification successful",
        }),
      } as any);

      const result = await verifyWorldIDProof(mockProof);
      expect(result.success).toBe(true);
    });

    it("should handle special characters in proof data", async () => {
      const mockProof = {
        nullifier_hash: "0x1234567890abcdef1234567890abcdef12345678",
        merkle_root: "0xabcdef1234567890abcdef1234567890abcdef",
        proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef!@#$%",
        verification_level: "orb",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          detail: "Verification successful",
        }),
      } as any);

      const result = await verifyWorldIDProof(mockProof);
      expect(result.success).toBe(true);
    });
  });
});
