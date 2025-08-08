import { getR2Client } from "./r2-client";
import { z } from "zod";

// User Profile Schema
const userProfileSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  walletAddress: z.string(),
  vibeTags: z.array(z.string()),
  profileImage: z.string(),
  bio: z.string(),
  university: z.string().optional(),
  graduationYear: z.number().optional(),
  isProfileComplete: z.boolean(),
  lastUpdatedAt: z.date(),
  verificationBadges: z.object({
    worldId: z.boolean(),
    nft: z.boolean(),
    score: z.boolean(),
  }),
  score: z
    .object({
      value: z.number(),
      percentile: z.number(),
      breakdown: z.object({
        facial: z.number(),
        university: z.number(),
        nft: z.number(),
      }),
      scoredAt: z.date(),
    })
    .optional(),
});

export interface UserProfile {
  id: string;
  worldId: string;
  walletAddress: string;
  vibeTags: string[];
  profileImage: string;
  bio: string;
  university?: string;
  graduationYear?: number;
  isProfileComplete: boolean;
  lastUpdatedAt: Date;
  verificationBadges: {
    worldId: boolean;
    nft: boolean;
    score: boolean;
  };
  score?: {
    value: number;
    percentile: number;
    breakdown: {
      facial: number;
      university: number;
      nft: number;
    };
    scoredAt: Date;
  };
}

export interface ProfileUpdateData {
  vibeTags?: string[];
  profileImage?: string;
  bio?: string;
  university?: string;
  graduationYear?: number;
  isProfileComplete?: boolean;
  verificationBadges?: Partial<UserProfile["verificationBadges"]>;
  score?: UserProfile["score"];
}

export class UserProfileStorage {
  private r2Client = getR2Client();
  private readonly PROFILE_PREFIX = "profiles/";
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Store a user profile in R2
   */
  async storeUserProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      // Validate the profile data
      const validatedProfile = userProfileSchema.parse(profile);

      // Add metadata for easier querying
      const metadata = {
        "user-id": userId,
        "world-id": profile.worldId,
        "wallet-address": profile.walletAddress,
        "is-complete": profile.isProfileComplete.toString(),
        "last-updated": profile.lastUpdatedAt.toISOString(),
      };

      await this.r2Client.storeJson(
        `${this.PROFILE_PREFIX}${userId}`,
        validatedProfile,
        {
          metadata,
          cacheControl: "no-cache, no-store, must-revalidate",
        }
      );

