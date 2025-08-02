// User types
export interface User {
  id: string;
  worldId: string;
  walletAddress: string;
  handle: string;
  displayName: string;
  bio?: string;
  profileImage: string;
  blurredImage: string;
  vibe: "Wicked" | "Royal" | "Mystic";
  tags: string[];
  nftVerified: boolean;
  lastSeen: Date;
  createdAt: Date;
  status: "active" | "suspended" | "deleted";
}

// Authentication types
export interface Session {
  user: User;
  wallet: string;
  hasNFT: boolean;
  expiresAt: Date;
}

export interface WorldIDProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
}

// Matching types
export interface Signal {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: "interest" | "super_interest" | "pass";
  message?: string;
  sentAt: Date;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: Date;
  conversationId?: string;
  status: "pending" | "matched" | "unmatched";
  otherUser: User; // Populated based on current user
}

// Invite types
export interface Invite {
  id: string;
  code: string;
  createdBy: string;
  claimedBy?: string;
  claimedAt?: Date;
  expiresAt: Date;
  maxUses: number;
  currentUses: number;
  status: "active" | "expired" | "exhausted";
}

export interface InviteClaim {
  id: string;
  inviteId: string;
  claimedBy: string;
  claimedAt: Date;
  claimer: Pick<User, "id" | "handle" | "displayName" | "profileImage">;
}

// Discovery types
export interface ProfileCard {
  user: User;
  isBlurred: boolean;
  commonTags: string[];
  distance?: number;
}

export interface DiscoveryFilters {
  vibe?: "Wicked" | "Royal" | "Mystic" | "All";
  tags?: string[];
  maxDistance?: number;
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
