/**
 * Mock Score Storage Service
 * Provides score storage and prevention logic using R2
 */

import { getR2Client } from "./storage/r2-client";
import {
  generateMockScore,
  MockScoreResult,
  validateMockScore,
} from "./mock-score-generator";

export interface StoredScore {
  userId: string;
  sessionId: string;
  score: MockScoreResult;
  createdAt: string;
  expiresAt: string;
}

export interface ScoreHistory {
  userId: string;
  scores: StoredScore[];
  totalScores: number;
  lastScoredAt: string | null;
}

const SCORE_TTL_HOURS = 24; // Store scores for 24 hours
const HISTORY_MAX_SCORES = 10; // Keep last 10 scores in history

/**
 * Generate a unique session-based key for score storage
 */
function generateScoreKey(userId: string, sessionId: string): string {
  return `scores/${userId}/${sessionId}`;
}

/**
 * Generate a history key for user
 */
function generateHistoryKey(userId: string): string {
  return `score-history/${userId}`;
}

/**
 * Store a score in R2 with session-based prevention
 */
export async function storeScore(
  userId: string,
  sessionId: string,
  imageData: string
): Promise<MockScoreResult> {
  try {
    const r2Client = getR2Client();
    const scoreKey = generateScoreKey(userId, sessionId);

    // Check if score already exists for this session
    const existingScore = await r2Client.getJson<StoredScore>(scoreKey);
    if (existingScore) {
      throw new Error("Score already exists for this session");
    }

    // Generate new mock score
    const score = await generateMockScore(userId, imageData);

    // Validate the score
    if (!validateMockScore(score)) {
      throw new Error("Invalid mock score generated");
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SCORE_TTL_HOURS);

    // Create stored score object
    const storedScore: StoredScore = {
      userId,
      sessionId,
      score,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store the score
    await r2Client.storeJson(scoreKey, storedScore);

    // Update user history
    await updateScoreHistory(userId, storedScore);

    return score;
  } catch (error) {
    console.error("Error storing score:", error);
    throw error;
  }
}

/**
 * Retrieve a score from R2 for a specific session
 */
export async function getScore(
  userId: string,
  sessionId: string
): Promise<StoredScore | null> {
  try {
    const r2Client = getR2Client();
    const scoreKey = generateScoreKey(userId, sessionId);

    const storedScore = await r2Client.getJson<StoredScore>(scoreKey);

    if (!storedScore) {
      return null;
    }

    // Check if score has expired
    const now = new Date();
    const expiresAt = new Date(storedScore.expiresAt);

    if (now > expiresAt) {
      await deleteScore(userId, sessionId);
      return null;
    }

    return storedScore;
  } catch (error) {
    console.error("Error retrieving score:", error);
    return null;
  }
}

/**
 * Delete a score from R2
 */
export async function deleteScore(
  userId: string,
  sessionId: string
): Promise<void> {
  try {
    const r2Client = getR2Client();
    const scoreKey = generateScoreKey(userId, sessionId);

    await r2Client.delete(scoreKey);
  } catch (error) {
    console.error("Error deleting score:", error);
    throw error;
  }
}

/**
 * Check if user can score (prevention logic)
 */
export async function canUserScore(
  userId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const existingScore = await getScore(userId, sessionId);
    return !existingScore;
  } catch (error) {
    console.error("Error checking user scoring eligibility:", error);
    return true; // Allow scoring if there's an error
  }
}

/**
 * Update user score history
 */
