# Aurum Miniapp Production Deployment Makefile
# This Makefile provides all deployment and management commands

# Configuration
COMPOSE_FILE := docker-compose.prod.yml
PROJECT_NAME := aurum-miniapp-prod
LOG_FILE := deployment.log
DOCKER_REGISTRY := 
IMAGE_TAG := latest

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# Phony targets
.PHONY: help setup validate build deploy start stop restart logs clean status health test backup restore

##@ Help
help: ## Display this help message
	@echo "Aurum Miniapp Production Deployment"
	@echo "===================================="
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Environment Setup
setup: ## Setup production environment files from templates
	@echo -e "$(BLUE)[INFO]$(NC) Setting up Production Environment Files"
	@echo "================================================"
	@if [ ! -f "$(COMPOSE_FILE)" ]; then \
		echo -e "$(RED)[ERROR]$(NC) $(COMPOSE_FILE) not found. Please run from project root."; \
		exit 1; \
	fi
	@echo -e "$(BLUE)[INFO]$(NC) Creating production environment files from templates..."
	@if [ ! -f ".env.production" ]; then \
		if [ -f ".env.production.template" ]; then \
			cp .env.production.template .env.production; \
			echo -e "$(GREEN)[SUCCESS]$(NC) Created .env.production from template"; \
		else \
			echo -e "$(YELLOW)[WARNING]$(NC) .env.production.template not found, creating basic file"; \
			echo "NODE_ENV=production" > .env.production; \
			echo "REDIS_URL=redis://redis:6379" >> .env.production; \
			echo "QDRANT_HOST=qdrant" >> .env.production; \
			echo "QDRANT_PORT=6333" >> .env.production; \
			echo "ML_API_URL=http://ml-api:3000" >> .env.production; \
			echo "LOG_LEVEL=info" >> .env.production; \
			echo -e "$(GREEN)[SUCCESS]$(NC) Created basic .env.production file"; \
		fi; \
	else \
		echo -e "$(YELLOW)[WARNING]$(NC) .env.production already exists, skipping"; \
	fi
	@if [ ! -f "apps/ml-api/.env.production" ]; then \
		if [ -f "apps/ml-api/.env.production.template" ]; then \
			cp apps/ml-api/.env.production.template apps/ml-api/.env.production; \
			echo -e "$(GREEN)[SUCCESS]$(NC) Created apps/ml-api/.env.production from template"; \
		else \
			echo -e "$(YELLOW)[WARNING]$(NC) apps/ml-api/.env.production.template not found, creating basic file"; \
			mkdir -p apps/ml-api; \
			echo "NODE_ENV=production" > apps/ml-api/.env.production; \
			echo "REDIS_URL=redis://redis:6379" >> apps/ml-api/.env.production; \
			echo "PORT=3000" >> apps/ml-api/.env.production; \
			echo "HOST=0.0.0.0" >> apps/ml-api/.env.production; \
			echo "MODEL_PATH=/app/models" >> apps/ml-api/.env.production; \
			echo "LOG_LEVEL=info" >> apps/ml-api/.env.production; \
			echo "MAX_CONCURRENT_REQUESTS=10" >> apps/ml-api/.env.production; \
			echo "REQUEST_TIMEOUT=30000" >> apps/ml-api/.env.production; \
			echo "HEALTH_CHECK_INTERVAL=30000" >> apps/ml-api/.env.production; \
			echo -e "$(GREEN)[SUCCESS]$(NC) Created basic apps/ml-api/.env.production file"; \
		fi; \
	else \
		echo -e "$(YELLOW)[WARNING]$(NC) apps/ml-api/.env.production already exists, skipping"; \
	fi
	@echo -e "$(BLUE)[INFO]$(NC) Creating required directories..."
	@mkdir -p apps/web/public/models apps/ml-api/temp apps/ml-api/models logs
	@echo -e "$(GREEN)[SUCCESS]$(NC) Production Environment Setup Complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Review and update the .env.production files with your actual values"
	@echo "2. Run: make validate"
	@echo "3. Run: make deploy"

