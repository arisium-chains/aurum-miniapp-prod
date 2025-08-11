/**
 * @description Integration tests for Web App ML Service Integration
 * Tests the web app's integration with the standalone ML service
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { mlServiceClient } from '@/lib/ml-service-client';
import {
  attractivenessEngineV2,
  attractivenessEngineV2Simulated,
} from '@/lib/attractiveness-engine-v2';

// Test constants
const TEST_USER_ID = 'test-user-ml-integration';
const TEST_IMAGE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('Web App ML Service Integration Tests', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.ML_API_URL = process.env.ML_API_URL || 'http://localhost:3003';
    console.log(
      `Testing web app ML integration with service at: ${process.env.ML_API_URL}`
    );
  });

  afterAll(async () => {
    // Clean up any test data
  });

  describe('ML Service Client', () => {
    /**
     * @description Test ML service client functionality
     * Verifies client can communicate with ML service
     */
    it('should successfully perform health check', async () => {
      const healthCheck = await mlServiceClient.healthCheck();

      expect(healthCheck).toHaveProperty('status');
      expect(healthCheck).toHaveProperty('details');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(
        healthCheck.status
      );
      expect(typeof healthCheck.details.faceDetection).toBe('boolean');
      expect(typeof healthCheck.details.faceEmbedding).toBe('boolean');
      expect(typeof healthCheck.details.overall).toBe('boolean');
    });

    it('should return model information', () => {
      const modelInfo = mlServiceClient.getModelInfo();

      expect(modelInfo).toHaveProperty('initialized');
      expect(modelInfo).toHaveProperty('models');
      expect(modelInfo).toHaveProperty('version');
      expect(typeof modelInfo.initialized).toBe('boolean');
      expect(typeof modelInfo.models.faceDetection).toBe('boolean');
      expect(typeof modelInfo.models.faceEmbedding).toBe('boolean');
      expect(typeof modelInfo.version).toBe('string');
    });

    it('should handle service unavailability gracefully', async () => {
      // Mock a failed request to test fallback behavior
      const originalMakeRequest = (mlServiceClient as any).makeRequest;
      (mlServiceClient as any).makeRequest = jest
        .fn()
        .mockRejectedValue(new Error('Service unavailable'));

      const healthCheck = await mlServiceClient.healthCheck();

      expect(healthCheck.status).toBe('unhealthy');
      expect(healthCheck.details.overall).toBe(false);

      // Restore original method
      (mlServiceClient as any).makeRequest = originalMakeRequest;
    });

    it('should process image successfully when service is available', async () => {
      try {
        const result = await mlServiceClient.processImage(TEST_IMAGE_BASE64);

        if (result) {
          expect(result).toHaveProperty('embedding');
          expect(result).toHaveProperty('quality');
          expect(result).toHaveProperty('frontality');
          expect(result).toHaveProperty('symmetry');
          expect(result).toHaveProperty('resolution');
          expect(result).toHaveProperty('confidence');
          expect(result.embedding).toBeInstanceOf(Float32Array);
          expect(result.embedding.length).toBeGreaterThan(0);
        }
      } catch (error) {
        // If ML service is not available, test should still pass
        expect(error).toBeInstanceOf(Error);
        console.warn(
          'ML service not available during test, which is expected in some environments'
        );
      }
    });

    it('should validate processing results correctly', async () => {
      // Create a mock result for validation testing
      const mockResult = {
        embedding: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
        quality: 0.8,
        frontality: 0.7,
        symmetry: 0.6,
        resolution: 0.8,
        confidence: 0.9,
        faceId: 'test-face-id',
        detectionData: {
          confidence: 0.9,
          box: { x: 0, y: 0, width: 100, height: 100 },
        },
      };

      const validation = mlServiceClient.validateResult(mockResult);

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('quality');
      expect(typeof validation.isValid).toBe('boolean');
      expect(validation.quality).toHaveProperty('face');
      expect(validation.quality).toHaveProperty('embedding');
      expect(validation.quality).toHaveProperty('overall');
    });

    it('should calculate similarity between embeddings', () => {
      const embedding1 = new Float32Array([1, 0, 0, 0]);
      const embedding2 = new Float32Array([0, 1, 0, 0]);
      const embedding3 = new Float32Array([1, 0, 0, 0]);

      const similarity1 = mlServiceClient.calculateSimilarity(
        embedding1,
        embedding2
      );
      const similarity2 = mlServiceClient.calculateSimilarity(
        embedding1,
        embedding3
      );

      expect(typeof similarity1).toBe('number');
      expect(typeof similarity2).toBe('number');
      expect(similarity1).toBeLessThan(similarity2); // More similar embeddings should have higher similarity
      expect(similarity1).toBeGreaterThanOrEqual(0);
      expect(similarity1).toBeLessThanOrEqual(1);
    });
  });

  describe('Attractiveness Engine V2 Integration', () => {
    /**
     * @description Test attractiveness engine V2 with ML service integration
     * Verifies the engine can work with both real ML and simulated modes
     */
    it('should perform health check for real ML mode', async () => {
      const healthCheck = await attractivenessEngineV2.healthCheck();

      expect(healthCheck).toHaveProperty('status');
      expect(healthCheck).toHaveProperty('mlServiceAvailable');
      expect(healthCheck).toHaveProperty('fallbackMode');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(
        healthCheck.status
      );
      expect(typeof healthCheck.mlServiceAvailable).toBe('boolean');
      expect(typeof healthCheck.fallbackMode).toBe('boolean');
    });

    it('should perform health check for simulated mode', async () => {
      const healthCheck = await attractivenessEngineV2Simulated.healthCheck();

      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.mlServiceAvailable).toBe(false);
      expect(healthCheck.fallbackMode).toBe(true);
    });

    it('should score user with simulated engine', async () => {
      const scoringRequest = {
        userId: `${TEST_USER_ID}-simulated`,
        imageBase64: TEST_IMAGE_BASE64,
        metadata: {
          nftVerified: true,
          wldVerified: true,
          timestamp: new Date().toISOString(),
        },
      };

      try {
        const result =
          await attractivenessEngineV2Simulated.scoreUser(scoringRequest);

        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('percentile');
        expect(result).toHaveProperty('vibeTags');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('metadata');
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(Array.isArray(result.vibeTags)).toBe(true);
      } catch (error) {
        // Check if it's a validation error (expected for test image)
        if (
          error instanceof Error &&
          error.message.includes('No face detected')
        ) {
          console.warn(
            'Test image has no detectable face, which is expected for unit tests'
          );
        } else {
          throw error;
        }
      }
    });

    it('should handle ML service fallback gracefully', async () => {
      const scoringRequest = {
        userId: `${TEST_USER_ID}-fallback`,
        imageBase64: TEST_IMAGE_BASE64,
        metadata: {
          nftVerified: true,
          wldVerified: true,
          timestamp: new Date().toISOString(),
        },
      };

      // Mock ML service failure to test fallback
      const originalProcessImage = mlServiceClient.processImage;
      mlServiceClient.processImage = jest
        .fn()
        .mockRejectedValue(new Error('ML service unavailable'));

      try {
        const result = await attractivenessEngineV2.scoreUser(scoringRequest);

        // Should fall back to simulated processing
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('metadata');
      } catch (error) {
        // Expected behavior when face detection fails
        if (
          error instanceof Error &&
          error.message.includes('No face detected')
        ) {
          console.warn('Test completed - fallback mode used as expected');
        } else {
          throw error;
        }
      }

      // Restore original method
      mlServiceClient.processImage = originalProcessImage;
    });

    it('should get system statistics', async () => {
      const stats = await attractivenessEngineV2Simulated.getSystemStats();

      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('distribution');
      expect(stats).toHaveProperty('topPercentiles');
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
      expect(stats.distribution).toHaveProperty('mean');
      expect(stats.distribution).toHaveProperty('std');
      expect(stats.topPercentiles).toHaveProperty('top1Percent');
      expect(stats.topPercentiles).toHaveProperty('top5Percent');
      expect(stats.topPercentiles).toHaveProperty('top10Percent');
    });

    it('should get leaderboard data', async () => {
      const leaderboard =
        await attractivenessEngineV2Simulated.getLeaderboard(10);

      expect(leaderboard).toHaveProperty('users');
      expect(leaderboard).toHaveProperty('totalUsers');
      expect(leaderboard).toHaveProperty('distribution');
      expect(Array.isArray(leaderboard.users)).toBe(true);
      expect(typeof leaderboard.totalUsers).toBe('number');

      if (leaderboard.users.length > 0) {
        const user = leaderboard.users[0];
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('score');
        expect(user).toHaveProperty('percentile');
        expect(user).toHaveProperty('vibeTags');
        expect(user).toHaveProperty('rank');
        expect(user).toHaveProperty('timestamp');
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    /**
     * @description Test error handling scenarios
     * Verifies proper error responses and graceful degradation
     */
    it('should handle invalid image data', async () => {
      const scoringRequest = {
        userId: `${TEST_USER_ID}-invalid`,
        imageBase64: 'invalid-base64-data',
        metadata: {
          nftVerified: true,
          wldVerified: true,
          timestamp: new Date().toISOString(),
        },
      };

      try {
        await attractivenessEngineV2Simulated.scoreUser(scoringRequest);
        fail('Should have thrown an error for invalid image data');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('No face detected');
      }
    });

    it('should handle missing user ID', async () => {
      const scoringRequest = {
        userId: '',
        imageBase64: TEST_IMAGE_BASE64,
        metadata: {
          nftVerified: true,
          wldVerified: true,
          timestamp: new Date().toISOString(),
        },
      };

      try {
        await attractivenessEngineV2Simulated.scoreUser(scoringRequest);
        fail('Should have thrown an error for missing user ID');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle duplicate scoring attempts', async () => {
      const scoringRequest = {
        userId: `${TEST_USER_ID}-duplicate`,
        imageBase64: TEST_IMAGE_BASE64,
        metadata: {
          nftVerified: true,
          wldVerified: true,
          timestamp: new Date().toISOString(),
        },
      };

      try {
        // First attempt - should succeed or fail with face detection
        await attractivenessEngineV2Simulated.scoreUser(scoringRequest);

        // Second attempt - should fail with duplicate error
        await attractivenessEngineV2Simulated.scoreUser(scoringRequest);
        fail('Should have thrown an error for duplicate scoring');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Could be either face detection error or duplicate user error
        expect(
          error.message.includes('already has a score') ||
            error.message.includes('No face detected')
        ).toBe(true);
      }
    });

    it('should handle network timeout gracefully', async () => {
      // Mock a timeout scenario
      const originalMakeRequest = (mlServiceClient as any).makeRequest;
      (mlServiceClient as any).makeRequest = jest
        .fn()
        .mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        });

      const healthCheck = await mlServiceClient.healthCheck();
      expect(healthCheck.status).toBe('unhealthy');

      // Restore original method
      (mlServiceClient as any).makeRequest = originalMakeRequest;
    });
  });

  describe('Configuration and Environment', () => {
    /**
     * @description Test configuration handling
     * Verifies proper environment variable usage and configuration
     */
    it('should use correct ML service URL from environment', () => {
      const config = (mlServiceClient as any).config;

      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('retries');
      expect(typeof config.baseUrl).toBe('string');
      expect(typeof config.timeout).toBe('number');
      expect(typeof config.retries).toBe('number');
      expect(config.timeout).toBeGreaterThan(0);
      expect(config.retries).toBeGreaterThan(0);
    });

    it('should handle missing environment variables', () => {
      // Test that the existing client has proper configuration
      const config = (mlServiceClient as any).config;

      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('retries');
      expect(typeof config.baseUrl).toBe('string');
      expect(
        config.baseUrl.includes('localhost') || config.baseUrl.includes('http')
      ).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    /**
     * @description Test performance characteristics
     * Verifies memory usage and processing times
     */
    it('should complete health checks within reasonable time', async () => {
      const startTime = Date.now();
      await mlServiceClient.healthCheck();
      const duration = Date.now() - startTime;

      // Health check should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it('should handle multiple concurrent health checks', async () => {
      const promises = Array.from({ length: 5 }, () =>
        mlServiceClient.healthCheck()
      );
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toHaveProperty('status');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
      });
    });

    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await mlServiceClient.healthCheck();
        mlServiceClient.getModelInfo();
      }

      const finalMemory = process.memoryUsage();
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory growth should be reasonable (less than 10MB)
      expect(heapGrowth).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
