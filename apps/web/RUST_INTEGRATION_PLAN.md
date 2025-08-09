# Rust ML Components Integration Plan

## Overview

This document outlines the detailed integration plan for incorporating the Rust-based ML services (face detection and face embedding extraction) with the existing Node.js-based Aurum Circle Miniapp. The integration will maintain backward compatibility while providing significant performance improvements.

## Integration Architecture

### Current Architecture (Simplified)

```
Next.js App → Redis Queue → Node.js ML Workers → Simulated ML → Qdrant DB
```

### New Architecture with Rust Services

```
Next.js App → Redis Queue → Node.js ML Workers → Rust ML Services → Qdrant DB
                                      ↓
                              Health Monitoring
```

## Integration Components

### 1. Node.js Worker Modification

The existing Node.js workers will be modified to call the Rust services instead of using simulated ML functions.

#### Current Worker Implementation (Simplified)

```javascript
// ml-face-score-api/src/workers/faceScoring.worker.ts
import { Worker } from "bullmq";
import { processImage } from "../services/scorer"; // Simulated ML

const faceScoringWorker = new Worker("faceScoring", async (job) => {
  const result = await processImage(image); // Simulated processing
  return result;
});
```

#### Modified Worker Implementation

```javascript
// ml-face-score-api/src/workers/faceScoring.worker.ts
import { Worker } from "bullmq";
import axios from "axios";

// Rust service endpoints
const FACE_DETECTION_SERVICE =
  process.env.FACE_DETECTION_SERVICE || "http://face-detection-service:8001";
const FACE_EMBEDDING_SERVICE =
  process.env.FACE_EMBEDDING_SERVICE || "http://face-embedding-service:8002";

const faceScoringWorker = new Worker("faceScoring", async (job) => {
  const { image, isBase64 } = job.data;

  try {
    // Step 1: Detect faces using Rust service
    const detectionResponse = await axios.post(
      `${FACE_DETECTION_SERVICE}/api/detect-face`,
      {
        image: isBase64 ? image : await readFileAsBase64(image),
        min_confidence: 0.7,
      }
    );

    if (
      !detectionResponse.data.success ||
      detectionResponse.data.faces.length === 0
    ) {
      throw new Error("No faces detected in image");
    }

    const face = detectionResponse.data.faces[0]; // Use first detected face

    // Step 2: Extract face embedding using Rust service
    const embeddingResponse = await axios.post(
      `${FACE_EMBEDDING_SERVICE}/api/extract-embedding`,
      {
        image: isBase64 ? image : await readFileAsBase64(image),
        aligned: false, // Let Rust service handle alignment if needed
      }
    );

    if (!embeddingResponse.data.success) {
      throw new Error("Failed to extract face embedding");
    }

    const embedding = embeddingResponse.data.embedding;

    // Step 3: Return results in expected format
    return {
      embedding: embedding.embedding,
      quality: embedding.quality,
      confidence: embedding.confidence,
      faceId: generateFaceId(embedding.embedding, face),
      detectionData: face,
    };
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
});
```

### 2. API Client for Rust Services

A dedicated client module will be created to handle communication with Rust services.

```javascript
// ml-face-score-api/src/services/rust-ml-client.js
import axios from "axios";

class RustMLClient {
  constructor() {
    this.faceDetectionService =
      process.env.FACE_DETECTION_SERVICE ||
      "http://face-detection-service:8001";
    this.faceEmbeddingService =
      process.env.FACE_EMBEDDING_SERVICE ||
      "http://face-embedding-service:8002";
    this.timeout = parseInt(process.env.ML_SERVICE_TIMEOUT || "5000");
  }

  async detectFaces(imageBase64) {
    try {
      const response = await axios.post(
        `${this.faceDetectionService}/api/detect-face`,
        {
          image: imageBase64,
        },
        {
          timeout: this.timeout,
        }
      );

      if (response.data.success) {
        return response.data.faces;
      } else {
        throw new Error(response.data.message || "Face detection failed");
      }
    } catch (error) {
      console.error("Face detection error:", error.message);
      throw error;
    }
  }

  async extractEmbedding(imageBase64, aligned = false) {
    try {
      const response = await axios.post(
        `${this.faceEmbeddingService}/api/extract-embedding`,
        {
          image: imageBase64,
          aligned: aligned,
        },
        {
          timeout: this.timeout,
        }
      );

      if (response.data.success) {
        return response.data.embedding;
      } else {
        throw new Error(response.data.message || "Embedding extraction failed");
      }
    } catch (error) {
      console.error("Embedding extraction error:", error.message);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const detectionHealth = await axios.get(
        `${this.faceDetectionService}/api/health`
      );
      const embeddingHealth = await axios.get(
        `${this.faceEmbeddingService}/api/health`
      );

      return {
        status: "healthy",
        services: {
          faceDetection: detectionHealth.data,
          faceEmbedding: embeddingHealth.data,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }
}

export const rustMLClient = new RustMLClient();
```

