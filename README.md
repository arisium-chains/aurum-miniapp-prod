# Aurum Miniapp - Production Ready

A production-ready face scoring application with ML capabilities, built with Next.js and a standalone ML API service.

## 🚀 Quick Start

```bash
# Complete setup and deployment
make all

# Or step by step:
make setup     # Setup environment files
make validate  # Validate configuration  
make deploy    # Deploy to production

# Show all available commands
make help
```

## Architecture Overview

```
Nginx → Web Application (Next.js) → ML API Service → ONNX Runtime
  ↓           ↓                         ↓              ↓
HTTP/HTTPS  React UI                Redis Cache    Face Detection
Routing     Face Upload             BullMQ Queues  Face Embedding
            Scoring UI                             Attractiveness Scoring
```

## Project Structure

```
aurum-miniapp-prod/
├── apps/
│   ├── web/                    # Next.js web application
│   └── ml-api/                 # Standalone ML API service
├── deploy/
│   └── nginx/                  # Nginx configuration
├── packages/                   # Shared packages
├── docker-compose.prod.yml     # Production deployment
├── Makefile                    # All deployment commands
└── PRODUCTION-DEPLOYMENT.md    # Comprehensive deployment guide
```

## Services

### Web Application (`apps/web/`)
- **Framework**: Next.js 14 with TypeScript
- **Features**: Face upload, scoring UI, user authentication
- **Port**: 3000
- **Health Check**: `/api/health`

### ML API Service (`apps/ml-api/`)
- **Framework**: Node.js with TypeScript
- **Features**: Face detection, embedding, attractiveness scoring
- **Port**: 3001
- **Health Check**: `/api/health`

### Infrastructure
- **Nginx**: Reverse proxy and load balancer (Port 80)
- **Redis**: Caching and session storage (Port 6380)
- **Qdrant**: Vector database for ML operations (Port 6333)

## Development

### Prerequisites
- Docker and Docker Compose
- Node.js 20+
- Git

### Local Development
```bash
# Install dependencies
cd apps/web && npm install
cd ../ml-api && npm install

# Start development servers
cd apps/web && npm run dev
cd apps/ml-api && npm run dev
```

## Production Deployment

### Prerequisites
- Ubuntu 20.04 LTS or later
- Docker 20.10+ and Docker Compose v2
- At least 4GB RAM and 20GB disk space

### Deployment Steps

1. **Validate Configuration**
   ```bash
   ./validate-deployment.sh
   ```

2. **Deploy Services**
   ```bash
   ./deploy-production.sh
   ```

3. **Check Status**
   ```bash
   ./deploy-production.sh status
   ```

### Service URLs
- **Web Application**: http://localhost
- **ML API**: http://localhost/ml-api
- **Health Checks**: http://localhost/nginx-health

## Configuration

### Environment Variables

Create `.env.production` with:
```bash
NODE_ENV=production
REDIS_URL=redis://redis:6379
QDRANT_HOST=qdrant
QDRANT_PORT=6333
ML_API_URL=http://ml-api:3000
# Add your API keys and secrets
```

### SSL/HTTPS Setup

For production with SSL:
1. Place certificates in `deploy/nginx/ssl/`
2. Update nginx configuration
3. Uncomment HTTPS port in docker-compose

## Monitoring

### Health Checks
- **Web App**: `GET /api/health`
- **ML API**: `GET /api/health`
- **Nginx**: `GET /nginx-health`

### Logs
```bash
# View all logs
./deploy-production.sh logs

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f nginx
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 80, 3000, 3001, 6333, 6380 are available
2. **Docker permissions**: Ensure user is in docker group
3. **SSL issues**: Verify certificate paths and nginx configuration

### Debug Commands
```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs service-name

# Restart services
./deploy-production.sh restart
```

## AI Assistant Slash Commands

This repository includes built-in slash commands for use with [opencode](https://opencode.ai) and compatible AI coding assistants.

### `/init-deep`

Generates hierarchical `AGENTS.md` documentation files throughout the project by deeply analyzing code structure, conventions, and patterns.

```
/init-deep                # Update mode: modify existing + create new where warranted
/init-deep --create-new   # Regenerate all AGENTS.md files from scratch
/init-deep --max-depth=2  # Limit directory depth (default: 3)
```

The command runs a multi-phase workflow:
1. **Discovery** – fires concurrent explore agents and gathers bash/LSP analysis
2. **Scoring** – ranks directories by complexity to decide where AGENTS.md files belong
3. **Generate** – writes root and subdirectory AGENTS.md files in parallel
4. **Review** – deduplicates content and validates quality

Command definition: [`.opencode/commands/init-deep.md`](.opencode/commands/init-deep.md)

> Ported from [code-yeongyu/oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) — no installation of oh-my-openagent required.

## Documentation

- **[Production Deployment Guide](PRODUCTION-DEPLOYMENT.md)** - Comprehensive deployment instructions
- **[Web App README](apps/web/README.md)** - Frontend application details
- **[ML API README](apps/ml-api/README.md)** - ML service documentation

## License

[Your License Here]