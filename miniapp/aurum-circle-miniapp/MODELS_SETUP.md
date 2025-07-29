# ML Models Setup Guide

## Overview

To reduce the repository size and improve deployment speed, ML model files are not included in the Git repository. Instead, they need to be downloaded separately after cloning the repository.

## Model Files Required

The following model files are required for the application to function properly:

### ArcFace Models (public/models/arcface/)
- `1k3d68.onnx` - Face landmark detection model
- `2d106det.onnx` - Face detection model
- `buffalo_l.zip` - Main face recognition model package
- `det_10g.onnx` - Additional face detection model
- `genderage.onnx` - Gender and age estimation model
- `w600k_r50.onnx` - Main ArcFace recognition model

### Face Detection Model (public/models/face_detection/)
- `model.tflite` - TensorFlow Lite face detection model

## Setup Instructions

### Option 1: Using the Download Script (Placeholder)

Run the provided download script:

```bash
npm run download-models
```

Note: This creates placeholder files. In a real deployment, replace with actual download commands.

### Option 2: Manual Download

1. Create the required directories:
```bash
mkdir -p public/models/arcface
mkdir -p public/models/face_detection
```

2. Download each model file to its respective directory.

### Option 3: Server-Side Download (Recommended for Production)

In production environments, it's recommended to:
1. Store models on a CDN or cloud storage
2. Download models during the deployment process
3. Use environment variables to configure model paths

Example deployment script:
```bash
#!/bin/bash
# Download models from CDN
curl -o public/models/arcface/1k3d68.onnx https://your-cdn.com/models/1k3d68.onnx
curl -o public/models/arcface/2d106det.onnx https://your-cdn.com/models/2d106det.onnx
# ... continue for all models
```

## Model Sizes

| Model File | Size | Purpose |
|------------|------|---------|
| 1k3d68.onnx | ~137MB | Face landmark detection |
| 2d106det.onnx | ~4.8MB | Face detection |
| buffalo_l.zip | ~275MB | Main face recognition model |
| det_10g.onnx | ~16MB | Additional face detection |
| genderage.onnx | ~1.3MB | Gender and age estimation |
| w600k_r50.onnx | ~166MB | Main ArcFace recognition |
| model.tflite | ~300KB | TensorFlow Lite face detection |

Total model size: ~600MB

## CDN Setup (Recommended for Production)

For production deployments, consider:
1. Hosting models on a CDN like AWS S3 + CloudFront, Google Cloud Storage, or similar
2. Setting up automated deployment that downloads models during build
3. Using signed URLs for secure access to model files