### 3. Fallback Mechanism

The integration will include a fallback mechanism to the simulated ML components if Rust services are unavailable.

```javascript
// ml-face-score-api/src/services/hybrid-scorer.js
import { rustMLClient } from "./rust-ml-client";
import { processImage as simulatedProcessImage } from "./scorer"; // Simulated ML

export class HybridScorer {
  constructor() {
    this.useRealML = process.env.USE_REAL_ML !== "false";
  }

  async processImage(imageBase64) {
    // Try real ML first if enabled
    if (this.useRealML) {
      try {
        // Check if Rust services are healthy
        const health = await rustMLClient.healthCheck();
        if (health.status === "healthy") {
          // Use Rust services
          const faces = await rustMLClient.detectFaces(imageBase64);
          if (faces.length === 0) {
            throw new Error("No faces detected");
          }

          const face = faces[0]; // Use first face
          const embedding = await rustMLClient.extractEmbedding(imageBase64);

          return {
            embedding: embedding.embedding,
            quality: embedding.quality,
            frontality: this.calculateFrontality(face),
            symmetry: this.calculateSymmetry(face),
            resolution: this.calculateResolution(face, imageBase64),
            confidence: embedding.confidence,
          };
        }
      } catch (error) {
        console.warn(
          "Rust ML services unavailable, falling back to simulated ML:",
          error.message
        );
      }
    }

    // Fallback to simulated ML
    return await simulatedProcessImage(imageBase64);
  }

  calculateFrontality(face) {
    // Calculate frontality based on facial landmarks
    const leftEye = face.landmarks.left_eye;
    const rightEye = face.landmarks.right_eye;
    const nose = face.landmarks.nose;

    const eyeHeightDiff = Math.abs(leftEye[1] - rightEye[1]);
    const frontality = 1.0 - Math.min(1.0, eyeHeightDiff / 100);

    return Math.max(0.1, frontality); // Ensure minimum value
  }

  calculateSymmetry(face) {
    // Calculate symmetry based on facial landmarks
    const faceCenterX = face.bbox.x + face.bbox.width / 2;
    const noseDeviation = Math.abs(face.landmarks.nose[0] - faceCenterX);
    const symmetry = 1.0 - Math.min(1.0, noseDeviation / 50);

    return Math.max(0.1, symmetry); // Ensure minimum value
  }

  calculateResolution(face, imageBase64) {
    // Estimate resolution based on face size and image data
    const faceArea = face.bbox.width * face.bbox.height;
    const imageSize = imageBase64.length;

    const resolution = Math.min(1.0, faceArea / 10000 + imageSize / 1000000);
    return Math.max(0.1, resolution); // Ensure minimum value
  }
}
```

### 4. Configuration Management

Environment variables will be used to configure the integration:

```bash
# .env.example
# Rust ML Services Configuration
FACE_DETECTION_SERVICE=http://face-detection-service:8001
FACE_EMBEDDING_SERVICE=http://face-embedding-service:8002
ML_SERVICE_TIMEOUT=5000
USE_REAL_ML=true

# Fallback Configuration
FALLBACK_TO_SIMULATED=true
SIMULATED_ML_THRESHOLD=0.7
```

## Data Flow Integration

### 1. Job Queue Processing

The existing BullMQ queue system will remain unchanged, but the worker implementation will be updated:

```javascript
// Updated worker with Rust integration
const faceScoringWorker = new Worker("faceScoring", async (job) => {
  const { imageBase64 } = job.data;

  try {
    // Process image with hybrid scorer (real ML with fallback)
    const hybridScorer = new HybridScorer();
    const result = await hybridScorer.processImage(imageBase64);

    // Convert to expected format for existing system
    const processedResult = {
      embedding: result.embedding,
      quality: result.quality,
      frontality: result.frontality,
      symmetry: result.symmetry,
      resolution: result.resolution,
      confidence: result.confidence,
    };

    return processedResult;
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
});
```

