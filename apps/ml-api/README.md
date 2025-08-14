# Advanced ML Face Scoring API with ONNX Integration

A production-ready standalone ML service providing facial attractiveness scoring with real ONNX model processing, batch capabilities, and comprehensive monitoring.

## 🚀 Migration Summary

**Migration from Nested to Standalone Architecture (2025-08-11)**

- **Before**: Nested ML API (`apps/web/ml-face-score-api-nodejs/`) with architectural boundary violations
- **After**: Clean standalone ML service (`apps/ml-api/`) with enhanced ONNX integration
- **Benefits**: Better separation of concerns, improved scalability, enhanced ML capabilities, robust error handling

## 🏗️ Architecture Overview

```
Web Application → ML Service Client → Standalone ML API → ONNX Runtime
                      ↓                       ↓              ↓
                   Fallback              BullMQ Queues    Face Detection
                   Handling              Redis Cache      Face Embedding
                                                         Attractiveness Scoring
```

## ✨ Features

### Core ML Capabilities

- **Real ONNX Model Processing** - Face detection, embedding extraction, and attractiveness scoring
- **Fallback Mechanisms** - Graceful degradation to simulated ML when models unavailable
- **Batch Processing** - Process multiple images in parallel with configurable batch sizes
- **Quality Validation** - Comprehensive face quality metrics and thresholds

### Production-Ready Infrastructure

- **BullMQ Queues** - Advanced queue management with monitoring dashboard
- **Redis Caching** - High-performance caching layer
- **Rate Limiting** - Configurable request throttling
- **Health Monitoring** - Detailed service and model status endpoints
- **Comprehensive Logging** - Structured logging with request tracking

### Monorepo Integration

- **Shared Types** - Consistent type definitions across services using `@shared/types`
- **Shared Utilities** - Standardized error handling and logging via `@shared/utils`
- **Shared Configuration** - Common config patterns through `@shared/config`

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
SERVICE_NAME=ml-api

# Redis Configuration
REDIS_URL=redis://localhost:6380
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_DB=0

# BullMQ Configuration
BULLMQ_QUEUE_NAME=ml-scoring
BULLMQ_CONCURRENCY=5

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760       # 10MB
UPLOAD_DIR=./uploads

# Model Configuration
MODEL_PATH=./models
FACE_DETECTION_MODEL=face_detection.onnx
FACE_EMBEDDING_MODEL=face_embedding.onnx
ATTRACTIVENESS_MODEL=attractiveness_model.onnx

# Security Configuration
API_KEY_HEADER=x-api-key
API_KEY_SECRET=your-api-key-secret
CORS_ORIGIN=http://localhost:3000