      console.log(`✅ Profile stored for user: ${userId}`);
    } catch (error) {
      console.error("❌ Failed to store user profile:", error);
      throw new Error(
        `Failed to store profile for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieve a user profile from R2
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await this.r2Client.getJson<UserProfile>(
        `${this.PROFILE_PREFIX}${userId}`
      );

      if (!profile) {
        return null;
      }

      // Validate the retrieved profile
      const validatedProfile = userProfileSchema.parse(profile);
      return validatedProfile;
    } catch (error) {
      console.error("❌ Failed to retrieve user profile:", error);
      throw new Error(
        `Failed to retrieve profile for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update a user profile partially
   */
  async updateUserProfile(
    userId: string,
    updateData: ProfileUpdateData
  ): Promise<UserProfile> {
    try {
      // Get existing profile
      const existingProfile = await this.getUserProfile(userId);
      const currentProfile =
        existingProfile || this.createDefaultProfile(userId);

      // Merge updates
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...updateData,
        lastUpdatedAt: new Date(),
        verificationBadges: {
          ...currentProfile.verificationBadges,
          ...updateData.verificationBadges,
        },
      };

      // Store the updated profile
      await this.storeUserProfile(userId, updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error("❌ Failed to update user profile:", error);
      throw new Error(
        `Failed to update profile for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete a user profile
   */
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      await this.r2Client.delete(`${this.PROFILE_PREFIX}${userId}`);
      console.log(`✅ Profile deleted for user: ${userId}`);
    } catch (error) {
      console.error("❌ Failed to delete user profile:", error);
      throw new Error(
        `Failed to delete profile for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if a user profile exists
   */
  async profileExists(userId: string): Promise<boolean> {
    try {
      return await this.r2Client.exists(`${this.PROFILE_PREFIX}${userId}`);
    } catch (error) {
      console.error("❌ Failed to check profile existence:", error);
      return false;
    }
  }

  /**
   * Get all user profiles (for admin/management purposes)
   */
  async getAllUserProfiles(
    options: {
      prefix?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ profiles: UserProfile[]; total: number }> {
    try {
      const { prefix = this.PROFILE_PREFIX, limit = 100, offset = 0 } = options;

      const result = await this.r2Client.listObjects({
        prefix,
        maxKeys: limit + offset,
      });

      const profiles: UserProfile[] = [];

      for (const obj of result.objects) {
        if (obj.key.startsWith(prefix)) {
          try {
            const profile = await this.r2Client.getJson<UserProfile>(obj.key);
            if (profile) {
              const validatedProfile = userProfileSchema.parse(profile);
              profiles.push(validatedProfile);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse profile ${obj.key}:`, error);
          }
        }
      }

      // Apply offset and limit
      const paginatedProfiles = profiles.slice(offset, offset + limit);

      return {
        profiles: paginatedProfiles,
        total: profiles.length,
      };
    } catch (error) {
      console.error("❌ Failed to get all user profiles:", error);
      throw new Error(
        `Failed to get all user profiles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Search for profiles by various criteria
   */
  async searchProfiles(criteria: {
    worldId?: string;
    walletAddress?: string;
    university?: string;
    isProfileComplete?: boolean;
    hasScore?: boolean;
    limit?: number;
  }): Promise<UserProfile[]> {
    try {
      const { limit = 50 } = criteria;
      const result = await this.getAllUserProfiles({ limit: 1000 });

      let filteredProfiles = result.profiles;

      // Apply filters
      if (criteria.worldId) {
        filteredProfiles = filteredProfiles.filter((p) =>
          p.worldId.toLowerCase().includes(criteria.worldId!.toLowerCase())
        );
      }

      if (criteria.walletAddress) {
        filteredProfiles = filteredProfiles.filter((p) =>
          p.walletAddress
            .toLowerCase()
            .includes(criteria.walletAddress!.toLowerCase())
        );
      }

      if (criteria.university) {
        filteredProfiles = filteredProfiles.filter((p) =>
          p.university
            ?.toLowerCase()
            .includes(criteria.university!.toLowerCase())
        );
      }

      if (criteria.isProfileComplete !== undefined) {
        filteredProfiles = filteredProfiles.filter(
          (p) => p.isProfileComplete === criteria.isProfileComplete
        );
      }

      if (criteria.hasScore !== undefined) {
        filteredProfiles = filteredProfiles.filter(
          (p) => !!p.score === criteria.hasScore
        );
      }

      return filteredProfiles.slice(0, limit);
    } catch (error) {
      console.error("❌ Failed to search profiles:", error);
      throw new Error(
        `Failed to search profiles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get profiles by verification status
   */
  async getProfilesByVerificationStatus(
    verificationType: "worldId" | "nft" | "score",
    isVerified: boolean
  ): Promise<UserProfile[]> {
    try {
      const result = await this.getAllUserProfiles({ limit: 1000 });

      return result.profiles.filter(
        (profile) => profile.verificationBadges[verificationType] === isVerified
      );
    } catch (error) {
      console.error("❌ Failed to get profiles by verification status:", error);
      throw new Error(
        `Failed to get profiles by verification status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create a default profile for new users
   */
  private createDefaultProfile(userId: string): UserProfile {
    return {
      id: userId,
      worldId: "",
      walletAddress: "",
      vibeTags: [],
      profileImage: "",
      bio: "",
      isProfileComplete: false,
      lastUpdatedAt: new Date(),
      verificationBadges: {
        worldId: false,
        nft: false,
        score: false,
      },
    };
  }

  /**
   * Health check for profile storage
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic R2 connectivity
      const isHealthy = await this.r2Client.healthCheck();

      if (!isHealthy) {
        return false;
      }

      // Test profile operations
      const testUserId = "health-check-test";
      const testProfile = this.createDefaultProfile(testUserId);

      await this.storeUserProfile(testUserId, testProfile);
      const retrievedProfile = await this.getUserProfile(testUserId);

      if (!retrievedProfile) {
        return false;
      }

      await this.deleteUserProfile(testUserId);

      return true;
    } catch (error) {
      console.error("❌ Profile storage health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
let userProfileStorageInstance: UserProfileStorage | null = null;

export function getUserProfileStorage(): UserProfileStorage {
  if (!userProfileStorageInstance) {
    userProfileStorageInstance = new UserProfileStorage();
  }
  return userProfileStorageInstance;
}

// Export for direct use
export default UserProfileStorage;
