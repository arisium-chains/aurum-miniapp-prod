# Aurum Circle - Production Deployment Guide

This guide provides comprehensive instructions for deploying the Aurum Circle application in a production environment, including both the Next.js frontend and the Rust-based ML services.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Repository Structure](#repository-structure)
4. [Deployment Options](#deployment-options)
   - [Docker Compose (Recommended)](#docker-compose-deployment-recommended)
   - [Manual Deployment](#manual-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Network Topology](#network-topology)
7. [ML Model Setup](#ml-model-setup)
8. [Deployment Validation](#deployment-validation)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Scaling Considerations](#scaling-considerations)
11. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Aurum Circle application consists of several interconnected services:

```
┌─────────────┐
│    Nginx    │
└────┬───┬────┘
     │   │
     │   └────────────▶ ML API Service (/ml-api/*)
     │
     └───────────────▶ Next.js App (/ and /api/*)
                        │
                        ├── Redis (Queue/Caching)
                        └── Qdrant (Vector DB)
```

The ML API coordinates with worker processes and optional Rust services for model inference.

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or later (recommended), or any Linux distribution
- **CPU**: 4+ cores (8+ cores recommended for production)
- **RAM**: 16GB+ (32GB+ recommended for production)
- **Storage**: 100GB+ SSD storage
- **Network**: 100Mbps+ network connectivity

### Software Dependencies

```bash
# Required system packages
sudo apt update
sudo apt install -y \
  curl \
  build-essential \
  pkg-config \
  libssl-dev \
  libclang-dev \
  cmake \
  git \
  ca-certificates \
  gnupg \
  lsb-release

# Docker installation (for Docker deployment)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Node.js installation
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Rust toolchain (for manual deployment)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

## Repository Structure

```
aurum-circle/
├── landing-page/              # Landing page (Next.js)
├── miniapp/                   # Main application
│   └── aurum-circle-miniapp/  # Aurum Circle miniapp
│       ├── ml-face-score-api/ # ML API service
│       └── public/models/     # ML models directory
├── aurum-ml-services/         # Rust ML services
│   ├── face-detection/        # Face detection service
│   └── face-embedding/        # Face embedding service
├── nginx/                     # Nginx configuration
└── docker-compose.yml         # Main Docker Compose file
```

## Deployment Options

### Docker Compose Deployment (Recommended)

This is the recommended approach for most production deployments as it simplifies management and ensures consistency across environments.

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd aurum-circle
```

#### 2. Configure Environment Variables

Copy and customize the environment files:

```bash
# Main application environment
cp miniapp/aurum-circle-miniapp/.env.example miniapp/aurum-circle-miniapp/.env.local
# Edit miniapp/aurum-circle-miniapp/.env.local with your configuration

# ML API service environment
cp miniapp/aurum-circle-miniapp/ml-face-score-api/.env.example miniapp/aurum-circle-miniapp/ml-face-score-api/.env
# Edit miniapp/aurum-circle-miniapp/ml-face-score-api/.env with your configuration
```

#### 3. ML Model Setup

Since models are not included in the repository, you'll need to download them separately:

```bash
cd miniapp/aurum-circle-miniapp
npm run download-models
```

Note: This creates placeholder files. In a real deployment, replace the commands in the script with actual downloads from your model repository or CDN.

#### 4. Build and Deploy

```bash
# Build and start all services
docker compose up --build -d
```

#### 5. Verify Deployment

```bash
# Check if all services are running
docker compose ps

# View logs for specific services
docker compose logs app
docker compose logs ml-api
docker compose logs face-detection-service
docker compose logs face-embedding-service
```

### Manual Deployment

For environments where Docker is not available or desired, you can deploy the services manually.

#### 1. Deploy Rust ML Services

```bash
# Navigate to the Rust services directory
cd aurum-ml-services

# Build the services
cargo build --release --bin face-detection
cargo build --release --bin face-embedding

# Create directories for models
mkdir -p models/face_detection models/face_embedding

# Copy models to appropriate directories (you need to obtain the actual model files)
# cp /path/to/face_detection_model.onnx models/face_detection/
# cp /path/to/face_embedding_model.onnx models/face_embedding/

# Start the services
./target/release/face-detection &
./target/release/face-embedding &
```

#### 2. Deploy ML API Service

```bash
# Navigate to the ML API directory
cd miniapp/aurum-circle-miniapp/ml-face-score-api

# Install dependencies
npm install

# Build the service
npm run build

# Start the service
npm start &

# Start the worker
node dist/worker.js &
```

#### 3. Deploy Main Application

```bash
# Navigate to the main application directory
cd miniapp/aurum-circle-miniapp

# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

## Environment Configuration

### Main Application Environment Variables

Create `miniapp/aurum-circle-miniapp/.env.local` with the following variables:

```env
# Redis configuration
REDIS_URL=redis://redis:6379

# ML API internal URL
ML_API_URL=http://ml-api:3000

# Other configurations
NODE_ENV=production
PORT=3000
```

### ML API Service Environment Variables

Create `miniapp/aurum-circle-miniapp/ml-face-score-api/.env` with the following variables:

```env
# Redis configuration
REDIS_URL=redis://redis:6379

# Server configuration
PORT=3001
NODE_ENV=production

# Logging
LOG_LEVEL=info
```

## Network Topology

All services run on the `aurum-network` Docker bridge. Nginx is the only container that exposes ports to the host (`80` and `443`) and forwards traffic to:

- `app` (Next.js) for `/` and `/api/*` routes on port `3000`
- `ml-api` for `/ml-api/*` routes on port `3000`

Redis, Qdrant, and worker services are only accessible within this internal network.

## ML Model Setup

### Production Model Deployment

For production deployments, host models on a CDN and update the download script:

```bash
#!/bin/bash
# Example production download script
echo "Downloading ML models from CDN..."
curl -o public/models/face_detection/model.onnx https://cdn.example.com/models/face_detection.onnx
curl -o public/models/arcface/model.onnx https://cdn.example.com/models/arcface.onnx
# Continue for all models
```

### Model Directory Structure

```
public/models/
├── face_detection/
│   └── model.onnx          # Face detection model
└── arcface/
    └── model.onnx          # Face embedding model
```

## Nginx Configuration for Port 80 Exposure

The application is configured to expose the frontend on port 80 using nginx reverse proxy. The nginx configuration is located at `nginx/conf/default.conf` and includes:

1. Proxy to the main Next.js application on port 3000
2. Proxy to the ML API service on port 3001
3. Proxy to the Rust ML services on ports 8001 and 8002
4. Health check endpoint

To customize the domain name, update the `server_name` directive in the nginx configuration file.

## Deployment Validation

### Health Checks

After deployment, verify that all services are running correctly:

```bash
# Check main application
curl -I http://localhost:3000/api/health

# Check ML API service
curl -I http://localhost:3001/api/health

# Check Rust ML services
curl -I http://localhost:8001/health
curl -I http://localhost:8002/health

# Check Redis
redis-cli ping

# Check Qdrant
curl -I http://localhost:6333
```

### Test API Endpoints

```bash
# Test face detection
curl -X POST http://localhost:8001/detect \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "base64_encoded_image_data"}'

# Test face embedding
curl -X POST http://localhost:8002/extract \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "base64_encoded_image_data"}'
```

## Monitoring and Maintenance

### Log Management

```bash
# View Docker logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f ml-api
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop iftop

# Monitor Docker resources
docker stats

# Monitor system resources
htop
```

### Backup and Recovery

```bash
# Backup important data
tar -czf aurum-circle-backup-$(date +%Y%m%d).tar.gz \
  miniapp/aurum-circle-miniapp/.env.local \
  miniapp/aurum-circle-miniapp/ml-face-score-api/.env \
  miniapp/aurum-circle-miniapp/public/models/

# Restore from backup
tar -xzf aurum-circle-backup-*.tar.gz
```

## Scaling Considerations

### Horizontal Scaling

For high-traffic environments, consider running multiple instances:

```bash
# Run multiple ML API instances
PORT=3001 npm start &
PORT=3002 npm start &
PORT=3003 npm start &

# Run multiple ML workers
node dist/worker.js &
node dist/worker.js &
node dist/worker.js &
```

### Load Balancer Configuration

```nginx
# Nginx load balancer configuration
upstream ml-api-backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    location / {
        proxy_pass http://ml-api-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

1. **Services not starting**:

   - Check logs: `docker compose logs <service-name>`
   - Verify environment variables
   - Ensure models are in the correct directories

2. **ML services not responding**:

   - Check if models are properly loaded
   - Verify model paths in environment variables
   - Check system resources (memory, CPU)

3. **Database connection issues**:
   - Verify Qdrant is running
   - Check network connectivity
   - Verify Qdrant configuration

### Debugging Commands

```bash
# Check running containers
docker ps

# Check container resource usage
docker stats

# Execute commands in a running container
docker exec -it <container-name> /bin/bash

# Check system resources
free -h
df -h
top
```

## Git Operations

### Pushing Changes with Force

To push all changes to the repository with force:

```bash
# Add all changes
git add .

# Commit changes
git commit -m "Complete deployment setup with Rust ML services integration and nginx configuration"

# Push with force (be careful with this command)
git push --force origin main
```

Note: Use `git push --force` with caution as it will overwrite the remote branch history.

## Conclusion

This deployment guide provides a comprehensive approach to deploying the Aurum Circle application in a production environment. The Docker Compose approach is recommended for most deployments due to its simplicity and consistency, while manual deployment offers more control for specialized environments.

Regular monitoring, backups, and updates are essential for maintaining a healthy production environment. The application is now configured to expose the frontend on port 80 using nginx reverse proxy, making it accessible via standard HTTP.
