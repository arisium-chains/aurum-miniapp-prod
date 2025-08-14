#!/bin/bash

# Production Deployment Script for Aurum Miniapp
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="aurum-miniapp-prod"
LOG_FILE="deployment.log"

# Function to print colored output
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

# Function to log output
log_output() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate environment files
validate_environment() {
    print_status "Validating environment configuration..."
    
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found, creating template..."
        cp .env.production.template .env.production 2>/dev/null || true
    fi
    
    if [ ! -f "apps/ml-api/.env.production" ]; then
        print_warning "apps/ml-api/.env.production not found, creating template..."
        cp apps/ml-api/.env.production.template apps/ml-api/.env.production 2>/dev/null || true
    fi
    
    print_success "Environment validation completed"
}

# Function to create required directories
create_directories() {
    print_status "Creating required directories..."
    
    mkdir -p apps/web/public/models
    mkdir -p apps/ml-api/temp
    mkdir -p apps/ml-api/models
    mkdir -p logs
    
    print_success "Directories created"
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    
    if docker compose -f "$COMPOSE_FILE" build --no-cache; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        exit 1
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    if docker compose -f "$COMPOSE_FILE" up -d; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Function to wait for services to be healthy
wait_for_health() {
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts"
        
        if docker compose -f "$COMPOSE_FILE" ps --format "table {{.Service}}\t{{.Status}}" | grep -q "healthy"; then
            print_success "Services are healthy"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    print_error "Services did not become healthy within expected time"
    docker compose -f "$COMPOSE_FILE" ps
    exit 1
}

# Function to run post-deployment tests
run_tests() {
    print_status "Running post-deployment tests..."
    
    # Test Nginx
    if curl -f http://localhost/nginx-health &>/dev/null; then
        print_success "Nginx is responding"
    else
        print_error "Nginx health check failed"
        return 1
    fi
    
    # Test Web App
    if curl -f http://localhost/api/health &>/dev/null; then
        print_success "Web app is responding"
    else
        print_error "Web app health check failed"
        return 1
    fi
    
    # Test ML API
    if curl -f http://localhost/ml-api/api/health &>/dev/null; then
        print_success "ML API is responding"
    else
        print_error "ML API health check failed"
        return 1
    fi
    
    print_success "All post-deployment tests passed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    print_status "Service URLs:"
    echo "  - Web Application: http://localhost"
    echo "  - ML API: http://localhost/ml-api"
    echo "  - Nginx Health: http://localhost/nginx-health"
    echo "  - Redis: localhost:6379"
    echo "  - Qdrant: http://localhost:6333"
    echo ""
}

# Function to cleanup on failure
cleanup_on_failure() {
    print_error "Deployment failed. Cleaning up..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans
    exit 1
}

# Main deployment function
main() {
    echo "================================================"
    echo "Aurum Miniapp Production Deployment"
    echo "================================================"
    
    # Initialize log file
    echo "Production Deployment Log - $(date)" > "$LOG_FILE"
    
    # Set trap for cleanup on failure
    trap cleanup_on_failure ERR
    
    # Execute deployment steps
    check_prerequisites
    validate_environment
    create_directories
    build_images
    start_services
    wait_for_health
    run_tests
    show_status
    
    echo "================================================"
    print_success "Deployment completed successfully!"
    echo "================================================"
    
    print_status "To stop the services, run:"
    echo "  docker compose -f $COMPOSE_FILE down"
    echo ""
    print_status "To view logs, run:"
    echo "  docker compose -f $COMPOSE_FILE logs -f"
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping services..."
        docker compose -f "$COMPOSE_FILE" down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting services..."
        docker compose -f "$COMPOSE_FILE" down
        sleep 5
        main
        ;;
    "logs")
        docker compose -f "$COMPOSE_FILE" logs -f
        ;;
    "status")
        show_status
        ;;
    *)
        main
        ;;
esac