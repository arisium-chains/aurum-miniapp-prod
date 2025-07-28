# Aurum Circle - Production Deployment

This directory contains the production deployment configuration for the Aurum Circle application.

## Overview

This deployment includes:

- Main Next.js application
- ML Face Scoring API
- Redis for job queue and caching
- Qdrant vector database
- Nginx reverse proxy (running in Docker)

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
   - ML API: http://localhost/api/ml/
   - Direct app access: http://localhost:3000
   - Direct ML API access: http://localhost:3001

## Configuration

### Environment Variables

Before deploying, update the environment variables in the service directories:

- `miniapp/aurum-circle-miniapp/.env.local`
- `miniapp/ml-face-score-api/.env.local`

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

All services are connected through the `aurum-network` bridge network.

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