##@ Validation
validate: ## Validate deployment configuration
	@echo "================================================"
	@echo "Aurum Miniapp Deployment Validation"
	@echo "================================================"
	@echo -e "$(BLUE)[INFO]$(NC) Checking Docker installation..."
	@if command -v docker >/dev/null 2>&1; then \
		echo -e "$(GREEN)[SUCCESS]$(NC) Docker is installed: $$(docker --version)"; \
	else \
		echo -e "$(RED)[ERROR]$(NC) Docker is not installed"; \
		exit 1; \
	fi
	@echo -e "$(BLUE)[INFO]$(NC) Checking Docker Compose..."
	@if docker compose version >/dev/null 2>&1; then \
		echo -e "$(GREEN)[SUCCESS]$(NC) Docker Compose is available: $$(docker compose version)"; \
	else \
		echo -e "$(RED)[ERROR]$(NC) Docker Compose is not available"; \
		exit 1; \
	fi
	@echo -e "$(BLUE)[INFO]$(NC) Validating Docker Compose file..."
	@if docker compose -f $(COMPOSE_FILE) config >/dev/null 2>&1; then \
		echo -e "$(GREEN)[SUCCESS]$(NC) Docker Compose file is valid"; \
	else \
		echo -e "$(RED)[ERROR]$(NC) Docker Compose file validation failed"; \
		exit 1; \
	fi
	@echo -e "$(BLUE)[INFO]$(NC) Checking required files..."
	@for file in .env.production apps/ml-api/.env.production; do \
		if [ -f "$$file" ]; then \
			echo -e "$(GREEN)[SUCCESS]$(NC) $$file exists"; \
		else \
			echo -e "$(RED)[ERROR]$(NC) $$file is missing. Run 'make setup' first"; \
			exit 1; \
		fi; \
	done
	@echo -e "$(BLUE)[INFO]$(NC) Checking required directories..."
	@for dir in apps/web/public/models apps/ml-api/temp apps/ml-api/models; do \
		if [ -d "$$dir" ]; then \
			echo -e "$(GREEN)[SUCCESS]$(NC) $$dir exists"; \
		else \
			echo -e "$(YELLOW)[WARNING]$(NC) $$dir missing, creating..."; \
			mkdir -p "$$dir"; \
		fi; \
	done
	@echo -e "$(GREEN)[SUCCESS]$(NC) All validation checks passed!"

##@ Docker Operations
build: validate ## Build all Docker images
	@echo -e "$(BLUE)[INFO]$(NC) Building Docker images..."
	@docker compose -f $(COMPOSE_FILE) build --no-cache
	@echo -e "$(GREEN)[SUCCESS]$(NC) All images built successfully!"

pull: ## Pull latest images from registry
	@echo -e "$(BLUE)[INFO]$(NC) Pulling latest images..."
	@docker compose -f $(COMPOSE_FILE) pull
	@echo -e "$(GREEN)[SUCCESS]$(NC) Images pulled successfully!"

##@ Deployment
deploy: validate build ## Full deployment (validate, build, and start services)
	@echo "================================================"
	@echo "Starting Production Deployment"
	@echo "================================================"
	@echo -e "$(BLUE)[INFO]$(NC) Starting services..."
	@docker compose -f $(COMPOSE_FILE) up -d
	@echo -e "$(BLUE)[INFO]$(NC) Waiting for services to be healthy..."
	@sleep 10
	@$(MAKE) health
	@echo -e "$(GREEN)[SUCCESS]$(NC) Deployment completed successfully!"
	@echo ""
	@echo "Service URLs:"
	@echo "- Web Application: http://localhost"
	@echo "- ML API: http://localhost/ml-api/"
	@echo "- Direct Web App: http://localhost:3000"
	@echo "- Direct ML API: http://localhost:3001"
	@echo "- Qdrant: http://localhost:6333"
	@echo "- Redis: localhost:6379"

quick-deploy: ## Quick deployment without rebuild
	@echo -e "$(BLUE)[INFO]$(NC) Quick deployment (using existing images)..."
	@docker compose -f $(COMPOSE_FILE) up -d
	@$(MAKE) health

##@ Service Management
start: ## Start all services
	@echo -e "$(BLUE)[INFO]$(NC) Starting services..."
	@docker compose -f $(COMPOSE_FILE) start
	@echo -e "$(GREEN)[SUCCESS]$(NC) Services started!"

stop: ## Stop all services
	@echo -e "$(BLUE)[INFO]$(NC) Stopping services..."
	@docker compose -f $(COMPOSE_FILE) stop
	@echo -e "$(GREEN)[SUCCESS]$(NC) Services stopped!"

restart: ## Restart all services
	@echo -e "$(BLUE)[INFO]$(NC) Restarting services..."
	@docker compose -f $(COMPOSE_FILE) restart
	@echo -e "$(GREEN)[SUCCESS]$(NC) Services restarted!"

down: ## Stop and remove all containers
	@echo -e "$(BLUE)[INFO]$(NC) Stopping and removing containers..."
	@docker compose -f $(COMPOSE_FILE) down
	@echo -e "$(GREEN)[SUCCESS]$(NC) Containers stopped and removed!"

down-volumes: ## Stop and remove containers with volumes
	@echo -e "$(YELLOW)[WARNING]$(NC) This will remove all data volumes!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker compose -f $(COMPOSE_FILE) down -v
	@echo -e "$(GREEN)[SUCCESS]$(NC) Containers and volumes removed!"

##@ Monitoring
status: ## Show service status
	@echo "================================================"
	@echo "Service Status"
	@echo "================================================"
	@docker compose -f $(COMPOSE_FILE) ps

logs: ## Show logs for all services
	@docker compose -f $(COMPOSE_FILE) logs -f

logs-web: ## Show web app logs
	@docker compose -f $(COMPOSE_FILE) logs -f app

logs-ml: ## Show ML API logs
	@docker compose -f $(COMPOSE_FILE) logs -f ml-api

logs-nginx: ## Show nginx logs
	@docker compose -f $(COMPOSE_FILE) logs -f nginx

logs-redis: ## Show redis logs
	@docker compose -f $(COMPOSE_FILE) logs -f redis

