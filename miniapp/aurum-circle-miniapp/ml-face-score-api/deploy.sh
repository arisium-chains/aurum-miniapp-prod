#!/bin/bash

# ML Model API Production Deployment Script

# Exit on any error
set -e

echo "=== Aurum Circle ML Model API Deployment ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  if [ -f /etc/debian_version ]; then
    # Ubuntu/Debian
    apt update
    apt install -y docker.io
    systemctl start docker
    systemctl enable docker
  elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL/Amazon Linux
    yum install -y docker
    systemctl start docker
    systemctl enable docker
  else
    echo "Unsupported OS. Please install Docker manually."
    exit 1
  fi
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
APP_DIR="/opt/aurum-circle-ml"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or update repository
if [ ! -d ".git" ]; then
  echo "Cloning repository..."
  git clone https://github.com/your-username/aurum-circle.git .
else
  echo "Updating repository..."
  git pull
fi

# Navigate to ML API directory
cd aurum-circle-miniapp/ml-face-score-api

# Build and start services
echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Check service status
echo "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo "Showing recent logs..."
docker-compose -f docker-compose.prod.yml logs --tail=20

echo "=== Deployment Complete ==="
echo "ML Model API is now running and publicly accessible on port 80"
echo "Health check endpoint: http://your-server-ip/health"
echo "API endpoint: http://your-server-ip/api/score"