# ML Processing Configuration
ML_BATCH_SIZE=10
ML_TIMEOUT=30000
ML_MAX_RETRIES=3

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
```

## 📡 API Endpoints

### Core ML Processing

#### POST `/api/ml/score`

Process a single image for facial attractiveness scoring.

**Request (Multipart Form):**

```
image: File (required) - Image file (JPEG, PNG, WebP, BMP)
userId: string (optional) - User identifier
sessionId: string (optional) - Session identifier
```

**Response:**

```json
{
  "status": "success",
  "message": "Face score calculated successfully using advanced ONNX models",
  "data": {
    "score": 0.87,
    "percentile": 87.5,
    "vibeTags": ["stunning", "attractive"],
    "timestamp": "2025-08-11T09:30:00.000Z",
    "metadata": {
      "faceQuality": 0.92,
      "frontality": 0.89,
      "symmetry": 0.85,
      "resolution": 0.95,
      "totalUsers": 10000,
      "userRank": 1250,
      "confidence": 0.91
    },
    "processingTime": 245,
    "faceDetected": true,
    "faceCount": 1,
    "embeddings": [0.1234, -0.5678, ...]
  }
}
```

#### POST `/api/ml/score/batch`

Process multiple images in parallel.

**Request (Multipart Form):**

```
images: File[] (required) - Array of image files (max 10 by default)
userId: string (optional) - User identifier
sessionId: string (optional) - Session identifier
```

**Response:**

```json
{
  "status": "success",
  "message": "Batch processing completed: 8/10 images processed successfully",
  "data": {
    "results": [
      {
        "score": 0.87,
        "percentile": 87.5,
        "vibeTags": ["stunning"],
        "timestamp": "2025-08-11T09:30:00.000Z",
        "metadata": {
          /* ... */
        },
        "processingTime": 245,
        "faceDetected": true,
        "faceCount": 1
      }
    ],
    "summary": {
      "totalImages": 10,
      "successfulImages": 8,
      "failedImages": 2,
      "totalProcessingTime": 2450,
      "averageProcessingTime": 306,
      "errors": ["Image 3: No face detected", "Image 7: Face quality too low"]
    }
  }
}
```

### Model Status and Health

#### GET `/api/ml/models/status`

Get detailed model status and capabilities.

**Response:**

```json
{
  "status": "success",
  "message": "ML models status retrieved successfully",
  "data": {
    "service": "advanced-ml-api",
    "overall": "healthy",
    "models": {
      "loaded": 3,
      "available": [
        {
          "name": "face_detection",
          "inputShape": [1, 3, 224, 224],
          "outputShape": [-1, 5]
        },
        {
          "name": "face_embedding",
          "inputShape": [1, 3, 224, 224],
          "outputShape": [1, 512]
        },
        {
          "name": "attractiveness",
          "inputShape": [1, 512],
          "outputShape": [1, 2]
        }
      ]
    },
    "capabilities": {
      "faceDetection": true,
      "faceEmbedding": true,
      "attractivenessScoring": true,
      "batchProcessing": true,
      "maxBatchSize": 10
    },
    "timestamp": "2025-08-11T09:30:00.000Z"
  }
}
```

#### GET `/api/ml/health`

Comprehensive health check endpoint.

**Response:**

```json
{
  "status": "success",
  "message": "Advanced ML API is operational",
  "data": {
    "status": "healthy",
    "service": "advanced-ml-api",
    "version": "2.0.0",
    "uptime": 3600.45,
    "memory": {
      "rss": 157286400,
      "heapTotal": 89522176,
      "heapUsed": 65890304,
      "external": 23654912
    },
    "models": {
      "initialized": true,
      "count": 3
    },
    "timestamp": "2025-08-11T09:30:00.000Z"
  }
}
```

### Legacy Compatibility

#### POST `/api/ml/face-score` (Legacy)

Legacy endpoint for backward compatibility.

**Request:**

```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "score": 0.87,
    "percentile": 87.5,
    "vibeTags": ["stunning", "attractive"],
    "timestamp": "2025-08-11T09:30:00.000Z",
    "metadata": {
      /* ... */
    }
  },
  "timestamp": "2025-08-11T09:30:00.000Z"
}
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis server
- ONNX model files (placed in `./models/` directory)

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd apps/ml-api

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Start Redis (if not running)
redis-server

# Start development server
npm run dev

# Start worker process (in separate terminal)
npm run dev:worker
```

### Production Setup

```bash
# Build the application
npm run build

# Start production server
npm start

# Start worker process
npm run start:worker
```

### Docker Setup

```bash
# Build and start with Docker Compose
docker-compose up --build

# For production deployment
docker-compose -f docker-compose.prod.yml up --build
```

## 🧪 Testing

### Running Tests

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Add test images to queue (development)
npx ts-node src/test-queue.ts
```

### Manual API Testing

```bash
# Health check
curl http://localhost:3000/api/ml/health

# Model status
curl http://localhost:3000/api/ml/models/status

# Test image processing (with file upload)
curl -X POST \
  -F "image=@/path/to/test-image.jpg" \
  -F "userId=test-user" \
  http://localhost:3000/api/ml/score

# Legacy endpoint test
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"data:image/jpeg;base64,test..."}' \
  http://localhost:3000/api/ml/face-score
```

## 🔧 Performance Tuning

### Queue Configuration

```typescript
// config/index.ts
bullmq: {
  queueName: 'ml-scoring',
  concurrency: 5,  // Adjust based on CPU cores
}

ml: {
  batchSize: 10,     // Max images per batch request
  timeout: 30000,    // Processing timeout (ms)
  maxRetries: 3,     // Retry failed jobs
}
```

### Memory Optimization

