#!/bin/bash

# ⚠️  DEPRECATED: This script is deprecated. Use 'make validate' instead.
# Deployment Validation Script
# This script validates the deployment configuration without actually deploying

echo "⚠️  DEPRECATED: This script is deprecated. Please use 'make validate' instead."
echo "See MAKEFILE-MIGRATION.md for migration guide."
echo ""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "================================================"
echo "Aurum Miniapp Deployment Validation"
echo "================================================"

# Check Docker
print_status "Checking Docker installation..."
if command -v docker &> /dev/null; then
    print_success "Docker is installed: $(docker --version)"
else
    print_error "Docker is not installed"
    exit 1
fi

# Check Docker Compose
print_status "Checking Docker Compose..."
if docker compose version &> /dev/null; then
    print_success "Docker Compose is available: $(docker compose version)"
else
    print_error "Docker Compose is not available"
    exit 1
fi

# Check Docker daemon
print_status "Checking Docker daemon..."
if docker info &> /dev/null; then
    print_success "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    exit 1
fi

# Validate docker-compose file
print_status "Validating docker-compose configuration..."
if docker compose -f docker-compose.prod.yml config > /dev/null; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration is invalid"
    exit 1
fi

# Check required directories
print_status "Checking required directories..."
directories=(
    "apps/web/public/models"
    "apps/ml-api/temp"
    "apps/ml-api/models"
    "deploy/nginx/conf"
)

for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        print_success "Directory exists: $dir"
    else
        print_warning "Directory missing: $dir (will be created during deployment)"
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    fi
done

# Check required files
print_status "Checking required files..."
files=(
    "docker-compose.prod.yml"
    "deploy-production.sh"
    "apps/web/Dockerfile"
    "apps/ml-api/Dockerfile"
    "deploy/nginx/Dockerfile"
    "deploy/nginx/nginx.conf"
    "deploy/nginx/conf/default.conf"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_success "File exists: $file"
    else
        print_error "File missing: $file"
        exit 1
    fi
done

# Check environment files
print_status "Checking environment files..."
if [ -f ".env.production" ]; then
    print_success "Main environment file exists"
else
    print_warning "Main environment file missing (.env.production)"
fi

if [ -f "apps/ml-api/.env.production" ]; then
    print_success "ML API environment file exists"
else
    print_warning "ML API environment file missing (apps/ml-api/.env.production)"
fi

# Check package.json files
print_status "Checking package.json files..."
if [ -f "apps/web/package.json" ]; then
    print_success "Web app package.json exists"
else
    print_error "Web app package.json missing"
    exit 1
fi

if [ -f "apps/ml-api/package.json" ]; then
    print_success "ML API package.json exists"
else
    print_error "ML API package.json missing"
    exit 1
fi

# Test nginx configuration syntax (skip upstream resolution)
print_status "Testing nginx configuration syntax..."
print_warning "Skipping nginx syntax test (upstream servers not available during validation)"
print_success "Nginx configuration files exist and will be validated during deployment"

# Check port availability
print_status "Checking port availability..."
ports=(80 3000 3001 6333 6380)
for port in "${ports[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        print_warning "Port $port is already in use"
    else
        print_success "Port $port is available"
    fi
done

echo "================================================"
print_success "Validation completed successfully!"
echo "================================================"

print_status "Next steps:"
echo "1. Review and update environment variables in .env.production files"
echo "2. For SSL/HTTPS, place certificates in deploy/nginx/ssl/"
echo "3. Run deployment: ./deploy-production.sh"
echo ""
print_status "To deploy now, run:"
echo "  ./deploy-production.sh"