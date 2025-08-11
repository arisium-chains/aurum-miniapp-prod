/**
 * @description Integration tests for ML Service API endpoints
 * Tests the standalone ML service functionality and API responses
 */

import request from 'supertest';
import {
  TEST_IMAGES,
  EXPECTED_RESPONSES,
  ERROR_RESPONSES,
} from '../fixtures/test-images';

interface TestResult {
  status: number;
  processingTime: number;
}

interface BatchRequest {
  field: string;
  buffer: Buffer;
  filename: string;
}

// Mock the ML service for testing
const mockApp = {
  listen: jest.fn(),
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
};

describe('ML Service Integration Tests', () => {
  const baseURL = process.env.ML_API_URL || 'http://localhost:3003';
  let app: any;

  beforeAll(async () => {
    // Initialize ML service for testing
    // In a real scenario, we'd start the actual ML service
    console.log(`Testing ML service at: ${baseURL}`);
  });

  afterAll(async () => {
    // Clean up any resources
  });

  describe('Health Check Endpoint', () => {
    /**
     * @description Test ML service health check endpoint
     * Verifies service is responding and models are loaded
     */
    it('should return healthy status when ML service is running', async () => {
      const response = await request(baseURL).get('/api/ml/health').expect(200);

      expect(response.body).toMatchObject(EXPECTED_RESPONSES.healthCheck);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.models.initialized).toBe(true);
    });

    it('should include performance metrics in health check', async () => {
      const response = await request(baseURL).get('/api/ml/health').expect(200);

      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data.uptime).toBeGreaterThan(0);
      expect(typeof response.body.data.memory).toBe('object');
    });
  });

  describe('Model Status Endpoint', () => {
    /**
     * @description Test ML models status endpoint
     * Verifies model loading and capabilities
     */
    it('should return model status and capabilities', async () => {
      const response = await request(baseURL)
        .get('/api/ml/models/status')
        .expect(200);

      expect(response.body).toMatchObject(EXPECTED_RESPONSES.modelStatus);
      expect(response.body.data.capabilities).toHaveProperty('faceDetection');
      expect(response.body.data.capabilities).toHaveProperty('faceEmbedding');
      expect(response.body.data.capabilities).toHaveProperty(
        'attractivenessScoring'
      );
    });

    it('should include model metadata and configurations', async () => {
      const response = await request(baseURL)
        .get('/api/ml/models/status')
        .expect(200);

      expect(response.body.data.models.loaded).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.body.data.models.available)).toBe(true);
      expect(response.body.data.capabilities.batchProcessing).toBe(true);
      expect(typeof response.body.data.capabilities.maxBatchSize).toBe(
        'number'
      );
    });
  });

  describe('Single Image Processing Endpoint', () => {
    /**
     * @description Test single image processing endpoint
     * Verifies image upload and ML processing pipeline
     */
    it('should process valid face image successfully', async () => {
      const formData = new FormData();
      const imageBuffer = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );
      formData.append('image', new Blob([imageBuffer]), 'test-face.jpg');
      formData.append('userId', 'test-user-001');

      const response = await request(baseURL)
        .post('/api/ml/score')
        .attach('image', imageBuffer, 'test-face.jpg')
        .field('userId', 'test-user-001')
        .expect(200);

      expect(response.body).toMatchObject(EXPECTED_RESPONSES.successfulScore);
      expect(response.body.data.faceDetected).toBe(true);
      expect(Array.isArray(response.body.data.embedding)).toBe(true);
      expect(response.body.data.embedding.length).toBeGreaterThan(0);
    });

    it('should reject request without image', async () => {
      const response = await request(baseURL)
        .post('/api/ml/score')
        .field('userId', 'test-user-002')
        .expect(400);

      expect(response.body).toMatchObject(ERROR_RESPONSES.noImage);
    });

    it('should reject invalid file types', async () => {
      const textBuffer = Buffer.from('This is not an image', 'utf-8');

      const response = await request(baseURL)
        .post('/api/ml/score')
        .attach('image', textBuffer, 'test.txt')
        .field('userId', 'test-user-003')
        .expect(400);

      expect(response.body).toMatchObject(ERROR_RESPONSES.invalidFormat);
    });

    it('should handle large image files appropriately', async () => {
      // Create a large image buffer (simulate 5MB image)
      const largeImageBuffer = Buffer.alloc(5 * 1024 * 1024, 0);

      const response = await request(baseURL)
        .post('/api/ml/score')
        .attach('image', largeImageBuffer, 'large-image.jpg')
        .field('userId', 'test-user-004')
        .expect(413); // Payload too large

      expect(response.body.status).toBe('error');
    });

    it('should include processing metadata in response', async () => {
      const imageBuffer = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );

      const response = await request(baseURL)
        .post('/api/ml/score')
        .attach('image', imageBuffer, 'test-face.jpg')
        .field('userId', 'test-user-005')
        .expect(200);

      expect(response.body.data.qualityMetrics).toHaveProperty('faceQuality');
      expect(response.body.data.qualityMetrics).toHaveProperty('frontality');
      expect(response.body.data.qualityMetrics).toHaveProperty('symmetry');
      expect(response.body.data.qualityMetrics).toHaveProperty('resolution');
      expect(response.body.data.qualityMetrics).toHaveProperty('confidence');
      expect(response.body.data).toHaveProperty('processingTime');
    });
  });

  describe('Batch Image Processing Endpoint', () => {
    /**
     * @description Test batch image processing endpoint
     * Verifies multiple image upload and parallel processing
     */
    it('should process multiple images in batch', async () => {
      const imageBuffer1 = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );
      const imageBuffer2 = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );

      const response = await request(baseURL)
        .post('/api/ml/score/batch')
        .attach('images', imageBuffer1, 'face1.jpg')
        .attach('images', imageBuffer2, 'face2.jpg')
        .field('userId', 'test-user-batch-001')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.results)).toBe(true);
      expect(response.body.data.summary.totalImages).toBe(2);
    });

    it('should handle mixed success/failure in batch processing', async () => {
      const validImageBuffer = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );
      const invalidBuffer = Buffer.from('invalid', 'utf-8');

      const response = await request(baseURL)
        .post('/api/ml/score/batch')
        .attach('images', validImageBuffer, 'valid.jpg')
        .attach('images', invalidBuffer, 'invalid.txt')
        .field('userId', 'test-user-batch-002')
        .expect(200);

      expect(response.body.data.summary.totalImages).toBe(2);
      expect(response.body.data.summary.successfulImages).toBeLessThan(2);
      expect(response.body.data.summary.failedImages).toBeGreaterThan(0);
      expect(Array.isArray(response.body.data.summary.errors)).toBe(true);
    });

    it('should reject batch processing without images', async () => {
      const response = await request(baseURL)
        .post('/api/ml/score/batch')
        .field('userId', 'test-user-batch-003')
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('No image files provided');
    });

    it('should enforce batch size limits', async () => {
      // Create more images than the batch limit allows
      const requests: BatchRequest[] = [];
      for (let i = 0; i < 20; i++) {
        // Assuming batch limit is less than 20
        const imageBuffer = Buffer.from(
          TEST_IMAGES.validFace.split(',')[1],
          'base64'
        );
        requests.push({
          field: 'images',
          buffer: imageBuffer,
          filename: `face${i}.jpg`,
        });
      }

      const requestBuilder = request(baseURL).post('/api/ml/score/batch');
      requests.forEach(({ field, buffer, filename }) => {
        requestBuilder.attach(field, buffer, filename);
      });

      const response = await requestBuilder
        .field('userId', 'test-user-batch-004')
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Batch size exceeds limit');
    });
  });

  describe('Legacy Compatibility Endpoint', () => {
    /**
     * @description Test legacy face-score endpoint
     * Verifies backward compatibility with old API format
     */
    it('should process base64 image via legacy endpoint', async () => {
      const response = await request(baseURL)
        .post('/api/ml/face-score')
        .send({
          imageBase64: TEST_IMAGES.validFace,
        })
        .expect(200);

      // Legacy response format
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(true);
    });

    it('should reject imageUrl requests in legacy endpoint', async () => {
      const response = await request(baseURL)
        .post('/api/ml/face-score')
        .send({
          imageUrl: 'https://example.com/image.jpg',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        'imageUrl processing not implemented'
      );
    });

    it('should require either imageUrl or imageBase64', async () => {
      const response = await request(baseURL)
        .post('/api/ml/face-score')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain(
        'Either imageUrl or imageBase64 is required'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    /**
     * @description Test error handling and edge cases
     * Verifies proper error responses and graceful degradation
     */
    it('should handle malformed requests gracefully', async () => {
      const response = await request(baseURL)
        .post('/api/ml/score')
        .send('invalid json')
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('should handle concurrent requests properly', async () => {
      const imageBuffer = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );

      // Send multiple concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(baseURL)
          .post('/api/ml/score')
          .attach('image', imageBuffer, 'test-face.jpg')
          .field('userId', `concurrent-user-${i}`)
      );

      const responses = await Promise.all(promises);

      // All requests should complete successfully
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
      });
    });

    it('should maintain consistent response format across endpoints', async () => {
      const endpoints = [
        { method: 'get' as const, path: '/api/ml/health' },
        { method: 'get' as const, path: '/api/ml/models/status' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(baseURL)[endpoint.method](endpoint.path);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(['success', 'error']).toContain(response.body.status);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    /**
     * @description Test performance characteristics
     * Verifies response times and resource usage
     */
    it('should process images within acceptable time limits', async () => {
      const imageBuffer = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );
      const startTime = Date.now();

      const response = await request(baseURL)
        .post('/api/ml/score')
        .attach('image', imageBuffer, 'test-face.jpg')
        .field('userId', 'perf-test-user')
        .expect(200);

      const processingTime = Date.now() - startTime;

      // Should process within 30 seconds for integration tests
      expect(processingTime).toBeLessThan(30000);
      expect(response.body.data.processingTime).toBeGreaterThan(0);
    });

    it('should handle rapid sequential requests', async () => {
      const imageBuffer = Buffer.from(
        TEST_IMAGES.validFace.split(',')[1],
        'base64'
      );
      const results: TestResult[] = [];

      // Send 3 sequential requests rapidly
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        const response = await request(baseURL)
          .post('/api/ml/score')
          .attach('image', imageBuffer, 'test-face.jpg')
          .field('userId', `sequential-user-${i}`);

        results.push({
          status: response.status,
          processingTime: Date.now() - startTime,
        });
      }

      // All requests should succeed
      results.forEach((result: TestResult) => {
        expect(result.status).toBe(200);
        expect(result.processingTime).toBeLessThan(30000);
      });
    });
  });
});
