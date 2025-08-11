/**
 * Relative Attractiveness Scoring Engine V2
 * Updated engine that uses the standalone ML API service for processing
 * Maintains compatibility with existing interfaces while improving architecture
 */

import { FaceEmbeddingExtractor, ProcessedFace } from './face-embeddings';
import {
  faceVectorStore,
  UserEmbedding,
  ScoreDistribution,
} from './vector-store';
import { VibeClusterer } from './vibe-clustering';
import { MLProcessingResult } from './ml-models/model-integration';
import { mlServiceClient } from './ml-service-client';

export interface ScoringRequest {
  userId: string;
  imageBase64: string;
  metadata?: {
    nftVerified?: boolean;
    wldVerified?: boolean;
    timestamp?: string;
  };
}

export interface ScoringResult {
  score: number; // Percentile score (0-100)
  percentile: number; // Decimal percentile (0-1)
  vibeTags: string[];
  timestamp: string;
  metadata: {
    faceQuality: number;
    frontality: number;
    symmetry: number;
    resolution: number;
    totalUsers: number;
    userRank: number;
    confidence: number;
  };
  distribution?: ScoreDistribution;
}

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
 * Main attractiveness scoring engine V2 - uses standalone ML service
 */
export class AttractivenessEngineV2 {
  private faceExtractor: FaceEmbeddingExtractor;
  private vibeClusterer: VibeClusterer;
  private useRealML: boolean;

  constructor(useRealML: boolean = false) {
    this.faceExtractor = new FaceEmbeddingExtractor();
    this.vibeClusterer = new VibeClusterer();
    this.useRealML = useRealML;

    // Log the mode for debugging
    console.log(
      `Attractiveness Engine V2 initialized in ${
        useRealML ? 'REAL ML (Standalone Service)' : 'SIMULATED'
      } mode`
    );
  }

  /**
   * Type guard to check if an object is of type ProcessedFace
   */
  private isProcessedFace(
    face: ProcessedFace | MLProcessingResult
  ): face is ProcessedFace {
    return (
      typeof face === 'object' &&
      face !== null &&
      'embedding' in face &&
      Array.isArray(face.embedding) &&
      'quality' in face &&
      typeof face.quality === 'number' &&
      'frontality' in face &&
      typeof face.frontality === 'number' &&
      'symmetry' in face &&
      typeof face.symmetry === 'number' &&
      'resolution' in face &&
      typeof face.resolution === 'number'
    );
  }

  /**
   * Convert MLProcessingResult to ProcessedFace format
   */
  private convertMLResultToProcessedFace(
    result: MLProcessingResult
  ): ProcessedFace {
    return {
      embedding: Array.from(result.embedding), // Convert Float32Array to regular array
      quality: result.quality,
      frontality: result.frontality,
      symmetry: result.symmetry,
      resolution: result.resolution,
      // Note: confidence is stored in MLProcessingResult but not in ProcessedFace interface
    };
  }