logs-qdrant: ## Show qdrant logs
	@docker compose -f $(COMPOSE_FILE) logs -f qdrant

health: ## Check health of all services
	@echo "================================================"
	@echo "Health Check Status"
	@echo "================================================"
	@echo -e "$(BLUE)[INFO]$(NC) Checking service health..."
	@for service in app ml-api nginx redis qdrant; do \
		if docker compose -f $(COMPOSE_FILE) ps $$service | grep -q "healthy\|Up"; then \
			echo -e "$(GREEN)[HEALTHY]$(NC) $$service"; \
		else \
			echo -e "$(RED)[UNHEALTHY]$(NC) $$service"; \
		fi; \
	done

##@ Testing
test: ## Run health checks and basic tests
	@echo "================================================"
	@echo "Running Tests"
	@echo "================================================"
	@echo -e "$(BLUE)[INFO]$(NC) Testing web app health endpoint..."
	@if curl -f -s http://localhost:3000/api/health >/dev/null; then \
		echo -e "$(GREEN)[SUCCESS]$(NC) Web app health check passed"; \
	else \
		echo -e "$(RED)[FAILED]$(NC) Web app health check failed"; \
	fi
	@echo -e "$(BLUE)[INFO]$(NC) Testing ML API health endpoint..."
	@if curl -f -s http://localhost:3001/api/health >/dev/null; then \
		echo -e "$(GREEN)[SUCCESS]$(NC) ML API health check passed"; \
	else \
		echo -e "$(RED)[FAILED]$(NC) ML API health check failed"; \
	fi
	@echo -e "$(BLUE)[INFO]$(NC) Testing nginx routing..."
	@if curl -f -s http://localhost >/dev/null; then \
		echo -e "$(GREEN)[SUCCESS]$(NC) Nginx routing test passed"; \
	else \
		echo -e "$(RED)[FAILED]$(NC) Nginx routing test failed"; \
	fi

##@ Maintenance
clean: ## Clean up unused Docker resources
	@echo -e "$(BLUE)[INFO]$(NC) Cleaning up unused Docker resources..."
	@docker system prune -f
	@echo -e "$(GREEN)[SUCCESS]$(NC) Cleanup completed!"

clean-all: ## Clean up all Docker resources (including images)
	@echo -e "$(YELLOW)[WARNING]$(NC) This will remove all unused Docker resources including images!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker system prune -af
	@echo -e "$(GREEN)[SUCCESS]$(NC) Full cleanup completed!"

backup: ## Backup application data
	@echo -e "$(BLUE)[INFO]$(NC) Creating backup..."
	@mkdir -p backups
	@docker compose -f $(COMPOSE_FILE) exec redis redis-cli --rdb /tmp/redis-backup.rdb
	@docker cp $$(docker compose -f $(COMPOSE_FILE) ps -q redis):/tmp/redis-backup.rdb backups/redis-$$(date +%Y%m%d-%H%M%S).rdb
	@docker run --rm -v aurum-miniapp-prod_qdrant_storage:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/qdrant-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo -e "$(GREEN)[SUCCESS]$(NC) Backup completed in backups/ directory"

##@ Development
dev-setup: ## Setup development environment
	@echo -e "$(BLUE)[INFO]$(NC) Setting up development environment..."
	@cp .env.production.template .env.development || true
	@cp apps/ml-api/.env.production.template apps/ml-api/.env.development || true
	@echo -e "$(GREEN)[SUCCESS]$(NC) Development environment setup complete!"

dev-build: ## Build for development
	@docker compose -f docker-compose.yml build

dev-up: ## Start development environment
	@docker compose -f docker-compose.yml up -d

dev-down: ## Stop development environment
	@docker compose -f docker-compose.yml down

##@ Information
info: ## Show deployment information
	@echo "================================================"
	@echo "Aurum Miniapp Deployment Information"
	@echo "================================================"
	@echo "Project: $(PROJECT_NAME)"
	@echo "Compose File: $(COMPOSE_FILE)"
	@echo "Log File: $(LOG_FILE)"
	@echo ""
	@echo "Service URLs:"
	@echo "- Web Application: http://localhost"
	@echo "- ML API: http://localhost/ml-api/"
	@echo "- Direct Web App: http://localhost:3000"
	@echo "- Direct ML API: http://localhost:3001"
	@echo "- Qdrant: http://localhost:6333"
	@echo "- Redis: localhost:6379"
	@echo ""
	@echo "Available commands: make help"

version: ## Show version information
	@echo "Aurum Miniapp Production Deployment"
	@echo "Version: 1.0.0"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker compose version)"

##@ Quick Commands
all: setup validate deploy ## Complete setup and deployment
	@echo -e "$(GREEN)[SUCCESS]$(NC) Complete deployment finished!"

reset: down clean setup ## Reset environment (stop, clean, setup)
	@echo -e "$(GREEN)[SUCCESS]$(NC) Environment reset complete!"

update: pull restart ## Update and restart services
	@echo -e "$(GREEN)[SUCCESS]$(NC) Services updated and restarted!"