# Aurum Circle Miniapp - Current Architecture Documentation

## Overview

The Aurum Circle Miniapp is a Next.js-based application that provides an attractiveness scoring system using facial analysis. The system currently uses simulated machine learning components for demonstration purposes, with a planned architecture for real ML model integration.

## System Components

### 1. Main Application (Next.js)

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Port**: 3000
- **Key Features**:
  - World ID Miniapp SDK integration for authentication
  - Attractiveness scoring API endpoints
  - User profile management
  - Discovery feed
  - NFT verification system

### 2. ML Face Scoring API Service

- **Framework**: Express.js
- **Language**: TypeScript
- **Port**: 3001
- **Purpose**: Dedicated service for handling ML processing tasks
- **Key Components**:
  - Job queue system using BullMQ
  - Face detection (simulated)
  - Face embedding extraction (simulated)
  - Scoring algorithm (simulated)

### 3. Redis

- **Version**: Redis 7 Alpine
- **Port**: 6379 (internal), 6381 (external)
- **Purpose**:
  - Job queue management
  - Caching facial scores
  - Session storage

### 4. Qdrant

- **Purpose**: Vector database for storing face embeddings
- **Ports**: 6333, 6334

### 5. ML Worker

- **Purpose**: Background worker for processing face scoring jobs
- **Technology**: Node.js worker threads with BullMQ

## Data Flow

### 1. User Authentication Flow

```
World App Browser → World ID Verification → Wallet Connection → NFT Gate → Profile Setup → Main App
```

### 2. Attractiveness Scoring Flow

```
User Uploads Image → API Validation → ML Model Selection →
Image Processing Queue → ML API Service → Face Detection →
Face Embedding Extraction → Vector Store Update →
Percentile Calculation → Vibe Clustering → Score Return
```

## Key Services and APIs

### Attractiveness Scoring APIs

- `POST /api/attractiveness/score` - Main scoring endpoint
- `GET /api/attractiveness/score` - Retrieve existing scores
- `GET /api/attractiveness/leaderboard` - Get top users
- `GET /api/attractiveness/similar` - Find similar users
- `GET /api/attractiveness/stats` - System statistics
- `GET /api/attractiveness/ml-status` - ML model health check

### ML API Service Endpoints

- `POST /api/score` - Submit image for processing
- `GET /api/result/:jobId` - Get processing results
- `GET /api/status` - Service status
- `GET /api/ml-status` - ML model status

## Current ML Components (Simulated)

### 1. Face Detection

- **Location**: `src/lib/ml-models/face-detection.ts`
- **Technology**: TensorFlow.js (simulated)
- **Models**: MediaPipe Face Detection (planned)
- **Output**: Bounding boxes, facial landmarks

### 2. Face Embedding Extraction

- **Location**: `src/lib/ml-models/face-embeddings.ts`
- **Technology**: TensorFlow.js (simulated)
- **Models**: ArcFace/InsightFace (planned)
- **Output**: 512-dimensional face embeddings

### 3. Attractiveness Engine

- **Location**: `src/lib/attractiveness-engine.ts`
- **Components**:
  - Face embedding extractor
  - Vibe clusterer
  - Vector store manager
  - Scoring algorithm

### 4. Vibe Clustering

- **Location**: `src/lib/vibe-clustering.ts`
- **Purpose**: Generate personality/aesthetic tags
- **Method**: PCA + K-means style clustering

### 5. Vector Store

- **Location**: `src/lib/vector-store.ts`
- **Technology**: In-memory storage (Qdrant in production)
- **Purpose**: Store and compare face embeddings

## Current Deployment Architecture

### Docker Services

1. **app** - Main Next.js application
2. **redis** - Redis database
3. **qdrant** - Vector database
4. **ml-api** - ML Face Scoring API Service
5. **ml-worker** - ML Worker for processing jobs

### Environment Variables

- `WORLD_ID_APP_ID` - World ID application ID
- `WORLD_ID_ACTION` - World ID action name
- `REDIS_URL` - Redis connection URL
- `QDRANT_HOST` - Qdrant host
- `QDRANT_PORT` - Qdrant port
- `NODE_ENV` - Environment (development/production)

## Current Limitations

### 1. Simulated ML Models

- All ML components are currently simulated for demonstration
- No real face detection or embedding extraction
- Quality metrics are generated algorithmically

### 2. Performance

- In-memory vector store limits scalability
- No GPU acceleration for ML processing
- Simulated processing doesn't reflect real-world performance

### 3. Production Readiness

- Missing real ML model integration
- No model optimization for production
- Limited error handling for ML failures

## Planned Improvements (Current Architecture)

### 1. Real ML Model Integration

- Integration with MediaPipe Face Detection
- Integration with ArcFace/InsightFace embedding models
- TensorFlow.js for browser-based inference

### 2. Production Enhancements

- Qdrant vector database for production storage
- Model optimization and quantization
- GPU acceleration support

## Components Requiring Rust Migration

### 1. Face Detection Service

- Current: Simulated TensorFlow.js implementation
- Target: Rust-based MediaPipe/MTCNN implementation

### 2. Face Embedding Extraction Service

- Current: Simulated ArcFace implementation
- Target: Rust-based ArcFace/InsightFace implementation

### 3. Image Processing Pipeline

- Current: Node.js-based processing
- Target: Rust-based high-performance processing

### 4. Vector Similarity Calculations

- Current: JavaScript-based cosine similarity
- Target: Rust-based optimized similarity calculations

## Integration Points

### 1. API Interface

- RESTful APIs for communication between services
- JSON-based data exchange
- Standard HTTP status codes

### 2. Queue System

- BullMQ for job queue management
- Redis as queue backend
- Job status tracking and result retrieval

### 3. Data Storage

- Redis for caching and session management
- Qdrant for vector storage
- File system for temporary image storage

## Performance Requirements

### 1. Response Times

- API responses: < 500ms for cached data
- ML processing: < 100ms for real models
- Image upload and processing: < 2 seconds

### 2. Scalability

- Support for 10,000+ concurrent users
- Horizontal scaling of ML workers
- Efficient memory usage

### 3. Reliability

- 99.9% uptime for core services
- Graceful degradation to simulated mode
- Automatic failover mechanisms
