# Docker Compose Usage Guide

This guide explains how to run the correct docker-compose file in the Aurum Circle codebase.

## Available Docker Compose Files

1. **docker-compose.yml** - Main configuration file with relative paths (default)
2. **docker-compose-absolute.yml** - Alternative with absolute paths for server deployment
3. **docker-compose-fixed.yml** - Copy of the main file (for reference)

## When to Use Each File

### Use `docker-compose.yml` (Default)

- Local development
- Standard deployments where relative paths work correctly
- Most common use cases

### Use `docker-compose-absolute.yml` (Server Deployment)

- When experiencing path resolution issues
- Server environments where relative paths don't resolve correctly
- Deployment environments with specific directory structures

## Running Docker Compose

### Basic Usage

```bash
# Run with default docker-compose.yml
docker-compose up --build

# Run in detached mode
docker-compose up --build -d

# Stop services
docker-compose down
```

### Using Specific Docker Compose File

```bash
# Run with absolute paths version
docker-compose -f docker-compose-absolute.yml up --build

# Run with absolute paths in detached mode
docker-compose -f docker-compose-absolute.yml up --build -d

# Stop services using specific file
docker-compose -f docker-compose-absolute.yml down
```

## Troubleshooting Path Issues

If you encounter errors like:

```
ERROR: build path /root/aurum-circle-miniapp/miniapp/aurum-circle-miniapp/ml-face-score-api either does not exist, is not accessible, or is not a valid URL.
```

Try these solutions:

### Solution 1: Clear Docker Cache

```bash
docker-compose down
docker system prune -af
docker volume prune -f
docker-compose up --build
```

### Solution 2: Use Absolute Paths

```bash
docker-compose -f docker-compose-absolute.yml up --build
```

### Solution 3: Check Permissions

```bash
ls -la miniapp/aurum-circle-miniapp/ml-face-score-api
chmod -R 755 miniapp/aurum-circle-miniapp/ml-face-score-api
```

## Environment-Specific Recommendations

### Local Development

```bash
# Use the default docker-compose.yml
docker-compose up --build
```

### Server Deployment

```bash
# Use absolute paths version
docker-compose -f docker-compose-absolute.yml up --build -d
```

## Verifying Setup

Before running docker-compose, verify your setup:

```bash
# Check if directories exist
ls -la miniapp/aurum-circle-miniapp/
ls -la miniapp/aurum-circle-miniapp/ml-face-score-api/

# Check if Dockerfile exists
ls -la miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile

# Test building the service directly
docker build -f miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile miniapp/aurum-circle-miniapp/ml-face-score-api
```

## Common Commands

```bash
# View running services
docker-compose ps

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs app

# Rebuild specific service
docker-compose build app

# Rebuild all services
docker-compose build

# Scale services
docker-compose up --scale app=3
```

## Best Practices

1. Always use the default `docker-compose.yml` for local development
2. Use `docker-compose-absolute.yml` only when experiencing path issues
3. Clear docker cache regularly to avoid stale configurations
4. Check file permissions if services fail to start
5. Use detached mode (`-d`) for production deployments
