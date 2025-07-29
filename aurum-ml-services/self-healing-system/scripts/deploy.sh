#!/bin/bash
set -e

# Self-Healing System Deployment Script
# This script deploys the self-healing system to various environments

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-development}
IMAGE_TAG=${2:-latest}

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        error "Rust is not installed"
    fi
    
    log "Prerequisites check passed"
}

build_project() {
    log "Building project..."
    
    cd "$PROJECT_ROOT"
    
    # Build release binary
    cargo build --release
    
    # Build Docker image
    docker build -t "aurum/self-healing-system:$IMAGE_TAG" .
    
    log "Build completed"
}

setup_environment() {
    log "Setting up environment: $ENVIRONMENT"
    
    cd "$PROJECT_ROOT"
    
    # Create environment-specific config
    case $ENVIRONMENT in
        development)
            cp .env.example .env.development
            sed -i 's/RUST_LOG=info/RUST_LOG=debug/' .env.development
            ;;
        staging)
            cp .env.example .env.staging
            sed -i 's/DATABASE_URL=.*/DATABASE_URL=postgresql:\/\/user:pass@staging-db:5432\/self_healing/' .env.staging
            ;;
        production)
            cp .env.example .env.production
            sed -i 's/DATABASE_URL=.*/DATABASE_URL=postgresql:\/\/user:pass@prod-db:5432\/self_healing/' .env.production
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT"
            ;;
    esac
    
    log "Environment setup completed"
}

deploy_docker() {
    log "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing services
    docker-compose down
    
    # Start services
    docker-compose --env-file ".env.$ENVIRONMENT" up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        log "Services are healthy"
    else
        warning "Services may not be ready, checking logs..."
        docker-compose logs
    fi
}

deploy_kubernetes() {
    log "Deploying to Kubernetes..."
    
    cd "$PROJECT_ROOT"
    
    # Apply configurations
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    
    # Wait for deployment
    kubectl rollout status deployment/self-healing-system -n self-healing
    
    log "Kubernetes deployment completed"
}

run_tests() {
    log "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Unit tests
    cargo test
    
    # Integration tests
    cargo test --test integration_tests
    
    # Docker tests
    docker-compose --env-file ".env.$ENVIRONMENT" run --rm self-healing cargo test
    
    log "All tests passed"
}

setup_monitoring() {
    log "Setting up monitoring..."
    
    cd "$PROJECT_ROOT"
    
    # Create monitoring directories
    mkdir -p monitoring/grafana/dashboards
    
    # Copy dashboards
    cp monitoring/grafana/dashboards/*.json monitoring/grafana/dashboards/
    
    # Start monitoring stack
    docker-compose -f docker-compose.monitoring.yml up -d
    
    log "Monitoring setup completed"
}

migrate_database() {
    log "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Run migrations
    cargo run -- migrate
    
    log "Database migrations completed"
}

cleanup() {
    log "Cleaning up..."
    
    # Remove old images
    docker image prune -f
    
    # Clean build artifacts
    cargo clean
    
    log "Cleanup completed"
}

main() {
    log "Starting deployment for environment: $ENVIRONMENT"
    
    check_prerequisites
    setup_environment
    build_project
    
    case $ENVIRONMENT in
        development|staging)
            deploy_docker
            setup_monitoring
            ;;
        production)
            deploy_kubernetes
            ;;
        *)
            error "Invalid deployment target"
            ;;
    esac
    
    migrate_database
    run_tests
    cleanup
    
    log "Deployment completed successfully!"
    log "Access the system at: http://localhost:8080"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [environment] [image-tag]"
        echo "Environments: development, staging, production"
        echo "Example: $0 staging v1.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac