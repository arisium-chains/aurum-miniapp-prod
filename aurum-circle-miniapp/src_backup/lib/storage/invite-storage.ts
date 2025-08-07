import { getR2Client } from "./r2-client";
import { z } from "zod";

// Invite Code Schema
const inviteCodeSchema = z.object({
  code: z.string(),
  userId: z.string(),
  isUsed: z.boolean(),
  usedBy: z.string().optional(),
  usedAt: z.date().optional(),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

const inviteClaimSchema = z.object({
  id: z.string(),
  inviteCode: z.string(),
  userId: z.string(),
  claimedAt: z.date(),
  ipAddress: z.string(),
});

export interface InviteCode {
  code: string;
  userId: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface InviteClaim {
  id: string;
  inviteCode: string;
  userId: string;
  claimedAt: Date;
  ipAddress: string;
}

export interface InviteCreateData {
  userId: string;
  expiresAt?: Date;
}

export interface InviteRedeemData {
  code: string;
  userId: string;
  ipAddress: string;
}

export class InviteStorage {
  private r2Client = getR2Client();
  private readonly INVITE_PREFIX = "invites/";
  private readonly CLAIM_PREFIX = "invite-claims/";
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a unique invite code
   */
  private generateInviteCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Store an invite code in R2
   */
  async storeInviteCode(inviteCode: InviteCode): Promise<void> {
    try {
      // Validate the invite code data
      const validatedInvite = inviteCodeSchema.parse(inviteCode);

      // Add metadata for easier querying
      const metadata = {
        "user-id": inviteCode.userId,
        "is-used": inviteCode.isUsed.toString(),
        "created-at": inviteCode.createdAt.toISOString(),
        "expires-at": inviteCode.expiresAt?.toISOString() || "",
      };

      await this.r2Client.storeJson(
        `${this.INVITE_PREFIX}${inviteCode.code}`,
        validatedInvite,
        {
          metadata,
          cacheControl: "public, max-age=3600", // Cache for 1 hour
        }
      );

      console.log(`✅ Invite code stored: ${inviteCode.code}`);
    } catch (error) {
      console.error("❌ Failed to store invite code:", error);
      throw new Error(
        `Failed to store invite code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieve an invite code from R2
   */
  async getInviteCode(code: string): Promise<InviteCode | null> {
    try {
      const invite = await this.r2Client.getJson<InviteCode>(
        `${this.INVITE_PREFIX}${code}`
      );

      if (!invite) {
        return null;
      }

      // Validate the retrieved invite
      const validatedInvite = inviteCodeSchema.parse(invite);
      return validatedInvite;
    } catch (error) {
      console.error("❌ Failed to get invite code:", error);
      throw new Error(
        `Failed to get invite code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get all invite codes for a user
   */
  async getUserInviteCodes(userId: string): Promise<InviteCode[]> {
    try {
      const result = await this.r2Client.listObjects({
        prefix: this.INVITE_PREFIX,
        maxKeys: 100,
      });

      const userInvites: InviteCode[] = [];

      for (const obj of result.objects) {
        if (obj.key.startsWith(this.INVITE_PREFIX)) {
          try {
            const invite = await this.r2Client.getJson<InviteCode>(obj.key);
            if (invite && invite.userId === userId) {
              const validatedInvite = inviteCodeSchema.parse(invite);
              userInvites.push(validatedInvite);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse invite ${obj.key}:`, error);
          }
        }
      }

      // Sort by creation date (newest first)
      return userInvites.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error("❌ Failed to get user invite codes:", error);
      throw new Error(
        `Failed to get user invite codes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create a new invite code for a user
   */
  async createInviteCode(data: InviteCreateData): Promise<InviteCode> {
    try {
      // Check if user has reached the 3-code limit
      const existingInvites = await this.getUserInviteCodes(data.userId);
      if (existingInvites.length >= 3) {
        throw new Error("Maximum 3 invite codes per user allowed");
      }

      const inviteCode: InviteCode = {
        code: this.generateInviteCode(),
        userId: data.userId,
        isUsed: false,
        createdAt: new Date(),
        expiresAt: data.expiresAt,
      };

      await this.storeInviteCode(inviteCode);
      return inviteCode;
    } catch (error) {
      console.error("❌ Failed to create invite code:", error);
      throw new Error(
        `Failed to create invite code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Redeem an invite code
   */
  async redeemInviteCode(data: InviteRedeemData): Promise<InviteCode> {
    try {
      const invite = await this.getInviteCode(data.code);
      if (!invite) {
        throw new Error("Invalid invite code");
      }

      if (invite.isUsed) {
        throw new Error("Invite code already used");
      }

      if (invite.expiresAt && new Date() > invite.expiresAt) {
        throw new Error("Invite code expired");
      }

      // Mark invite as used
      const updatedInvite: InviteCode = {
        ...invite,
        isUsed: true,
        usedBy: data.userId,
        usedAt: new Date(),
      };

      await this.storeInviteCode(updatedInvite);

      // Log the redemption
      await this.logInviteClaim({
        id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inviteCode: data.code,
        userId: data.userId,
        claimedAt: new Date(),
        ipAddress: data.ipAddress,
      });

      console.log(
        `✅ Invite code redeemed: ${data.code} by user ${data.userId}`
      );
      return updatedInvite;
    } catch (error) {
      console.error("❌ Failed to redeem invite code:", error);
      throw new Error(
        `Failed to redeem invite code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Log an invite claim
   */
  private async logInviteClaim(claim: InviteClaim): Promise<void> {
    try {
      await this.r2Client.storeJson(`${this.CLAIM_PREFIX}${claim.id}`, claim, {
        metadata: {
          "invite-code": claim.inviteCode,
          "user-id": claim.userId,
          "claimed-at": claim.claimedAt.toISOString(),
        },
        cacheControl: "no-cache, no-store, must-revalidate",
      });
    } catch (error) {
      console.error("❌ Failed to log invite claim:", error);
      // Don't throw here as this is not critical to the redemption process
    }
  }

  /**
   * Get invite claims for an invite code
   */
  async getInviteClaims(inviteCode: string): Promise<InviteClaim[]> {
    try {
      const result = await this.r2Client.listObjects({
        prefix: this.CLAIM_PREFIX,
        maxKeys: 100,
      });

      const claims: InviteClaim[] = [];

      for (const obj of result.objects) {
        if (obj.key.startsWith(this.CLAIM_PREFIX)) {
          try {
            const claim = await this.r2Client.getJson<InviteClaim>(obj.key);
            if (claim && claim.inviteCode === inviteCode) {
              const validatedClaim = inviteClaimSchema.parse(claim);
              claims.push(validatedClaim);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse claim ${obj.key}:`, error);
          }
        }
      }

      // Sort by claim date (newest first)
      return claims.sort(
        (a, b) => b.claimedAt.getTime() - a.claimedAt.getTime()
      );
    } catch (error) {
      console.error("❌ Failed to get invite claims:", error);
      throw new Error(
        `Failed to get invite claims: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete an invite code
   */
  async deleteInviteCode(code: string): Promise<void> {
    try {
      await this.r2Client.delete(`${this.INVITE_PREFIX}${code}`);
      console.log(`✅ Invite code deleted: ${code}`);
    } catch (error) {
      console.error("❌ Failed to delete invite code:", error);
      throw new Error(
        `Failed to delete invite code ${code}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if an invite code is valid and available
   */
  async isInviteCodeValid(code: string): Promise<boolean> {
    try {
      const invite = await this.getInviteCode(code);
      if (!invite) {
        return false;
      }

      if (invite.isUsed) {
        return false;
      }

      if (invite.expiresAt && new Date() > invite.expiresAt) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to check invite code validity:", error);
      return false;
    }
  }

  /**
   * Get all invite codes (for admin purposes)
   */
  async getAllInviteCodes(
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ invites: InviteCode[]; total: number }> {
    try {
      const { limit = 100, offset = 0 } = options;

      const result = await this.r2Client.listObjects({
        prefix: this.INVITE_PREFIX,
        maxKeys: limit + offset,
      });

      const invites: InviteCode[] = [];

      for (const obj of result.objects) {
        if (obj.key.startsWith(this.INVITE_PREFIX)) {
          try {
            const invite = await this.r2Client.getJson<InviteCode>(obj.key);
            if (invite) {
              const validatedInvite = inviteCodeSchema.parse(invite);
              invites.push(validatedInvite);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse invite ${obj.key}:`, error);
          }
        }
      }

      // Apply offset and limit
      const paginatedInvites = invites.slice(offset, offset + limit);

      return {
        invites: paginatedInvites,
        total: invites.length,
      };
    } catch (error) {
      console.error("❌ Failed to get all invite codes:", error);
      throw new Error(
        `Failed to get all invite codes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Health check for invite storage
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic R2 connectivity
      const isHealthy = await this.r2Client.healthCheck();

      if (!isHealthy) {
        return false;
      }

      // Test invite operations
      const testCode = `TEST_${Date.now()}`;
      const testInvite: InviteCode = {
        code: testCode,
        userId: "test-user",
        isUsed: false,
        createdAt: new Date(),
      };

      await this.storeInviteCode(testInvite);
      const retrievedInvite = await this.getInviteCode(testCode);

      if (!retrievedInvite) {
        return false;
      }

      await this.deleteInviteCode(testCode);

      return true;
    } catch (error) {
      console.error("❌ Invite storage health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
let inviteStorageInstance: InviteStorage | null = null;

export function getInviteStorage(): InviteStorage {
  if (!inviteStorageInstance) {
    inviteStorageInstance = new InviteStorage();
  }
  return inviteStorageInstance;
}

// Export for direct use
export default InviteStorage;
