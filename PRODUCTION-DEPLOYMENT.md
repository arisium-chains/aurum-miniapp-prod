# Aurum Miniapp - Production Deployment Guide

This guide provides comprehensive instructions for deploying the Aurum Miniapp in a production environment on Ubuntu servers.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/arisium-chains/aurum-miniapp-prod.git
cd aurum-miniapp-prod

# Complete setup and deployment
make all

# Or step by step:
make setup     # Setup environment files
make validate  # Validate configuration
make deploy    # Deploy application
```

## 📋 Prerequisites

### System Requirements
- Ubuntu 20.04 LTS or later
- Docker 20.10+ and Docker Compose v2
- At least 4GB RAM and 20GB disk space
- Open ports: 80, 443 (optional), 3000, 3001, 6333, 6379

### Install Docker on Ubuntu

```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## 🔧 Configuration

### Environment Setup

The application requires environment configuration files that are not included in the repository for security reasons. Use the Makefile command:

```bash
make setup
```

This script will create:
- `.env.production` - Main application environment variables
- `apps/ml-api/.env.production` - ML API service environment variables

**⚠️ Important**: After running the setup command, review and update these files with your actual production values.

## 🛠️ Makefile Commands

The project includes a comprehensive Makefile with all deployment and management commands:

### **Quick Commands**
```bash
make help      # Show all available commands
make all       # Complete setup and deployment
make setup     # Setup environment files
make validate  # Validate configuration
make deploy    # Full deployment
make status    # Show service status
make health    # Check service health
make logs      # Show all service logs
```

### **Service Management**
```bash
make start     # Start services
make stop      # Stop services
make restart   # Restart services
make down      # Stop and remove containers
```

### **Monitoring & Testing**
```bash
make test      # Run health checks
make logs-web  # Web app logs only
make logs-ml   # ML API logs only
make logs-nginx # Nginx logs only
```

### **Maintenance**
```bash
make clean     # Clean unused Docker resources
make backup    # Backup application data
make update    # Update and restart services
make reset     # Reset entire environment
```

### Environment Variables

1. **Main Application** (`.env.production`):
   ```bash
   NODE_ENV=production
   REDIS_URL=redis://redis:6379
   QDRANT_HOST=qdrant
   QDRANT_PORT=6333
   ML_API_URL=http://ml-api:3000
   NEXT_PUBLIC_API_BASE_URL=http://your-domain.com
   JWT_SECRET=your-secure-jwt-secret
   NEXT_PUBLIC_WORLDCOIN_APP_ID=your-worldcoin-app-id
   WORLDCOIN_APP_SECRET=your-worldcoin-app-secret
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-wallet-connect-project-id
   ALCHEMY_API_KEY=your-alchemy-api-key
   NFT_CONTRACT_ADDRESS=your-nft-contract-address
   ```

2. **ML API** (`apps/ml-api/.env.production`):
   ```bash
   NODE_ENV=production
   REDIS_URL=redis://redis:6379
   PORT=3000
   HOST=0.0.0.0
   MODEL_PATH=/app/models
   LOG_LEVEL=info
   MAX_CONCURRENT_REQUESTS=10
   REQUEST_TIMEOUT=30000
   ```

### SSL/HTTPS Configuration

For production with SSL certificates:

1. Place your SSL certificates in `deploy/nginx/ssl/`:
   ```
   deploy/nginx/ssl/
   ├── cert.pem
   └── key.pem
   ```

2. Update `deploy/nginx/conf/default.conf`:
   - Uncomment the HTTPS server block
   - Update the `server_name` with your domain
   - Uncomment the HTTP to HTTPS redirect

3. Update `docker-compose.prod.yml`:
   - Uncomment the `443:443` port mapping for nginx

## 🏗️ Architecture

The application consists of:

- **Nginx**: Reverse proxy and load balancer
- **Web App**: Next.js frontend application
- **ML API**: Machine learning face scoring service
- **Redis**: Caching and session storage
- **Qdrant**: Vector database for ML operations

## 📦 Deployment Options

### Option 1: Automated Deployment (Recommended)

```bash
# Deploy everything
./deploy-production.sh

# Stop services
./deploy-production.sh stop

# Restart services
./deploy-production.sh restart

# View logs
./deploy-production.sh logs

# Check status
./deploy-production.sh status
```

### Option 2: Manual Deployment

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down
```

## 🔍 Health Checks

The application includes comprehensive health checks:

- **Nginx**: `http://localhost/nginx-health`
- **Web App**: `http://localhost/api/health`
- **ML API**: `http://localhost/ml-api/api/health`
- **Redis**: Built-in Redis ping
- **Qdrant**: `http://localhost:6333/health`

## 📊 Monitoring

### Service Status
```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# Check specific service
docker compose -f docker-compose.prod.yml ps nginx
```

### Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :80
   
   # Stop conflicting services
   sudo systemctl stop apache2  # or nginx
   ```

2. **Permission Denied**
   ```bash
   # Fix Docker permissions
   sudo chown -R $USER:$USER /var/run/docker.sock
   ```

3. **Out of Disk Space**
   ```bash
   # Clean up Docker
   docker system prune -a
   docker volume prune
   ```

4. **Service Won't Start**
   ```bash
   # Check logs
   docker compose -f docker-compose.prod.yml logs service-name
   
   # Restart specific service
   docker compose -f docker-compose.prod.yml restart service-name
   ```

### Debug Mode

To run with debug logging:

```bash
# Set debug environment
export COMPOSE_LOG_LEVEL=DEBUG

# Run deployment
./deploy-production.sh
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable Docker security scanning
- [ ] Configure log rotation
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

### Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

## 📈 Performance Optimization

### Resource Limits

Update `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Scaling

```bash
# Scale specific services
docker compose -f docker-compose.prod.yml up -d --scale app=3
```

## 🔄 Updates and Maintenance

### Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy-production.sh restart
```

### Database Backups

```bash
# Backup Redis
docker exec aurum-miniapp-prod-redis-1 redis-cli BGSAVE

# Backup Qdrant
docker exec aurum-miniapp-prod-qdrant-1 tar -czf /tmp/qdrant-backup.tar.gz /qdrant/storage
```

## 📞 Support

For issues and support:

1. Check the logs: `./deploy-production.sh logs`
2. Review this documentation
3. Check the GitHub issues
4. Contact the development team

## 📝 License

[Your License Here]