### 2. API Endpoint Integration

The existing API endpoints will be updated to use the new hybrid processing:

```javascript
// src/app/api/attractiveness/score/route.ts (updated sections)
import { HybridScorer } from "@/lib/ml-models/hybrid-scorer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, image, nftVerified, wldVerified, useRealML = false } = body;

    // Create scoring request
    const scoringRequest: ScoringRequest = {
      userId,
      imageBase64: image,
      metadata: {
        nftVerified: nftVerified || false,
        wldVerified: wldVerified || false,
        timestamp: new Date().toISOString(),
      },
    };

    // Use hybrid scorer for processing
    const hybridScorer = new HybridScorer();
    hybridScorer.useRealML = useRealML;

    const processedFace = await hybridScorer.processImage(image);

    // Rest of the existing logic remains the same...
    // ... (vector store update, score calculation, etc.)
  } catch (error) {
    // Error handling remains the same...
  }
}
```

## Service Discovery and Load Balancing

### 1. Docker Compose Configuration

The docker-compose.yml file will be updated to include the Rust services:

```yaml
# docker-compose.yml (updated sections)
services:
  # Existing services...

  # Rust ML Services
  face-detection-service:
    build: ./rust-ml-services/face-detection-service
    ports:
      - "8001:8001"
    environment:
      - PORT=8001
      - MODEL_PATH=/models/blazeface.onnx
      - LOG_LEVEL=info
    volumes:
      - ./models:/app/models
    restart: unless-stopped
    depends_on:
      - redis

  face-embedding-service:
    build: ./rust-ml-services/face-embedding-service
    ports:
      - "8002:8002"
    environment:
      - PORT=8002
      - MODEL_PATH=/models/arcface_resnet100.onnx
      - LOG_LEVEL=info
    volumes:
      - ./models:/app/models
    restart: unless-stopped
    depends_on:
      - redis

  # Updated app service to depend on Rust services
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - FACE_DETECTION_SERVICE=http://face-detection-service:8001
      - FACE_EMBEDDING_SERVICE=http://face-embedding-service:8002
    depends_on:
      - redis
      - qdrant
      - face-detection-service
      - face-embedding-service
    volumes:
      - ./public/models:/app/public/models
    restart: unless-stopped
```

### 2. Health Monitoring

Health checks will be implemented to monitor the status of Rust services:

```javascript
// ml-face-score-api/src/api/ml-status.ts (updated)
import { rustMLClient } from "../services/rust-ml-client";

export async function GET(request: NextRequest) {
  try {
    // Check Rust ML service health
    const rustHealth = await rustMLClient.healthCheck();

    // Check if we should use real ML based on health
    const shouldUseRealML = rustHealth.status === "healthy";

    return NextResponse.json({
      success: true,
      data: {
        health: {
          status: rustHealth.status,
          details: {
            faceDetection:
              rustHealth.services?.faceDetection?.status === "healthy",
            faceEmbedding:
              rustHealth.services?.faceEmbedding?.status === "healthy",
            overall: shouldUseRealML,
          },
        },
        recommendations: {
          shouldUseRealML,
          fallbackMode: !shouldUseRealML,
        },
      },
    });
  } catch (error) {
    console.error("ML status check error:", error);
    // Fallback to simulated ML status
    return NextResponse.json({
      success: false,
      data: {
        health: {
          status: "unhealthy",
          details: {
            faceDetection: false,
            faceEmbedding: false,
            overall: false,
          },
        },
        recommendations: {
          shouldUseRealML: false,
          fallbackMode: true,
        },
      },
    });
  }
}
```

## Error Handling and Fallbacks

### 1. Graceful Degradation

The system will gracefully degrade to simulated ML when Rust services are unavailable:

```javascript
// Error handling in hybrid scorer
async processImage(imageBase64) {
  // Try real ML first
  if (this.useRealML) {
    try {
      const result = await this.tryRealML(imageBase64);
      return result;
    } catch (error) {
      console.warn('Real ML failed, falling back to simulated:', error.message);
      // Continue to fallback
    }
  }

  // Fallback to simulated ML
  return await this.simulatedProcessImage(imageBase64);
}

async tryRealML(imageBase64) {
  // Implementation with timeout and retry logic
  const maxRetries = 3;
  const timeout = 5000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await this.rustMLClient.processImage(imageBase64, { signal: controller.signal });
      clearTimeout(timeoutId);

      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error; // Last retry, rethrow error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
```

