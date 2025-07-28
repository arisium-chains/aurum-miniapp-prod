#!/bin/bash

# Fix Deployment Script for Aurum Circle
# This script will fix the docker-compose path issues

echo "=== Aurum Circle Deployment Fix ==="

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found. Please run this script from the aurum-circle directory."
    exit 1
fi

echo "Backing up current docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup

echo "Checking if the current docker-compose.yml has correct paths..."

# Check if the file has the correct relative paths
if grep -q "/root/aurum-circle-miniapp/" docker-compose.yml; then
    echo "Current docker-compose.yml has incorrect absolute paths. Updating..."
    
    # Replace with correct relative paths
    # We'll use the docker-compose-fixed.yml as reference
    if [ -f "docker-compose-fixed.yml" ]; then
        echo "Using docker-compose-fixed.yml as reference..."
        cp docker-compose-fixed.yml docker-compose.yml
    else
        echo "docker-compose-fixed.yml not found. Please check your repository."
        exit 1
    fi
else
    echo "docker-compose.yml already has correct paths."
fi

# Check if we have the Rust service fix
if [ -f "docker-compose-rust-fixed.yml" ]; then
    echo "Applying Rust service build context fix..."
    cp docker-compose-rust-fixed.yml docker-compose.yml
fi

echo "Clearing Docker cache..."
docker-compose down
docker system prune -af
docker volume prune -f

echo "Verifying directory structure..."
if [ ! -d "miniapp/aurum-circle-miniapp/ml-face-score-api" ]; then
    echo "Error: ml-face-score-api directory not found. Please check your repository structure."
    exit 1
fi

if [ ! -d "aurum-ml-services" ]; then
    echo "Error: aurum-ml-services directory not found. Please check your repository structure."
    exit 1
fi

echo "Verifying Dockerfile exists..."
if [ ! -f "miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile" ]; then
    echo "Error: Dockerfile not found in ml-face-score-api directory."
    exit 1
fi

# Check if Rust services Dockerfiles exist
if [ ! -f "aurum-ml-services/face-detection/Dockerfile" ]; then
    echo "Error: Dockerfile not found in aurum-ml-services/face-detection directory."
    exit 1
fi

if [ ! -f "aurum-ml-services/face-embedding/Dockerfile" ]; then
    echo "Error: Dockerfile not found in aurum-ml-services/face-embedding directory."
    exit 1
fi

# Check if Cargo.toml exists in aurum-ml-services
if [ ! -f "aurum-ml-services/Cargo.toml" ]; then
    echo "Error: Cargo.toml not found in aurum-ml-services directory."
    exit 1
fi

echo "Testing Dockerfile build directly..."
docker build -f miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile miniapp/aurum-circle-miniapp/ml-face-score-api

if [ $? -eq 0 ]; then
    echo "Dockerfile builds successfully."
else
    echo "Error: Dockerfile failed to build. Please check the Dockerfile."
    exit 1
fi

echo "Starting services with docker-compose..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "Services started successfully!"
    echo "Check logs with: docker-compose logs -f"
else
    echo "Error starting services. Check logs with: docker-compose logs"
    exit 1
fi

echo "=== Deployment Fix Complete ==="