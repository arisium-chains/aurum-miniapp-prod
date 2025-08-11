/**
 * @description Authentication and user management interfaces
 */

/**
 * User authentication session data
 */
export interface UserSession {
  userId: string;
  walletAddress?: string;
  worldIdVerified: boolean;
  nftVerified: boolean;
  sessionId: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Authentication request payload
 */
export interface AuthRequest {
  walletAddress?: string;
  worldIdProof?: WorldIdProof;
  nftProof?: NFTProof;
  signature?: string;
  message?: string;
}

/**
 * World ID verification proof
 */
export interface WorldIdProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  credential_type: string;
  action: string;
  signal: string;
}

/**
 * NFT ownership proof
 */
export interface NFTProof {
  contractAddress: string;
  tokenId: string;
  ownerAddress: string;
  signature: string;
  blockNumber: number;
}

/**
 * User profile data
 */
export interface User {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  age?: number;
  university?: string;
  photos: string[];
  profilePhoto?: string;
  vibes: string[];
  interests: string[];
  walletAddress?: string;
  worldIdVerified: boolean;
  nftVerified: boolean;
  nftTier?: NFTTier;
  facialScore?: number;
  finalScore?: number;
  scoreExpiry?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isVisible: boolean;
}

/**
 * NFT tier levels for bonus scoring
 */
export type NFTTier = 'none' | 'basic' | 'rare' | 'elite' | 'legendary';

/**
 * User profile for scoring calculations
 */
export interface UserProfile {
  userId: string;
  gender: 'male' | 'female';
  facialScore: number;
  university: string;
  nftTier?: NFTTier;
  finalScore?: number;
  scoreExpiry?: string;
}

/**
 * Profile creation request
 */
export interface ProfileCreateRequest {
  handle: string;
  displayName: string;
  bio?: string;
  age: number;
  university: string;
  photos: string[];
  interests: string[];
  vibes?: string[];
}

/**
 * Profile update request
 */
export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  age?: number;
  university?: string;
  photos?: string[];
  interests?: string[];
  vibes?: string[];
}

/**
 * Authentication validation result
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  requirements: {
    nftVerified: boolean;
    wldVerified: boolean;
    oneTimeRule: boolean;
    faceQuality: boolean;
  };
}

/**
 * Invite system interfaces
 */
export interface Invite {
  id: string;
  code: string;
  generatedBy: string;
  claimedBy?: string;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  expiresAt?: string;
  createdAt: string;
  claimedAt?: string;
}

/**
 * Invite generation request
 */
export interface InviteGenerateRequest {
  maxUses?: number;
  expiresAt?: string;
}

/**
 * Invite claim request
 */
export interface InviteClaimRequest {
  code: string;
  userId: string;
}
