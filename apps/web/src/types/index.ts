// [DEPRECATED: 2025-08-11] Local type definitions preserved for reference
// Import shared types for local use
import type { User } from '@shared/types';

// Re-export shared types
export type {
  User,
  UserSession,
  WorldIdProof as WorldIDProof,
  Invite,
  ProfileCard,
  Match,
  DiscoveryPreferences as DiscoveryFilters,
} from '@shared/types';

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
