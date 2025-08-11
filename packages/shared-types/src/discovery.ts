/**
 * @description Discovery and matching interfaces for user interactions
 */
import type { User } from './auth';

/**
 * Profile card data for discovery interface
 */
export interface Profile {
  id: string;
  name: string;
  age: number;
  university: string;
  photos: string[];
  bio: string;
  vibes: string[];
  score: number;
  isBlurred: boolean;
  hasSignal: boolean;
}

/**
 * Profile card with additional metadata
 */
export interface ProfileCard {
  user: User;
  isBlurred: boolean;
  commonTags: string[];
  distance?: number;
}

/**
 * User embedding for similarity matching
 */
export interface UserEmbedding {
  userId: string;
  embedding: number[];
  metadata: {
    timestamp: string;
    quality: number;
    frontality: number;
    symmetry: number;
    resolution: number;
  };
  score?: number;
  vibeTags?: string[];
}

/**
 * Similarity matching result
 */
export interface SimilarityResult {
  userId: string;
  similarity: number;
  metadata: UserEmbedding['metadata'];
}

/**
 * Discovery action types
 */
export type DiscoveryAction = 'like' | 'pass' | 'signal';

/**
 * Discovery action request
 */
export interface DiscoveryActionRequest {
  fromUserId: string;
  toUserId: string;
  action: DiscoveryAction;
  timestamp: string;
}

/**
 * Signal sending request
 */
export interface SignalRequest {
  fromUserId: string;
  toUserId: string;
  message?: string;
}

/**
 * Vibe profile for personality matching
 */
export interface VibeProfile {
  primary: string;
  secondary: string;
  traits: string[];
  aesthetic: string;
  energy: string;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  userId: string;
  score: number;
  percentile: number;
  vibeTags: string[];
  rank: number;
  timestamp: string;
}

/**
 * Discovery preferences and filters
 */
export interface DiscoveryPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  universities: string[];
  interests: string[];
  vibes: string[];
  maxDistance?: number;
  showOnlyVerified?: boolean;
}

/**
 * Match result between users
 */
export interface Match {
  id: string;
  users: [string, string];
  createdAt: string;
  isActive: boolean;
  lastActivity?: string;
}

/**
 * AI score log entry
 */
export interface AIScoreLog {
  userId: string;
  score: number;
  interpretation: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Re-export User type for convenience
export type { User } from './auth';
