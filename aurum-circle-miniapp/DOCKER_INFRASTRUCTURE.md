# Docker Infrastructure Foundation

This document provides comprehensive instructions for the Docker infrastructure foundation of the Aurum Circle production deployment.

## Overview

The Docker infrastructure consists of:

- **Frontend Container**: Next.js application with standalone output
- **Scoring Service Container**: Node.js/Express.js microservice for ML scoring
- **Supporting Services**: Redis, Qdrant, ML services, and optional NGINX reverse proxy

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │ Scoring Service │    │   ML Services   │
│   (Port 3000)   │    │   (Port 3002)   │    │ (Ports 8001-02) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Port 6381)   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Qdrant       │
                    │ (Ports 6334-35) │
                    └─────────────────┘
```

## Quick Start

### Production Deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Development Deployment

```bash
# Start development services
docker-compose --profile dev -f docker-compose.dev.yml up --build

# Start with auto-reload
docker-compose --profile dev -f docker-compose.dev.yml up --build --watch
```

## Container Details

### 1. Frontend Container (Next.js)

**Dockerfile**: `Dockerfile`
**Development Dockerfile**: `Dockerfile.dev`

**Features**:

- Multi-stage build for optimized production images
- Standalone output mode for reduced image size
- Health check endpoint at `/api/health`
- Security headers and optimizations
- ML models included in build

**Environment Variables**:

- `NODE_ENV=production`
- `REDIS_URL=redis://redis:6379`
- `FACE_DETECTION_SERVICE=http://face-detection-service:8001`
- `FACE_EMBEDDING_SERVICE=http://face-embedding-service:8002`

### 2. Scoring Service Container (Node.js/Express.js)

**Dockerfile**: `Dockerfile.scoring-service`
**Development Dockerfile**: `Dockerfile.scoring-service.dev`

**Features**:

- Multi-stage build for optimized production images
- Express.js framework with security middleware
- Health check endpoints at `/api/health`
- TypeScript compilation
- ML model integration

**Environment Variables**:

- `NODE_ENV=production`
- `REDIS_URL=redis://redis:6379`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`

### 3. Supporting Services

#### Redis

- **Image**: `redis:7-alpine`
- **Port**: `6381`
- **Persistence**: Volume-mounted data directory
- **Password**: Optional via `REDIS_PASSWORD` environment variable

#### Qdrant Vector Database

- **Image**: `qdrant/qdrant:v1.7.0`
- **Ports**: `6334` (HTTP), `6335` (gRPC)
- **Persistence**: Volume-mounted storage
- **Security**: Optional API key via `QDRANT_API_KEY`

#### ML Services

- **Face Detection**: Rust service on port `8001`
- **Face Embedding**: Rust service on port `8002`
- **Models**: Volume-mounted from `./public/models`

## Health Checks

All services include health checks:

### Frontend Service

```bash
curl http://localhost:3000/api/health
```

### Scoring Service

```bash
curl http://localhost:3002/api/health
```

### Redis

```bash
docker exec -it <container_id> redis-cli ping
```

### Qdrant

```bash
curl http://localhost:6334/
```

## Volume Management

### Persistent Volumes

- `redis_data`: Redis data persistence
- `qdrant_storage`: Vector database storage
- `app_logs`: Frontend application logs
- `scoring_logs`: Scoring service logs
- `ml_api_logs`: ML API service logs
- `nginx_logs`: Reverse proxy logs

### Model Volumes

- `./public/models`: ML models (read-only)
- `scoring_models`: Scoring service models

## Networking

### Service Communication

- All services communicate via Docker internal network
- Service discovery using service names
- Port mapping for external access

### Port Mapping

| Service         | Internal Port | External Port |
| --------------- | ------------- | ------------- |
| Frontend        | 3000          | 3000          |
| Scoring Service | 3000          | 3002          |
| ML API          | 3000          | 3001          |
| Face Detection  | 8001          | 8001          |
| Face Embedding  | 8002          | 8002          |
| Redis           | 6379          | 6381          |
| Qdrant          | 6333          | 6334          |

## Security Considerations

### Container Security

- Non-root user execution
- Read-only model mounts
- Security headers in web services
- Health check isolation

### Network Security

- Internal Docker network isolation
- Port restrictions
- Service-to-service authentication

### Data Security

- Volume permissions
- Environment variable protection
- Secure Redis configuration

## Monitoring and Logging

### Health Monitoring

- Container health checks
- Service-specific health endpoints
- Automated restart policies

### Logging

- Structured logging across all services
- Volume-mounted log persistence
- Docker log aggregation

## Development Workflow

### Local Development

1. Use `docker-compose.dev.yml` with `--profile dev`
2. Volume mounts for hot reload
3. Development-specific configurations
4. Debug logging enabled

### Production Deployment

1. Use `docker-compose.yml`
2. Optimized images without dev dependencies
3. Health checks and monitoring
4. Persistent data volumes

## Scaling Considerations

### Horizontal Scaling

- Stateless services can be scaled horizontally
- Redis and Qdrant support clustering
- Load balancing with NGINX

### Resource Management

- Memory limits can be configured
- CPU constraints for ML services
- Volume optimization strategies

## Troubleshooting

### Common Issues

1. **Build Failures**: Check Dockerfile syntax and dependencies
2. **Port Conflicts**: Verify port mappings and availability
3. **Volume Permissions**: Check user permissions in containers
4. **Health Check Failures**: Review service logs and endpoints

### Debug Commands

```bash
# Check container status
docker-compose ps

# View specific service logs
docker-compose logs <service_name>

# Execute command in container
docker-compose exec <service_name> <command>

# Restart service
docker-compose restart <service_name>
```

## Backup and Recovery

### Data Backup

- Redis data: Backup `/data` volume
- Qdrant data: Backup `/qdrant/storage` volume
- Application logs: Backup respective log volumes

### Recovery Process

1. Stop all services
2. Restore data volumes
3. Restart services
4. Verify health checks

## Performance Optimization

### Image Optimization

- Multi-stage builds reduce final image size
- Layer caching for faster builds
- Minimal base images

### Runtime Optimization

- Health check intervals configured
- Resource limits for ML services
- Connection pooling for databases

## Environment-Specific Configurations

### Development

- Hot reload enabled
- Debug logging
- Development databases

### Staging

- Production-like configuration
- Test data
- Monitoring enabled

### Production

- Optimized images
- Security hardening
- High availability