export async function updateScoreHistory(
  userId: string,
  newScore: StoredScore
): Promise<void> {
  try {
    const r2Client = getR2Client();
    const historyKey = generateHistoryKey(userId);

    // Get existing history
    let history: ScoreHistory = {
      userId,
      scores: [],
      totalScores: 0,
      lastScoredAt: null,
    };

    const existingHistory = await r2Client.getJson<ScoreHistory>(historyKey);
    if (existingHistory) {
      history = existingHistory;
    }

    // Add new score to history
    history.scores.unshift(newScore); // Add to beginning
    history.totalScores++;
    history.lastScoredAt = newScore.createdAt;

    // Keep only recent scores
    if (history.scores.length > HISTORY_MAX_SCORES) {
      history.scores = history.scores.slice(0, HISTORY_MAX_SCORES);
    }

    // Store updated history
    await r2Client.storeJson(historyKey, history);
  } catch (error) {
    console.error("Error updating score history:", error);
    throw error;
  }
}

/**
 * Get user score history
 */
export async function getScoreHistory(
  userId: string
): Promise<ScoreHistory | null> {
  try {
    const r2Client = getR2Client();
    const historyKey = generateHistoryKey(userId);

    const history = await r2Client.getJson<ScoreHistory>(historyKey);

    if (!history) {
      return null;
    }

    // Filter out expired scores
    const now = new Date();
    const validScores = history.scores.filter((score) => {
      const expiresAt = new Date(score.expiresAt);
      return now <= expiresAt;
    });

    // Update history with only valid scores
    if (validScores.length !== history.scores.length) {
      history.scores = validScores;
      await r2Client.storeJson(historyKey, history);
    }

    return history;
  } catch (error) {
    console.error("Error retrieving score history:", error);
    return null;
  }
}

/**
 * Reset user score history
 */
export async function resetScoreHistory(userId: string): Promise<void> {
  try {
    const r2Client = getR2Client();
    const historyKey = generateHistoryKey(userId);

    await r2Client.delete(historyKey);

    // Also delete all session scores for this user
    const prefix = `scores/${userId}/`;
    const listResult = await r2Client.listObjects({ prefix });

    for (const obj of listResult.objects) {
      await r2Client.delete(obj.key);
    }
  } catch (error) {
    console.error("Error resetting score history:", error);
    throw error;
  }
}

/**
 * Clean up expired scores
 */
export async function cleanupExpiredScores(): Promise<void> {
  try {
    const r2Client = getR2Client();

    // List all score keys
    const scorePrefix = "scores/";
    const listResult = await r2Client.listObjects({ prefix: scorePrefix });

    const now = new Date();
    const expiredKeys: string[] = [];

    for (const obj of listResult.objects) {
      try {
        const storedScore = await r2Client.getJson<StoredScore>(obj.key);
        if (storedScore) {
          const expiresAt = new Date(storedScore.expiresAt);
          if (now > expiresAt) {
            expiredKeys.push(obj.key);
          }
        }
      } catch (_error) {
        // If we can't parse the JSON, delete it anyway
        expiredKeys.push(obj.key);
      }
    }

    // Delete expired scores
    for (const key of expiredKeys) {
      await r2Client.delete(key);
    }

    console.log(`Cleaned up ${expiredKeys.length} expired scores`);
  } catch (error) {
    console.error("Error cleaning up expired scores:", error);
    throw error;
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalScores: number;
  totalHistory: number;
  expiredScores: number;
}> {
  try {
    const r2Client = getR2Client();

    const scorePrefix = "scores/";
    const historyPrefix = "score-history/";

    const scoreList = await r2Client.listObjects({ prefix: scorePrefix });
    const historyList = await r2Client.listObjects({ prefix: historyPrefix });

    const now = new Date();
    let expiredScores = 0;

    // Count expired scores
    for (const obj of scoreList.objects) {
      try {
        const storedScore = await r2Client.getJson<StoredScore>(obj.key);
        if (storedScore) {
          const expiresAt = new Date(storedScore.expiresAt);
          if (now > expiresAt) {
            expiredScores++;
          }
        }
      } catch (_error) {
        expiredScores++;
      }
    }

    return {
      totalScores: scoreList.objects.length,
      totalHistory: historyList.objects.length,
      expiredScores,
    };
  } catch (error) {
    console.error("Error getting storage stats:", error);
    throw error;
  }
}
