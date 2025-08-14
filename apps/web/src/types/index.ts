// [DEPRECATED: 2025-08-11] Local type definitions preserved for reference
// Standalone types (no shared dependencies)

// Basic user type
export interface User {
  id: string;
  handle: string;
  displayName: string;
  profilePhoto?: string;
  bio?: string;
  age?: number;
  location?: string;
  interests?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// User session type
export interface UserSession {
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

// World ID proof type
export interface WorldIDProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
}

// Invite type
export interface Invite {
  id: string;
  code: string;
  createdBy: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

// Profile card type
export interface ProfileCard {
  id: string;
  userId: string;
  photos: string[];
  bio: string;
  interests: string[];
  age: number;
  location: string;
}

// Match type
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: Date;
  status: 'active' | 'archived';
}

// Discovery preferences type
export interface DiscoveryFilters {
  ageRange: [number, number];
  maxDistance: number;
  interests: string[];
}

// App-specific session interface extending shared UserSession
export interface Session {
  user: User;
  wallet: string;
  hasNFT: boolean;
  expiresAt: Date;
}

// App-specific signal interface (extended from shared discovery types)
export interface Signal {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'interest' | 'super_interest' | 'pass';
  message?: string;
  sentAt: Date;
}

// App-specific invite claim interface
export interface InviteClaim {
  id: string;
  inviteId: string;
  claimedBy: string;
  claimedAt: Date;
  claimer: Pick<User, 'id' | 'handle' | 'displayName' | 'profilePhoto'>;
}

// API Response types
export interface ApiResponse<T = Record<string, never>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
