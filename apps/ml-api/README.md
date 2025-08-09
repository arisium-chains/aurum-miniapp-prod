# ML Face Score API with Rust Integration

This API provides facial attractiveness scoring services with integration to high-performance Rust-based ML services for face detection and embedding extraction.

## Features

- Queue-based processing system using BullMQ and Redis
- Integration with Rust-based ML services for face detection and embedding extraction
- Fallback to simulated ML processing when Rust services are unavailable
- RESTful API for scoring facial images
- Worker processes for handling image processing jobs

## Architecture

```
Next.js App → Redis Queue → Node.js ML Workers → Rust ML Services → Qdrant DB
                                   ↓
                           Health Monitoring
```

## Rust ML Services Integration

The API integrates with two Rust-based ML services:

1. **Face Detection Service** - Detects faces in images using high-performance Rust implementation
2. **Face Embedding Service** - Extracts facial embeddings for attractiveness scoring

### Integration Flow

1. Image is received via API endpoint
2. Job is added to Redis queue
3. Worker picks up job and processes image
4. Worker attempts to use Rust ML services:
   - First checks health of Rust services
   - If healthy, sends image to Rust services for processing
   - If unhealthy or processing fails, falls back to simulated ML
5. Results are returned to the calling application

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3000
NODE_ENV=development

# Rust ML Services Configuration
FACE_DETECTION_SERVICE=http://localhost:8001
FACE_EMBEDDING_SERVICE=http://localhost:8002
ML_SERVICE_TIMEOUT=5000
USE_REAL_ML=true

# Fallback Configuration
FALLBACK_TO_SIMULATED=true
SIMULATED_ML_THRESHOLD=0.7
```

## API Endpoints

### POST /api/score

Score a facial image for attractiveness.

**Request:**

```json
{
  "image": "base64_encoded_image_data"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "score": 87.5,
    "vibe": "charming",
    "rank": 87.5
  }
}
```

## Development

### Prerequisites

- Node.js 16+
- Redis server
- Rust ML services (face detection and embedding)

### Installation

```bash
npm install
```

### Running the API

```bash
# Start the API server
npm run dev

# Start the worker process
npm run dev:worker
```

### Building for Production

```bash
npm run build
npm start
npm run start:worker
```

## Rust ML Services

The Rust ML services are separate applications that provide high-performance face detection and embedding extraction:

- **Face Detection Service** - Built with Rust and ONNX Runtime
- **Face Embedding Service** - Built with Rust and ONNX Runtime

These services are designed to be run alongside the Node.js API and provide significantly better performance than the simulated ML implementations.

## Fallback Mechanism

If the Rust ML services are unavailable or fail to process an image, the system automatically falls back to simulated ML processing. This ensures that the API remains functional even when the high-performance Rust services are down.

## Testing

Run the test suite:

```bash
npm test
```

Add test jobs to the queue:

```bash
npx ts-node src/test-queue.ts
```