## Performance Monitoring

### 1. Metrics Collection

Metrics will be collected to monitor the performance of Rust services:

```javascript
// Performance monitoring in hybrid scorer
class PerformanceMonitor {
  static recordOperation(operation, duration, success) {
    // In a real implementation, this would send metrics to a monitoring service
    console.log(`Operation ${operation}: ${duration}ms, success: ${success}`);
  }

  static recordFallback(from, to) {
    console.log(`Fallback from ${from} to ${to}`);
  }
}

// Usage in processing
async processImage(imageBase64) {
  const startTime = Date.now();

  try {
    let result;
    if (this.useRealML) {
      try {
        result = await this.tryRealML(imageBase64);
        PerformanceMonitor.recordOperation('real_ml', Date.now() - startTime, true);
      } catch (error) {
        PerformanceMonitor.recordOperation('real_ml', Date.now() - startTime, false);
        PerformanceMonitor.recordFallback('real_ml', 'simulated');
        result = await this.simulatedProcessImage(imageBase64);
      }
    } else {
      result = await this.simulatedProcessImage(imageBase64);
      PerformanceMonitor.recordOperation('simulated', Date.now() - startTime, true);
    }

    return result;
  } catch (error) {
    PerformanceMonitor.recordOperation('processing', Date.now() - startTime, false);
    throw error;
  }
}
```

## Testing Strategy

### 1. Integration Tests

Integration tests will verify that the Rust services work correctly with the existing system:

```javascript
// integration.test.js
describe("Rust ML Integration", () => {
  test("should process image with Rust services", async () => {
    const imageBase64 = "..."; // Test image

    const hybridScorer = new HybridScorer();
    hybridScorer.useRealML = true;

    const result = await hybridScorer.processImage(imageBase64);

    expect(result).toHaveProperty("embedding");
    expect(result.embedding).toHaveLength(512);
    expect(result.quality).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  test("should fallback to simulated ML when Rust services are down", async () => {
    // Mock Rust services to be down
    jest
      .spyOn(rustMLClient, "healthCheck")
      .mockRejectedValue(new Error("Service unavailable"));

    const imageBase64 = "..."; // Test image

    const hybridScorer = new HybridScorer();
    hybridScorer.useRealML = true;

    const result = await hybridScorer.processImage(imageBase64);

    // Should still return a result (from simulated ML)
    expect(result).toBeDefined();
  });
});
```

## Deployment Considerations

### 1. Environment-Specific Configuration

Different configurations for development, staging, and production:

```bash
# Development (.env.local)
FACE_DETECTION_SERVICE=http://localhost:8001
FACE_EMBEDDING_SERVICE=http://localhost:8002
USE_REAL_ML=false  # Use simulated ML for development

# Staging (.env.staging)
FACE_DETECTION_SERVICE=http://face-detection-staging:8001
FACE_EMBEDDING_SERVICE=http://face-embedding-staging:8002
USE_REAL_ML=true

# Production (.env.production)
FACE_DETECTION_SERVICE=http://face-detection-prod:8001
FACE_EMBEDDING_SERVICE=http://face-embedding-prod:8002
USE_REAL_ML=true
```

### 2. Rolling Updates

Docker Compose configuration for rolling updates:

```yaml
# docker-compose.prod.yml
services:
  face-detection-service:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## Migration Path

### Phase 1: Development Environment

- Set up Rust services in development
- Implement hybrid scorer
- Test integration locally

### Phase 2: Staging Environment

- Deploy to staging with real ML enabled
- Monitor performance and accuracy
- Validate fallback mechanisms

### Phase 3: Production Deployment

- Deploy to production with gradual rollout
- Monitor metrics and error rates
- Enable real ML for all users

### Phase 4: Optimization

- Performance tuning based on production data
- Advanced features implementation
- Documentation and knowledge transfer

## Backward Compatibility

The integration maintains full backward compatibility:

- Existing API endpoints remain unchanged
- Data formats are preserved
- Fallback to simulated ML ensures no functionality is lost
- Environment variables control the behavior

This approach ensures a smooth transition to the Rust-based ML services while maintaining system reliability and performance.
