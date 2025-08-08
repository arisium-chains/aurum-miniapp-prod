# Aurum Circle - Production Deployment

This directory contains the production deployment configuration for the Aurum Circle application.

## Overview

This deployment includes:

- Main Next.js application
- ML Face Scoring API
- Redis for job queue and caching
- Qdrant vector database
- Nginx reverse proxy (running in Docker)

## Architecture

Nginx acts as the single entry point for the deployment:

- Requests to `/` and `/api/*` are forwarded to the Next.js application which handles UI and API routes internally.
- Requests to `/ml-api/*` are proxied to the ML Face Scoring API service.

Both services run on the same Docker network and communicate directly without an API gateway.

## Prerequisites

- Docker and Docker Compose installed
- Git

## Deployment Steps

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd aurum-circle
   ```

2. Navigate to the deployment directory:

   ```bash
   cd /path/to/aurum-circle
   ```

3. Start the services:

   ```bash
   docker-compose up -d
   ```

4. The application will be available at:
   - Main app: http://localhost
   - ML API: http://localhost/ml-api/
   - Direct app access: http://localhost:3000
   - Direct ML API access: http://localhost:3001

## Configuration

### Environment Variables

Before deploying, update the environment variables in the service directories:

- `miniapp/aurum-circle-miniapp/.env.local` – set `ML_API_URL` to the internal ML API address (e.g., `http://ml-api:3000` or `http://localhost/ml-api`).
- `miniapp/ml-face-score-api/.env.local` – configure service settings such as `REDIS_URL`.

### Nginx Configuration

The Nginx configuration can be found at `nginx/conf/default.conf`. Update the `server_name` directive with your domain for production use.

### SSL Certificate

For production deployment with HTTPS, add your SSL certificates to `nginx/certs/` and update the Nginx configuration accordingly.

## Services

- **app**: Main Next.js application (port 3000)
- **ml-api**: ML Face Scoring API (port 3001)
- **redis**: Redis database (port 6379)
- **qdrant**: Qdrant vector database (ports 6333, 6334)
- **nginx**: Reverse proxy (ports 80, 443)

## Volumes

- **redis_data**: Persistent storage for Redis data
- **qdrant_storage**: Persistent storage for Qdrant data

## Networks

All services share the `aurum-network` bridge network. Nginx is the only exposed container and proxies traffic to the Next.js app and the ML API service.

## Troubleshooting

If you encounter issues:

1. Check service logs:

   ```bash
   docker-compose logs <service-name>
   ```

2. Ensure all services are running:

   ```bash
   docker-compose ps
   ```

3. Restart services if needed:
   ```bash
   docker-compose restart
   ```

## Updating the Application

To update the application:

1. Pull the latest changes:

   ```bash
   git pull
   ```

2. Rebuild and restart services:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```
