# Deployment Guide

## Overview

This guide explains how to deploy the Aurum Circle miniapp with optimized repository size and separate model handling.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Deployment Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd aurum-circle-miniapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Download ML Models

Since models are not included in the repository, you'll need to download them separately:

```bash
npm run download-models
```

Note: This creates placeholder files. In a real deployment, replace the commands in the script with actual downloads from your model repository or CDN.

### 5. Build the Application

```bash
npm run build
```

### 6. Start the Application

```bash
npm start
```

## Production Deployment

For production deployments, consider:

### 1. CDN for Models

Host models on a CDN and update the download script:

```bash
#!/bin/bash
# Example production download script
echo "Downloading ML models from CDN..."
curl -o public/models/arcface/1k3d68.onnx https://cdn.example.com/models/1k3d68.onnx
curl -o public/models/arcface/2d106det.onnx https://cdn.example.com/models/2d106det.onnx
# Continue for all models
```

### 2. Docker Deployment

Use the provided Docker configuration:

```bash
docker-compose up --build
```

### 3. Server Deployment

For direct server deployment:

```bash
# After cloning and installing dependencies
npm run download-models  # With real download commands
npm run build
npm start
```

## Repository Size Optimization

To maintain a small repository size:

1. Never commit model files to Git
2. Use .gitignore to exclude model files
3. Regularly clean Git history if large files accidentally get committed
4. Use Git LFS for large files if versioning is required

## Troubleshooting

### Slow Clone/Push

If you experience slow clone or push operations:

1. Ensure model files are not tracked by Git:
   ```bash
   git ls-files public/models
   ```
   If any files are listed, remove them from tracking:
   ```bash
   git rm --cached public/models/arcface/* public/models/face_detection/*
   ```

2. Clean Git history:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch public/models/arcface/* public/models/face_detection/*' --prune-empty --tag-name-filter cat -- --all
   rm -rf .git/refs/original/ && git reflog expire --expire=now --all && git gc --aggressive --prune=now
   ```

### Missing Models

If the application fails due to missing models:

1. Verify models are in the correct directories
2. Check file permissions
3. Ensure the download script is working properly

## Monitoring Repository Size

Regularly check repository size:

```bash
du -sh .
du -sh .git
```

If the .git directory grows too large, consider cleaning the history as described above.