  /**
   * Main scoring function - processes image and returns percentile score
   */
  async scoreUser(request: ScoringRequest): Promise<ScoringResult> {
    try {
      // Step 1: Validate user eligibility
      const validation = await this.validateUser(request);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.reason}`);
      }

      // Step 2: Process image with ML models
      let processedFace: ProcessedFace;

      if (this.useRealML) {
        try {
          // Use standalone ML service for processing
          console.log('Processing image with standalone ML service...');
          const mlResult = await mlServiceClient.processImage(
            request.imageBase64
          );

          if (!mlResult) {
            throw new Error(
              'ML service processing failed - no result returned'
            );
          }

          // Validate the ML result quality
          const validation = mlServiceClient.validateResult(mlResult);
          if (!validation.isValid) {
            throw new Error(
              `ML processing validation failed: ${validation.reason}`
            );
          }

          // Convert to ProcessedFace format
          processedFace = this.convertMLResultToProcessedFace(mlResult);
          console.log('Successfully processed image with ML service');
        } catch (error) {
          console.warn(
            'ML service processing failed, falling back to simulated mode:',
            error
          );

          // Fallback to simulated processing
          const simResult = await this.faceExtractor.extractEmbedding(
            request.imageBase64
          );
          if (!simResult) {
            throw new Error('No face detected in image');
          }

          if (!this.faceExtractor.validateFaceQuality(simResult)) {
            throw new Error(
              'Face quality too low for scoring (frontality, resolution, or symmetry issues)'
            );
          }

          processedFace = simResult;
        }
      } else {
        // Use simulated models (fallback)
        const simResult = await this.faceExtractor.extractEmbedding(
          request.imageBase64
        );
        if (!simResult) {
          throw new Error('No face detected in image');
        }

        if (!this.faceExtractor.validateFaceQuality(simResult)) {
          throw new Error(
            'Face quality too low for scoring (frontality, resolution, or symmetry issues)'
          );
        }

        processedFace = simResult;
      }

      // Step 3: Create user embedding record
      const userEmbedding: UserEmbedding = {
        userId: request.userId,
        embedding: Array.from(processedFace.embedding), // Ensure it's a regular array
        metadata: {
          timestamp: request.metadata?.timestamp || new Date().toISOString(),
          quality: processedFace.quality,
          frontality: processedFace.frontality,
          symmetry: processedFace.symmetry,
          resolution: processedFace.resolution,
        },
      };

      // Step 4: Add to vector store (this recalculates all scores)
      const added = await faceVectorStore.addEmbedding(userEmbedding);
      if (!added) {
        throw new Error('Failed to add user to scoring database');
      }

      // Step 5: Get updated user record with calculated score
      const updatedUser = await faceVectorStore.getUserEmbedding(
        request.userId
      );
      if (!updatedUser || updatedUser.score === undefined) {
        throw new Error('Failed to calculate user score');
      }

      // Step 6: Generate vibe tags
      const vibeTags = await this.vibeClusterer.generateVibeTags(
        Array.from(processedFace.embedding),
        processedFace
      );

      // Step 7: Get current distribution and rankings
      const distribution = await faceVectorStore.getScoreDistribution();
      const totalUsers = await faceVectorStore.getUserCount();
      const leaderboard = await faceVectorStore.getLeaderboard(totalUsers);
      const userRank =
        leaderboard.findIndex(u => u.userId === request.userId) + 1;

      // Step 8: Calculate confidence based on face quality and user base size
      const confidence = this.calculateConfidence(processedFace, totalUsers);

      return {
        score: updatedUser.score,
        percentile: updatedUser.score / 100,
        vibeTags,
        timestamp: updatedUser.metadata.timestamp,
        metadata: {
          faceQuality: processedFace.quality,
          frontality: processedFace.frontality,
          symmetry: processedFace.symmetry,
          resolution: processedFace.resolution,
          totalUsers,
          userRank,
          confidence,
        },
        distribution,
      };
    } catch (error) {
      console.error('Scoring failed:', error);
      throw error;
    }
  }

  /**
   * Get user's current score (if already scored)
   */
  async getUserScore(userId: string): Promise<ScoringResult | null> {
    try {
      const userEmbedding = await faceVectorStore.getUserEmbedding(userId);
      if (!userEmbedding || userEmbedding.score === undefined) {
        return null;
      }

      const distribution = await faceVectorStore.getScoreDistribution();
      const totalUsers = await faceVectorStore.getUserCount();
      const leaderboard = await faceVectorStore.getLeaderboard(totalUsers);
      const userRank = leaderboard.findIndex(u => u.userId === userId) + 1;

      return {
        score: userEmbedding.score,
        percentile: userEmbedding.score / 100,
        vibeTags: userEmbedding.vibeTags || [],
        timestamp: userEmbedding.metadata.timestamp,
        metadata: {
          faceQuality: userEmbedding.metadata.quality,
          frontality: userEmbedding.metadata.frontality,
          symmetry: userEmbedding.metadata.symmetry,
          resolution: userEmbedding.metadata.resolution,
          totalUsers,
          userRank,
          confidence: this.calculateConfidence(
            {
              embedding: userEmbedding.embedding,
              quality: userEmbedding.metadata.quality,
              frontality: userEmbedding.metadata.frontality,
              symmetry: userEmbedding.metadata.symmetry,
              resolution: userEmbedding.metadata.resolution,
            },
            totalUsers
          ),
        },
        distribution,
      };
    } catch (error) {
      console.error('Failed to get user score:', error);
      return null;
    }
  }

  /**
   * Get leaderboard with top users
   */
  async getLeaderboard(limit: number = 100): Promise<{
    users: Array<{
      userId: string;
      score: number;
      percentile: number;
      vibeTags: string[];
      rank: number;
      timestamp: string;
    }>;
    totalUsers: number;
    distribution: ScoreDistribution;
  }> {
    try {
      const leaderboard = await faceVectorStore.getLeaderboard(limit);
      const distribution = await faceVectorStore.getScoreDistribution();
      const totalUsers = await faceVectorStore.getUserCount();

      const users = leaderboard.map((user, index) => ({
        userId: user.userId,
        score: user.score || 0,
        percentile: (user.score || 0) / 100,
        vibeTags: user.vibeTags || [],
        rank: index + 1,
        timestamp: user.metadata.timestamp,
      }));

      return {
        users,
        totalUsers,
        distribution,
      };
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Validate user eligibility for scoring
   */
  private async validateUser(
    request: ScoringRequest
  ): Promise<ValidationResult> {
    const requirements = {
      nftVerified: request.metadata?.nftVerified || false,
      wldVerified: request.metadata?.wldVerified || false,
      oneTimeRule: true,
      faceQuality: true, // Will be checked separately
    };

    // Check if user already has a score (one-time rule)
    const hasExistingScore = await faceVectorStore.hasUser(request.userId);
    if (hasExistingScore) {
      // Check if the score has expired (30 days)
      const existingUser = await faceVectorStore.getUserEmbedding(
        request.userId
      );
      if (existingUser) {
        const scoreDate = new Date(existingUser.metadata.timestamp);
        const expiryDate = new Date(
          scoreDate.getTime() + 30 * 24 * 60 * 60 * 1000
        ); // 30 days
        const now = new Date();

        if (now < expiryDate) {
          // Score is still valid
          requirements.oneTimeRule = false;
          return {
            isValid: false,
            reason: 'User already has a valid score (one-time scoring only)',
            requirements,
          };
        }
        // Score has expired, allow re-scoring
      }
    }

    // For demo purposes, we'll relax NFT/WLD requirements
    // In production, enforce these strictly:
    /*
    if (!requirements.nftVerified) {
      return {
        isValid: false,
        reason: 'NFT verification required',
        requirements
      }
    }
    
    if (!requirements.wldVerified) {
      return {
        isValid: false,
        reason: 'WorldCoin verification required',
        requirements
      }
    }
    */

    return {
      isValid: true,
      requirements,
    };
  }

  /**
   * Calculate confidence score based on face quality and dataset size
   */
  private calculateConfidence(face: ProcessedFace, totalUsers: number): number {
    // Base confidence from face quality metrics
    const faceConfidence =
      face.quality * 0.4 +
      face.frontality * 0.3 +
      face.resolution * 0.2 +
      face.symmetry * 0.1;

    // Dataset size factor (more users = higher confidence in percentile)
    const datasetFactor = Math.min(1.0, totalUsers / 1000); // Max confidence at 1000+ users

    // Combined confidence
    const overallConfidence = faceConfidence * 0.7 + datasetFactor * 0.3;

    return Math.round(overallConfidence * 100) / 100;
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    totalUsers: number;
    averageScore: number;
    distribution: ScoreDistribution;
    topPercentiles: {
      top1Percent: number;
      top5Percent: number;
      top10Percent: number;
    };
  }> {
    try {
      const totalUsers = await faceVectorStore.getUserCount();
      const distribution = await faceVectorStore.getScoreDistribution();

      return {
        totalUsers,
        averageScore: Math.round(distribution.mean * 10) / 10,
        distribution,
        topPercentiles: {
          top1Percent: distribution.percentiles.p99,
          top5Percent: distribution.percentiles.p95,
          top10Percent: distribution.percentiles.p90,
        },
      };
    } catch (error) {
      console.error('Failed to get system stats:', error);
      throw error;
    }
  }

  /**
   * Find similar users to a given user
   */
  async findSimilarUsers(
    userId: string,
    limit: number = 10
  ): Promise<
    Array<{
      userId: string;
      similarity: number;
      score: number;
      vibeTags: string[];
    }>
  > {
    try {
      const userEmbedding = await faceVectorStore.getUserEmbedding(userId);
      if (!userEmbedding) {
        throw new Error('User not found');
      }

      const similarUsers = await faceVectorStore.findSimilar(
        userEmbedding.embedding,
        limit,
        userId
      );

      const results = [];
      for (const similar of similarUsers) {
        const similarUser = await faceVectorStore.getUserEmbedding(
          similar.userId
        );
        if (similarUser) {
          results.push({
            userId: similar.userId,
            similarity: Math.round(similar.similarity * 1000) / 1000,
            score: similarUser.score || 0,
            vibeTags: similarUser.vibeTags || [],
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to find similar users:', error);
      throw error;
    }
  }

  /**
   * Health check for ML service availability
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    mlServiceAvailable: boolean;
    fallbackMode: boolean;
  }> {
    try {
      if (!this.useRealML) {
        return {
          status: 'healthy',
          mlServiceAvailable: false,
          fallbackMode: true,
        };
      }

      const healthCheck = await mlServiceClient.healthCheck();
      return {
        status: healthCheck.status,
        mlServiceAvailable: healthCheck.status !== 'unhealthy',
        fallbackMode: healthCheck.status === 'unhealthy',
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        mlServiceAvailable: false,
        fallbackMode: true,
      };
    }
  }
}

// Create instances for different modes using V2 engine
export const attractivenessEngineV2 = new AttractivenessEngineV2(true); // Use real ML via service
export const attractivenessEngineV2Simulated = new AttractivenessEngineV2(
  false
); // Use simulated ML

// Legacy compatibility exports (gradual migration path)
export const attractivenessEngine = attractivenessEngineV2;
export const attractivenessEngineSimulated = attractivenessEngineV2Simulated;
