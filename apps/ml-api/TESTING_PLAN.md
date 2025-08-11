# ML API Testing Plan - Post Migration

## Overview

This document outlines the testing strategy to verify ML API functionality after monorepo migration and shared package integration.

## Testing Categories

### 1. Unit Tests

#### Type System Tests

```bash
# Verify TypeScript compilation with shared types
cd apps/ml-api
npm run build

# Expected: No TypeScript errors, successful compilation
```

#### Service Layer Tests

```typescript
// Test Face Score Service
import { faceScoreService } from './src/services/faceScoreService';

describe('FaceScoreService', () => {
  test('should process valid image data', async () => {
    const testImageData = 'data:image/jpeg;base64,test...';
    const result = await faceScoreService.scoreFace(testImageData);

    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.features).toBeDefined();
  });

  test('should handle processing errors', async () => {
    await expect(faceScoreService.scoreFace('')).rejects.toThrow();
  });
});
```

#### Error Handling Tests

```typescript
// Test shared error utilities integration
import { ProcessingError, ValidationError } from '@shared/utils';

describe('Error Handling', () => {
  test('should use shared error classes', () => {
    const error = new ProcessingError('Test error');
    expect(error.type).toBe('processing_error');
    expect(error.statusCode).toBe(422);
  });
});
```

### 2. Integration Tests

#### API Endpoint Tests

```typescript
import request from 'supertest';
import app from '../src/index';

describe('ML API Endpoints', () => {
  test('GET / - Health check', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('ML Face Score API');
  });

  test('POST /api/face-score - Valid request', async () => {
    const response = await request(app).post('/api/face-score').send({
      imageBase64: 'data:image/jpeg;base64,test...',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.score).toBeDefined();
  });

  test('POST /api/face-score - Invalid request', async () => {
    const response = await request(app).post('/api/face-score').send({});

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  test('GET /api/health - Service health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.services).toBeDefined();
  });
});
```

#### Shared Package Integration Tests

```typescript
describe('Shared Packages Integration', () => {
  test('should use shared logger', () => {
    const { logger } = require('@shared/utils');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  test('should use shared types', () => {
    const { FaceScoreRequest } = require('@shared/types');
    expect(FaceScoreRequest).toBeDefined();
  });

  test('should use shared error classes', () => {
    const { ValidationError } = require('@shared/utils');
    expect(ValidationError).toBeDefined();
  });
});
```

### 3. Performance Tests

#### Response Time Tests

```typescript
describe('Performance Tests', () => {
  test('face scoring should complete within reasonable time', async () => {
    const start = Date.now();
    await faceScoreService.scoreFace('test-image-data');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

#### Memory Usage Tests

```typescript
describe('Memory Tests', () => {
  test('should not have memory leaks during processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Process multiple requests
    for (let i = 0; i < 10; i++) {
      await faceScoreService.scoreFace('test-data');
    }

    // Force garbage collection if available
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

### 4. Docker Tests

#### Container Build Test

```bash
# Test Docker container build
cd apps/ml-api
docker build -t ml-api-test .

# Expected: Successful build with no errors
```

#### Container Runtime Test

```bash
# Test container runtime
docker run -d -p 3001:3000 --name ml-api-test ml-api-test

# Wait for startup
sleep 10

# Test API availability
curl http://localhost:3001/api/health

# Expected: {"status":"healthy",...}

# Cleanup
docker stop ml-api-test
docker rm ml-api-test
```

### 5. Environment Tests

#### Development Environment

```bash
# Test development setup
cd apps/ml-api
npm install
npm run dev

# Test API endpoints manually or with automated scripts
```

#### Production Environment

```bash
# Test production build
npm run build
npm start

# Verify production-ready features:
# - Proper logging
# - Error handling
# - Performance metrics
```

### 6. Regression Tests

#### API Compatibility Tests

```typescript
describe('API Compatibility', () => {
  test('should maintain backward compatibility', async () => {
    // Test that existing API clients still work
    const response = await request(app).post('/api/face-score').send({
      imageUrl: 'http://example.com/image.jpg',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

#### Data Format Tests

```typescript
describe('Data Format Compatibility', () => {
  test('should return expected response format', async () => {
    const response = await request(app)
      .post('/api/face-score')
      .send({ imageBase64: 'test-data' });

    expect(response.body).toMatchObject({
      status: expect.stringMatching(/^(success|error)$/),
      message: expect.any(String),
      data: expect.any(Object),
    });
  });
});
```

## Test Execution Plan

### Phase 1: Local Development Testing

1. **Setup**: Install dependencies and build project
2. **Unit Tests**: Run all unit tests (`npm test`)
3. **Integration Tests**: Test API endpoints and shared package integration
4. **Manual Testing**: Verify major user flows

### Phase 2: Container Testing

1. **Build Test**: Verify Docker container builds successfully
2. **Runtime Test**: Test container in isolated environment
3. **Network Test**: Verify container networking and port mapping

### Phase 3: Performance Testing

1. **Load Testing**: Test with multiple concurrent requests
2. **Memory Testing**: Monitor memory usage under load
3. **Response Time**: Measure API response times

### Phase 4: Production Readiness

1. **Security Testing**: Verify input validation and error handling
2. **Monitoring**: Test logging and health check endpoints
3. **Scalability**: Verify configuration for production deployment

## Success Criteria

### Functional Requirements

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] API endpoints respond correctly
- [ ] Error handling works as expected
- [ ] Shared packages integrate properly

### Performance Requirements

- [ ] API response time < 5 seconds for face scoring
- [ ] No memory leaks during continuous operation
- [ ] Docker container starts successfully
- [ ] Health check endpoint responds within 1 second

### Quality Requirements

- [ ] TypeScript compilation succeeds
- [ ] No linting errors
- [ ] Code coverage > 80%
- [ ] All deprecated code properly marked

### Compatibility Requirements

- [ ] Backward compatibility maintained
- [ ] Response formats unchanged
- [ ] Existing API clients continue to work

## Test Commands

```bash
# Install dependencies
npm install

# Run TypeScript compilation
npm run build

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Build and test Docker container
npm run docker:build
npm run docker:run

# Development server
npm run dev
```

## Monitoring and Validation

### Health Check Validation

```bash
# Verify health endpoint
curl http://localhost:3000/api/health | jq .

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-08-11T07:08:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0",
  "services": {
    "redis": true,
    "queue": true,
    "models": true
  }
}
```

### API Response Validation

```bash
# Test face scoring endpoint
curl -X POST http://localhost:3000/api/face-score \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"data:image/jpeg;base64,test..."}' | jq .

# Expected response format:
{
  "status": "success",
  "message": "Face score calculated successfully",
  "data": {
    "score": 85.67,
    "confidence": 0.89,
    "features": {
      "symmetry": 78.45,
      "clarity": 92.13,
      "lighting": 81.76
    },
    "processingTime": 150,
    "timestamp": "2025-08-11T07:08:00.000Z"
  }
}
```

## Post-Migration Validation Checklist

- [ ] All tests pass successfully
- [ ] No TypeScript compilation errors
- [ ] Docker container builds and runs
- [ ] API endpoints respond correctly
- [ ] Shared packages work as expected
- [ ] Logging functions properly
- [ ] Error handling uses shared utilities
- [ ] Performance meets requirements
- [ ] Memory usage is stable
- [ ] Health checks are functional

## Notes

- Run tests in both development and production modes
- Test with various image formats and sizes
- Verify graceful handling of edge cases
- Monitor logs for any warnings or errors
- Test Redis connectivity and queue functionality
- Validate environment variable handling
