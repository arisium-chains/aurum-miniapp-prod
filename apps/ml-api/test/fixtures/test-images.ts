/**
 * @description Test image fixtures for ML service integration tests
 * Contains base64 encoded test images and expected responses
 */

export const TEST_IMAGES = {
  // Valid face image (small test image)
  validFace:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',

  // Invalid image (too small)
  tooSmall:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',

  // No face detected
  noFace:
    'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',

  // Poor quality face
  poorQuality:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAAQAAsDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
};

export const EXPECTED_RESPONSES = {
  healthCheck: {
    status: 'success',
    message: 'Advanced ML API is operational',
    data: {
      status: 'healthy',
      service: 'advanced-ml-api',
      version: '2.0.0',
      uptime: expect.any(Number),
      memory: expect.any(Object),
      models: {
        initialized: true,
        count: expect.any(Number),
      },
      timestamp: expect.any(String),
    },
  },

  modelStatus: {
    status: 'success',
    message: 'ML models status retrieved successfully',
    data: {
      service: 'advanced-ml-api',
      overall: 'healthy',
      models: {
        loaded: expect.any(Number),
        available: expect.any(Array),
      },
      capabilities: {
        faceDetection: expect.any(Boolean),
        faceEmbedding: expect.any(Boolean),
        attractivenessScoring: expect.any(Boolean),
        batchProcessing: true,
        maxBatchSize: expect.any(Number),
      },
      timestamp: expect.any(String),
    },
  },

  successfulScore: {
    status: 'success',
    message: 'Face score calculated successfully using advanced ONNX models',
    data: {
      faceDetected: true,
      embedding: expect.any(Array),
      attractivenessScore: expect.any(Number),
      qualityMetrics: {
        faceQuality: expect.any(Number),
        frontality: expect.any(Number),
        symmetry: expect.any(Number),
        resolution: expect.any(Number),
        confidence: expect.any(Number),
      },
      processingTime: expect.any(Number),
      timestamp: expect.any(String),
    },
  },
};

export const ERROR_RESPONSES = {
  noImage: {
    status: 'error',
    message: 'No image file provided',
    data: null,
  },

  invalidFormat: {
    status: 'error',
    message: expect.stringContaining('Invalid file type'),
    data: null,
  },

  noFaceDetected: {
    status: 'error',
    message: expect.stringContaining('No face detected'),
    data: null,
  },

  poorQuality: {
    status: 'error',
    message: expect.stringContaining('Face quality too low'),
    data: null,
  },
};