```bash
# For high-throughput scenarios
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Redis Optimization

```bash
# redis.conf optimizations for ML workloads
maxmemory 2gb
maxmemory-policy allkeys-lru
save 60 1000
```

## 📊 Monitoring and Observability

### Health Check Endpoints

- `GET /api/ml/health` - Service health status
- `GET /api/ml/models/status` - Model status and capabilities
- `GET /health` - Basic health check

### Logging

The service uses structured logging with the following levels:

- `error` - Critical errors requiring attention
- `warn` - Warning conditions and fallbacks
- `info` - General information and request logs
- `debug` - Detailed debugging information

### Metrics

Key metrics monitored:

- Processing time per image
- Success/failure rates
- Queue depth and processing speed
- Memory usage and model performance
- Redis cache hit rates

## 🚨 Error Handling

### Common Error Responses

```json
{
  "status": "error",
  "message": "Face quality is too low for accurate scoring",
  "data": {
    "errorType": "FACE_QUALITY_INSUFFICIENT",
    "details": {
      "faceQuality": 0.45,
      "threshold": 0.6,
      "suggestions": [
        "Ensure good lighting",
        "Use frontal face angle",
        "Increase image resolution"
      ]
    }
  }
}
```

### Error Types

- `VALIDATION_ERROR` - Input validation failures
- `FACE_DETECTION_FAILED` - No face detected in image
- `FACE_QUALITY_INSUFFICIENT` - Face quality below threshold
- `PROCESSING_ERROR` - Internal processing failures
- `MODEL_UNAVAILABLE` - ML models not loaded
- `QUEUE_ERROR` - Queue processing failures

## 🔐 Security Considerations

### Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Bypass available with API key authentication

### Input Validation

- File type validation (JPEG, PNG, WebP, BMP)
- File size limits (default 10MB)
- Base64 validation for legacy endpoints
- Image content validation

### API Security

- CORS configuration
- Helmet security headers
- Request sanitization
- Optional API key authentication

## 🐛 Troubleshooting

### Common Issues

#### Models Not Loading

```bash
# Check model files exist
ls -la ./models/
# Expected: face_detection.onnx, face_embedding.onnx, attractiveness_model.onnx

# Check permissions
chmod 644 ./models/*.onnx

# Verify model format
file ./models/face_detection.onnx
```

#### Redis Connection Issues

```bash
# Test Redis connectivity
redis-cli ping
# Expected: PONG

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

#### High Memory Usage

```bash
# Monitor memory usage
ps aux | grep node

# Check for memory leaks
node --inspect src/index.ts
```

#### Queue Processing Delays

```bash
# Check queue status
curl http://localhost:3000/api/ml/models/status | jq '.data.queue'

# Increase concurrency
export BULLMQ_CONCURRENCY=10
```

## 📦 Dependencies

### Core Dependencies

- `onnxruntime-node` - ONNX model inference
- `sharp` - Image processing and optimization
- `bullmq` - Advanced queue management
- `ioredis` - Redis client with clustering support
- `express` - Web framework
- `helmet` - Security middleware
- `joi` - Input validation

### Shared Packages

- `@shared/types` - Common type definitions
- `@shared/utils` - Error handling and logging utilities
- `@shared/config` - Configuration management

## 🔄 Migration from Nested API

If migrating from the old nested API structure:

1. **Update environment variables** to match new schema
2. **Replace model integration** with new ML service client
3. **Update API endpoints** to use new `/api/ml/*` routes
4. **Test fallback mechanisms** for production resilience
5. **Monitor performance** and adjust concurrency settings

## 📈 Roadmap

### Planned Features

- [ ] GPU acceleration support
- [ ] Custom model loading via API
- [ ] Real-time processing streams
- [ ] Advanced batch optimization
- [ ] Model versioning and A/B testing
- [ ] Distributed processing across nodes

### Performance Targets

- [ ] Sub-200ms processing time for single images
- [ ] 95%+ uptime with graceful degradation
- [ ] Support for 1000+ concurrent requests
- [ ] Auto-scaling based on queue depth

## 📞 Support

### Documentation

- [API Reference](./docs/api-reference.md)
- [Architecture Overview](./docs/architecture.md)
- [Integration Guide](./docs/integration-guide.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Monitoring

- Health checks: `GET /api/ml/health`
- Model status: `GET /api/ml/models/status`
- Application logs: `./logs/` directory
- Queue dashboard: `http://localhost:3000/admin/queues` (if enabled)

---

**Need help?** Check the troubleshooting section above or review the comprehensive integration tests in the `test/` directory.
