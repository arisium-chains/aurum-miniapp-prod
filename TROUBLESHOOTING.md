# Aurum ML Service Troubleshooting Guide

This guide provides solutions to common issues encountered when working with the Aurum ML service architecture, including the standalone ML API, web application integration, and deployment scenarios.

## Table of Contents

1. [ML Service Connection Issues](#ml-service-connection-issues)
2. [Fallback Mechanism Problems](#fallback-mechanism-problems)
3. [Performance Issues](#performance-issues)
4. [Configuration Problems](#configuration-problems)
5. [Docker Deployment Issues](#docker-deployment-issues)
6. [Development Environment Setup](#development-environment-setup)
7. [ONNX Model Loading Issues](#onnx-model-loading-issues)
8. [Redis and Queue Issues](#redis-and-queue-issues)
9. [Error Response Codes](#error-response-codes)
10. [Diagnostic Tools](#diagnostic-tools)

## ML Service Connection Issues

### Issue: `ECONNREFUSED` or Connection Timeout

**Symptoms:**

- Web app cannot connect to ML service
- Health check endpoints fail
- Fallback mode always activates

**Diagnostic Steps:**

```bash
# 1. Check if ML service is running
curl http://localhost:3003/health
# Expected: HTTP 200 with health status

# 2. Verify ML service process
ps aux | grep node
# Look for ml-api process

# 3. Check port availability
netstat -tulpn | grep 3003
# Should show ML service listening

# 4. Test from web app container (if using Docker)
docker exec web-container curl http://ml-api:3003/health
```

**Solutions:**

#### For Local Development:

```bash
# Start ML service
cd apps/ml-api
npm run dev

# Verify environment variables
echo $ML_API_URL  # Should be http://localhost:3003
```

#### For Docker Environment:

```yaml
# docker-compose.yml - Ensure proper networking
version: '3.8'
services:
  web:
    environment:
      - ML_API_URL=http://ml-api:3003 # Use service name, not localhost
    depends_on:
      - ml-api

  ml-api:
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

#### For Production:

```bash
# Check firewall rules
sudo ufw status
sudo ufw allow 3003/tcp

# Verify load balancer configuration
curl -v http://your-domain.com/ml-api/health
```

### Issue: Intermittent Connection Failures

**Symptoms:**

- Connections work sometimes but fail randomly
- Timeout errors during peak usage

**Solutions:**

#### Increase Connection Pool Size:

```typescript
// apps/web/src/lib/ml-service-client.ts
const httpAgent = new Agent({
  keepAlive: true,
  maxSockets: 20, // Increase from default
  maxFreeSockets: 10, // Increase from default
  timeout: 30000,
});
```

#### Implement Circuit Breaker:

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 60000;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }
    // Implementation details...
  }
}
```

## Fallback Mechanism Problems

### Issue: Fallback Not Triggering

**Symptoms:**

- Requests fail instead of falling back to simulated ML
- Users see error messages instead of fallback results

**Diagnostic Steps:**

```bash
# Test health check manually
curl http://localhost:3003/api/ml/health

# Check logs for fallback triggers
docker logs web-container | grep -i fallback
docker logs ml-api-container | grep -i error
```

**Solutions:**

#### Verify Fallback Configuration:

```typescript
// apps/web/src/app/api/attractiveness/score/route.ts
const FALLBACK_CONFIG = {
  healthCheckTimeout: 5000, // Adjust timeout
  fallbackToSimulated: true, // Ensure enabled
  maxRetries: 3, // Set appropriate retries
};
```

#### Test Fallback Manually:

```typescript
// Test fallback mechanism
const mockUnhealthyResponse = {
  status: 'unhealthy',
  details: { overall: false },
};

jest
  .spyOn(mlServiceClient, 'healthCheck')
  .mockResolvedValue(mockUnhealthyResponse);
```

### Issue: Poor Fallback Performance

**Symptoms:**

- Fallback responses take too long
- Simulated results are unrealistic

**Solutions:**

#### Optimize Fallback Engine:

```typescript
// Implement caching for fallback results
class FallbackCache {
  private cache = new Map<string, ScoringResult>();
  private readonly ttl = 300000; // 5 minutes

  async getFallbackResult(imageHash: string): Promise<ScoringResult | null> {
    const cached = this.cache.get(imageHash);
    if (cached && this.isValid(cached)) {
      return cached;
    }
    return null;
  }
}
```

## Performance Issues

### Issue: High Response Times

**Symptoms:**

- ML processing takes > 10 seconds
- Users experience timeouts
- Poor user experience

**Diagnostic Steps:**

```bash
# Monitor response times
curl -w "@curl-format.txt" http://localhost:3003/api/ml/score

# curl-format.txt content:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#           time_total:  %{time_total}\n

# Check ML service metrics
curl http://localhost:3003/api/ml/models/status | jq '.data.performance'
```

**Solutions:**

#### Optimize ONNX Model Performance:

```typescript
// apps/ml-api/src/services/mlService.ts
const onnxOptions = {
  executionProviders: ['cpu'], // Use GPU if available: ['cuda', 'cpu']
  graphOptimizationLevel: 'all',
  enableCpuMemArena: true,
  enableMemPattern: true,
};

const session = await ort.InferenceSession.create(modelPath, onnxOptions);
```

#### Implement Request Batching:

```typescript
class RequestBatcher {
  private batch: ProcessingRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 5;
  private readonly batchDelay = 100; // ms

  async addRequest(request: ProcessingRequest): Promise<ProcessingResult> {
    return new Promise((resolve, reject) => {
      this.batch.push({ ...request, resolve, reject });

      if (this.batch.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(
          () => this.processBatch(),
          this.batchDelay
        );
      }
    });
  }
}
```

#### Add Caching Layer:

```typescript
// Implement Redis caching for processed images
class MLResultCache {
  async get(imageHash: string): Promise<MLResult | null> {
    const cached = await redis.get(`ml:${imageHash}`);
    return cached ? JSON.parse(cached) : null;
  }

  async set(imageHash: string, result: MLResult): Promise<void> {
    await redis.setex(`ml:${imageHash}`, 3600, JSON.stringify(result));
  }
}
```

### Issue: Memory Leaks

**Symptoms:**

- Increasing memory usage over time
- Out of memory errors
- Performance degradation

**Diagnostic Steps:**

```bash
# Monitor memory usage
docker stats ml-api-container

# Check Node.js memory
curl http://localhost:3003/api/ml/health | jq '.data.memory'

# Generate heap dump (if needed)
kill -USR2 <ml-api-pid>
```

**Solutions:**

#### Optimize ONNX Session Management:

```typescript
class ModelManager {
  private sessions = new Map<string, ort.InferenceSession>();
  private readonly maxSessions = 3;

  async getSession(modelPath: string): Promise<ort.InferenceSession> {
    if (!this.sessions.has(modelPath)) {
      // Cleanup old sessions if at limit
      if (this.sessions.size >= this.maxSessions) {
        const oldestKey = this.sessions.keys().next().value;
        const oldSession = this.sessions.get(oldestKey);
        await oldSession?.release();
        this.sessions.delete(oldestKey);
      }

      const session = await ort.InferenceSession.create(modelPath);
      this.sessions.set(modelPath, session);
    }

    return this.sessions.get(modelPath)!;
  }
}
```

#### Implement Garbage Collection Monitoring:

```typescript
// Monitor garbage collection
setInterval(() => {
  if (global.gc) {
    global.gc();
  }

  const memUsage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
  });
}, 30000);
```

## Configuration Problems

### Issue: Environment Variables Not Loading

**Symptoms:**

- Default values used instead of configured values
- Configuration validation errors
- Services connecting to wrong endpoints

**Diagnostic Steps:**

```bash
# Check environment variables
env | grep ML_
env | grep REDIS_

# In Node.js application
console.log('ML_API_URL:', process.env.ML_API_URL);
console.log('All env vars:', JSON.stringify(process.env, null, 2));
```

**Solutions:**

#### Docker Environment Configuration:

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    env_file:
      - .env.local
    environment:
      - ML_API_URL=http://ml-api:3003
      - REDIS_URL=redis://redis:6379

  ml-api:
    env_file:
      - apps/ml-api/.env
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
```

#### Environment Validation:

```typescript
// Add validation logging
import { config } from './config';

console.log('Configuration loaded:', {
  mlApi: config.ml,
  redis: config.redis,
  environment: config.env,
});

// Validate critical configs
if (!config.redis.url) {
  throw new Error('REDIS_URL is required');
}
```

### Issue: Model Files Not Found

**Symptoms:**

- ONNX model loading failures
- ML service falls back to simulation
- File not found errors in logs

**Diagnostic Steps:**

```bash
# Check model files exist
ls -la apps/ml-api/models/
# Expected: face_detection.onnx, face_embedding.onnx, attractiveness_model.onnx

# Check file permissions
ls -la apps/ml-api/models/*.onnx

# Verify Docker volume mounts
docker inspect ml-api-container | jq '.[0].Mounts'
```

**Solutions:**

#### Download Model Files:

```bash
# Create models directory
mkdir -p apps/ml-api/models

# Download placeholder models (replace with actual model URLs)
# wget -O apps/ml-api/models/face_detection.onnx https://example.com/models/face_detection.onnx
# wget -O apps/ml-api/models/face_embedding.onnx https://example.com/models/face_embedding.onnx
# wget -O apps/ml-api/models/attractiveness_model.onnx https://example.com/models/attractiveness.onnx

# Set proper permissions
chmod 644 apps/ml-api/models/*.onnx
```

#### Docker Volume Configuration:

```yaml
# docker-compose.yml
services:
  ml-api:
    volumes:
      - ./apps/ml-api/models:/app/models:ro # Read-only mount
    environment:
      - MODEL_PATH=/app/models
```

## Docker Deployment Issues

### Issue: Container Build Failures

**Symptoms:**

- Docker build fails with dependency errors
- Module not found errors
- Build context too large

**Solutions:**

#### Optimize Dockerfile:

```dockerfile
# apps/ml-api/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

EXPOSE 3003
CMD ["npm", "start"]
```

#### Use .dockerignore:

```
# .dockerignore
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
Dockerfile
.dockerignore
logs/
```

### Issue: Container Networking Problems

**Symptoms:**

- Services cannot communicate
- DNS resolution failures
- Port binding issues

**Solutions:**

#### Proper Network Configuration:

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    ports:
      - '3000:3000'
    networks:
      - app-network
    depends_on:
      - ml-api
      - redis

  ml-api:
    ports:
      - '3003:3003'
    networks:
      - app-network
    depends_on:
      - redis

  redis:
    ports:
      - '6379:6379'
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Development Environment Setup

### Issue: NPM Dependencies Conflicts

**Symptoms:**

- Package installation failures
- Version conflicts
- Module resolution errors

**Solutions:**

#### Clean Installation:

```bash
# Remove all node_modules and lock files
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "package-lock.json" -delete

# Reinstall from root
npm install

# Verify installation
npm run build
npm run lint
```

#### Use Exact Versions:

```json
{
  "dependencies": {
    "onnxruntime-node": "1.17.1",
    "sharp": "0.33.3",
    "bullmq": "5.7.5"
  }
}
```

### Issue: TypeScript Configuration Problems

**Symptoms:**

- Type errors in shared packages
- Module resolution failures
- Build failures

**Solutions:**

#### Verify TypeScript Configuration:

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Build all packages
npm run build

# Check path mapping
cat tsconfig.json | jq '.compilerOptions.paths'
```

#### Fix Path Mapping:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../packages/shared-*/src/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

## ONNX Model Loading Issues

### Issue: Model Initialization Failures

**Symptoms:**

- ONNX runtime errors
- Model loading timeouts
- Segmentation faults

**Diagnostic Steps:**

```bash
# Check ONNX installation
npm list onnxruntime-node

# Verify model files
file apps/ml-api/models/*.onnx
# Should show: ONNX model file

# Test model loading
node -e "
const ort = require('onnxruntime-node');
ort.InferenceSession.create('./apps/ml-api/models/face_detection.onnx')
  .then(() => console.log('Model loaded successfully'))
  .catch(console.error);
"
```

**Solutions:**

#### Configure Execution Providers:

```typescript
// apps/ml-api/src/services/mlService.ts
const getExecutionProviders = (): string[] => {
  // Try GPU first, fallback to CPU
  try {
    // Check if CUDA is available
    const providers = ort.env.webgpu?.gpu ? ['webgpu', 'cpu'] : ['cpu'];
    return providers;
  } catch (error) {
    console.warn('GPU not available, using CPU:', error);
    return ['cpu'];
  }
};

const sessionOptions: ort.InferenceSession.SessionOptions = {
  executionProviders: getExecutionProviders(),
  graphOptimizationLevel: 'all',
  enableCpuMemArena: true,
  enableMemPattern: true,
};
```

#### For Docker with GPU Support:

```dockerfile
# Use NVIDIA base image for GPU support
FROM nvidia/cuda:11.8-runtime-ubuntu20.04 AS gpu-base
RUN apt-get update && apt-get install -y nodejs npm

# docker-compose.yml
services:
  ml-api:
    build:
      context: .
      dockerfile: Dockerfile.gpu
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
```

## Redis and Queue Issues

### Issue: Redis Connection Failures

**Symptoms:**

- Queue operations fail
- Cache misses constantly
- Connection timeout errors

**Diagnostic Steps:**

```bash
# Test Redis connectivity
redis-cli ping
# Expected: PONG

# Check Redis logs
redis-cli monitor

# Test from application
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(console.log).catch(console.error);
"
```

**Solutions:**

#### Redis Configuration:

```bash
# redis.conf optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
save 60 1000
tcp-keepalive 300
timeout 0
```

#### Connection Pool Configuration:

```typescript
// apps/ml-api/src/utils/redis.ts
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  connectTimeout: 10000,
  commandTimeout: 5000,
};
```

### Issue: BullMQ Queue Processing Problems

**Symptoms:**

- Jobs stuck in queue
- Workers not processing jobs
- Queue dashboard shows errors

**Diagnostic Steps:**

```bash
# Check queue status
curl http://localhost:3003/api/ml/models/status | jq '.data.queue'

# Monitor queue with Redis CLI
redis-cli
> KEYS bull:ml-scoring:*
> LLEN bull:ml-scoring:waiting
> LLEN bull:ml-scoring:active
> LLEN bull:ml-scoring:completed
> LLEN bull:ml-scoring:failed
```

**Solutions:**

#### Restart Workers:

```bash
# Restart ML API service
docker restart ml-api-container

# Or manually restart workers
npm run worker:restart
```

#### Queue Configuration:

```typescript
// apps/ml-api/src/services/queue.ts
const queueOptions = {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

const workerOptions = {
  connection: redisConfig,
  concurrency: parseInt(process.env.BULLMQ_CONCURRENCY) || 5,
  stalledInterval: 30000,
  maxStalledCount: 1,
};
```

#### Clear Stuck Jobs:

```typescript
// Utility to clear stuck jobs
async function clearStuckJobs() {
  const queue = new Queue('ml-scoring', queueOptions);

  await queue.clean(0, 'active'); // Clear active jobs
  await queue.clean(0, 'waiting'); // Clear waiting jobs
  await queue.clean(24 * 3600 * 1000, 'completed'); // Clean old completed jobs

  console.log('Queue cleaned');
}
```

## Error Response Codes

### HTTP Status Codes Reference

| Code  | Meaning               | Common Causes                            | Solutions                             |
| ----- | --------------------- | ---------------------------------------- | ------------------------------------- |
| `400` | Bad Request           | Invalid image format, missing parameters | Validate input data                   |
| `404` | Not Found             | Endpoint doesn't exist, user not found   | Check API routes                      |
| `408` | Request Timeout       | ML processing timeout                    | Increase timeout, optimize processing |
| `422` | Unprocessable Entity  | No face detected, poor image quality     | Improve image quality                 |
| `429` | Too Many Requests     | Rate limit exceeded                      | Implement backoff, increase limits    |
| `500` | Internal Server Error | ONNX errors, database issues             | Check logs, restart services          |
| `503` | Service Unavailable   | ML service down                          | Check service health, use fallback    |

### Error Response Format

All errors follow the standardized format:

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "data": {
    "errorType": "PROCESSING_ERROR",
    "details": {
      "originalError": "Detailed error information",
      "suggestions": ["Try uploading a different image", "Ensure good lighting"]
    }
  }
}
```

### Common Error Types

#### `FACE_DETECTION_FAILED`

```json
{
  "status": "error",
  "message": "No face detected in the image. Please upload a clear portrait photo.",
  "data": {
    "errorType": "FACE_DETECTION_FAILED",
    "details": {
      "suggestions": [
        "Use a frontal face photo",
        "Ensure good lighting",
        "Avoid multiple faces in the image"
      ]
    }
  }
}
```

#### `FACE_QUALITY_INSUFFICIENT`

```json
{
  "status": "error",
  "message": "Face quality is too low for accurate scoring.",
  "data": {
    "errorType": "FACE_QUALITY_INSUFFICIENT",
    "details": {
      "qualityMetrics": {
        "faceQuality": 0.45,
        "threshold": 0.6
      },
      "suggestions": [
        "Use higher resolution image",
        "Ensure clear focus",
        "Improve lighting conditions"
      ]
    }
  }
}
```

## Diagnostic Tools

### Health Check Commands

```bash
#!/bin/bash
# health-check.sh - Comprehensive system health check

echo "=== Aurum ML Service Health Check ==="

# 1. Service availability
echo "1. Checking service availability..."
curl -s http://localhost:3000/api/attractiveness/ml-status | jq '.success'
curl -s http://localhost:3003/api/ml/health | jq '.status'

# 2. Redis connectivity
echo "2. Checking Redis..."
redis-cli ping

# 3. Model status
echo "3. Checking ML models..."
curl -s http://localhost:3003/api/ml/models/status | jq '.data.overall'

# 4. Queue status
echo "4. Checking queue status..."
curl -s http://localhost:3003/api/ml/models/status | jq '.data.queue // "No queue info"'

# 5. Memory usage
echo "5. Checking memory usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo "=== Health Check Complete ==="
```

### Performance Testing Script

```bash
#!/bin/bash
# performance-test.sh - Test ML service performance

TEST_IMAGE="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
CONCURRENT_REQUESTS=5
TOTAL_REQUESTS=20

echo "=== Performance Test ==="
echo "Concurrent requests: $CONCURRENT_REQUESTS"
echo "Total requests: $TOTAL_REQUESTS"

# Function to make a single request
make_request() {
  local id=$1
  local start_time=$(date +%s.%N)

  local response=$(curl -s -w "%{http_code}:%{time_total}" \
    -X POST http://localhost:3000/api/attractiveness/score \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"test-$id\",\"image\":\"$TEST_IMAGE\",\"useRealML\":true}")

  local end_time=$(date +%s.%N)
  local duration=$(echo "$end_time - $start_time" | bc)

  echo "Request $id: Duration=${duration}s Response=${response}"
}

# Run concurrent requests
for i in $(seq 1 $TOTAL_REQUESTS); do
  if [ $((i % CONCURRENT_REQUESTS)) -eq 0 ]; then
    wait  # Wait for current batch to complete
  fi
  make_request $i &
done

wait  # Wait for all requests to complete
echo "=== Performance Test Complete ==="
```

### Log Analysis Commands

```bash
# ML API logs
docker logs ml-api-container --tail=100 -f

# Web app logs
docker logs web-container --tail=100 -f

# Filter for errors
docker logs ml-api-container 2>&1 | grep -i error

# Filter for performance issues
docker logs ml-api-container 2>&1 | grep -E "(timeout|slow|performance)"

# Monitor processing times
docker logs ml-api-container 2>&1 | grep "processingTime" | tail -20

# Queue monitoring
redis-cli monitor | grep "bull:ml-scoring"
```

### Debugging Node.js Applications

```bash
# Enable debug mode
DEBUG=* npm run dev

# Memory profiling
node --inspect=0.0.0.0:9229 dist/index.js

# Heap snapshot
kill -USR2 <ml-api-pid>

# CPU profiling
node --prof dist/index.js
node --prof-process isolate-*.log > processed.txt
```

### Network Debugging

```bash
# Test connectivity between services
docker exec web-container nc -zv ml-api 3003
docker exec ml-api-container nc -zv redis 6379

# Monitor network traffic
tcpdump -i any port 3003

# Check DNS resolution
docker exec web-container nslookup ml-api
docker exec ml-api-container nslookup redis
```

---

## Quick Reference

### Essential Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ml-api

# Restart ML service
docker-compose restart ml-api

# Check health
curl http://localhost:3003/api/ml/health

# Clear Redis cache
redis-cli FLUSHALL

# Monitor performance
docker stats
```

### Emergency Recovery

```bash
# If everything is broken:
docker-compose down
docker system prune -f
docker-compose up --build -d

# If Redis is corrupted:
docker-compose down redis
docker volume rm <redis-volume>
docker-compose up -d redis
```

### Support Contacts

- **Documentation**: [Architecture Overview](ARCHITECTURE.md)
- **Integration Guide**: [ML Service Integration](ML_SERVICE_INTEGRATION_GUIDE.md)
- **API Documentation**: [ML API README](apps/ml-api/README.md)
- **Deployment Guide**: [Deployment Documentation](apps/ml-api/DEPLOYMENT.md)

---

**Need additional help?** Check the comprehensive integration tests in the `test/` directories or review the detailed logs for more specific error information.

#### Use Compatible ONNX Runtime:

```json
{
  "dependencies": {
    "onnxruntime-node": "^1.17.1"
  }
}
```

#### Add Model Validation:

```typescript
async function validateModel(modelPath: string): Promise<boolean> {
  try {
    const session = await ort.InferenceSession.create(modelPath);
    await session.release();
    return true;
  } catch (error) {
    console.error(`Model validation failed for ${modelPath}:`, error);
    return false;
  }
}
```

### Issue: GPU/CPU Execution Provider Problems

**Symptoms:**

- CUDA provider not available
- Slow inference times
- Provider initialization errors

**Solutions:**
