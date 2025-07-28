# Docker Compose Configuration Fix Plan

## Problem Analysis

The `just deploy-all` command is failing with a ContainerConfig error for both `ml-api` and `ml-worker` services. After analyzing the configuration files, I've identified the following issues:

1. **Missing temp directory**: The root docker-compose.yml file tries to mount a volume from `./aurum-circle-miniapp/ml-face-score-api/temp`, but this directory doesn't exist.

2. **Missing ml-worker service**: The root docker-compose.yml file only defines the `ml-api` service but not the `ml-worker` service, which is needed for processing face scoring jobs.

3. **Inconsistent configurations**: There are multiple docker-compose.yml files with different configurations for the same services.

## Fix Plan

### 1. Create Missing Directory

First, create the missing `temp` directory:

```bash
mkdir -p aurum-circle-miniapp/ml-face-score-api/temp
```

This directory is needed because the docker-compose.yml file mounts it as a volume for both the `ml-api` and `ml-worker` services.

### 2. Update Root docker-compose.yml

Update the root `docker-compose.yml` file to include both the `ml-api` and `ml-worker` services with proper configurations.

The updated file should include:

```yaml
version: "3.8"

services:
  # Main Next.js application
  app:
    build:
      context: ./aurum-circle-miniapp
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - QDRANT_HOST=qdrant
      - QDRANT_PORT=6333
    depends_on:
      - redis
      - qdrant
      - ml-api
    volumes:
      - ./aurum-circle-miniapp/public/models:/app/public/models
    restart: unless-stopped

  # ML Face Scoring API
  ml-api:
    build:
      context: ./aurum-circle-miniapp/ml-face-score-api
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - ./aurum-circle-miniapp/ml-face-score-api/temp:/app/temp
      - ./aurum-circle-miniapp/ml-face-score-api/models:/app/models
    restart: unless-stopped

  # ML Worker for processing face scoring jobs
  ml-worker:
    build:
      context: ./aurum-circle-miniapp/ml-face-score-api
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - ./aurum-circle-miniapp/ml-face-score-api/temp:/app/temp
      - ./aurum-circle-miniapp/ml-face-score-api/models:/app/models
    command: node dist/worker.js
    restart: unless-stopped

  # Redis for job queue and caching (shared between services)
  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  # Qdrant vector database
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage
    restart: unless-stopped

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
  qdrant_storage:
```

Key changes made:

1. Added the missing `ml-worker` service with proper configuration
2. Added `ml-api` as a dependency for the main `app` service
3. Ensured consistent volume mappings for both services

### 3. Test the Fixed Configuration

After making these changes, test the configuration with:

```bash
just deploy-all
```

Or directly with:

```bash
docker-compose -f docker-compose.yml up --build -d
```

## Additional Recommendations

1. **Consolidate docker-compose files**: Consider removing or clearly documenting the purpose of the multiple docker-compose.yml files to avoid confusion.

2. **Add health checks**: Consider adding health checks to the services to ensure they're running properly.

3. **Environment-specific configurations**: Consider using docker-compose override files for different environments (development, staging, production).

## Expected Outcome

After implementing these changes, the `just deploy-all` command should work correctly, deploying all services including:

- Main Next.js application
- ML Face Scoring API
- ML Worker for processing face scoring jobs
- Redis for job queue and caching
- Qdrant vector database
- Nginx reverse proxy
