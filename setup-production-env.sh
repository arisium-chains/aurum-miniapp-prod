#!/bin/bash

# ⚠️  DEPRECATED: This script is deprecated. Use 'make setup' instead.
# Production Environment Setup Script
# This script creates the required .env.production files from templates

echo "⚠️  DEPRECATED: This script is deprecated. Please use 'make setup' instead."
echo "See MAKEFILE-MIGRATION.md for migration guide."
echo ""

set -e

echo "================================================"
echo "Setting up Production Environment Files"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found. Please run this script from the project root."
    exit 1
fi

print_status "Creating production environment files from templates..."

# Create main .env.production file
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.template" ]; then
        cp .env.production.template .env.production
        print_status "Created .env.production from template"
    else
        print_warning ".env.production.template not found, creating basic file"
        cat > .env.production << 'EOF'
NODE_ENV=production
REDIS_URL=redis://redis:6379
QDRANT_HOST=qdrant
QDRANT_PORT=6333
ML_API_URL=http://ml-api:3000
LOG_LEVEL=info
EOF
        print_status "Created basic .env.production file"
    fi
else
    print_warning ".env.production already exists, skipping"
fi

# Create ML API .env.production file
if [ ! -f "apps/ml-api/.env.production" ]; then
    if [ -f "apps/ml-api/.env.production.template" ]; then
        cp apps/ml-api/.env.production.template apps/ml-api/.env.production
        print_status "Created apps/ml-api/.env.production from template"
    else
        print_warning "apps/ml-api/.env.production.template not found, creating basic file"
        mkdir -p apps/ml-api
        cat > apps/ml-api/.env.production << 'EOF'
NODE_ENV=production
REDIS_URL=redis://redis:6379
PORT=3000
HOST=0.0.0.0
MODEL_PATH=/app/models
LOG_LEVEL=info
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=30000
HEALTH_CHECK_INTERVAL=30000
EOF
        print_status "Created basic apps/ml-api/.env.production file"
    fi
else
    print_warning "apps/ml-api/.env.production already exists, skipping"
fi

# Create required directories
print_status "Creating required directories..."
mkdir -p apps/web/public/models
mkdir -p apps/ml-api/temp
mkdir -p apps/ml-api/models
mkdir -p logs

print_status "Setting proper permissions..."
chmod +x deploy-production.sh 2>/dev/null || true
chmod +x validate-deployment.sh 2>/dev/null || true

echo ""
echo "================================================"
echo -e "${GREEN}✅ Production Environment Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Review and update the .env.production files with your actual values"
echo "2. Run: ./validate-deployment.sh"
echo "3. Run: docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "Environment files created:"
echo "  - .env.production"
echo "  - apps/ml-api/.env.production"
echo ""
echo -e "${YELLOW}⚠️  Important: Update these files with your actual production values!${NC}"