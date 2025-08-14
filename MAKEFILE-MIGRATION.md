# Makefile Migration Guide

This guide helps you migrate from shell scripts to the new Makefile-based deployment system.

## 🔄 Command Migration

### **Old Shell Scripts → New Makefile Commands**

| Old Command | New Command | Description |
|-------------|-------------|-------------|
| `./setup-production-env.sh` | `make setup` | Setup environment files |
| `./validate-deployment.sh` | `make validate` | Validate deployment |
| `./deploy-production.sh` | `make deploy` | Full deployment |
| `docker compose -f docker-compose.prod.yml up -d` | `make quick-deploy` | Quick deployment |
| `docker compose -f docker-compose.prod.yml ps` | `make status` | Service status |
| `docker compose -f docker-compose.prod.yml logs` | `make logs` | View logs |
| `docker compose -f docker-compose.prod.yml down` | `make down` | Stop services |

### **New Convenience Commands**

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make all` | Complete setup and deployment |
| `make health` | Check service health |
| `make test` | Run health checks and tests |
| `make clean` | Clean unused Docker resources |
| `make backup` | Backup application data |
| `make reset` | Reset entire environment |

## 🚀 Quick Migration Steps

1. **Remove old shell scripts** (optional):
   ```bash
   rm setup-production-env.sh validate-deployment.sh deploy-production.sh
   ```

2. **Use new Makefile commands**:
   ```bash
   make all  # Complete setup and deployment
   ```

## 🛠️ Benefits of Makefile

- ✅ **Consistent interface**: All commands follow `make <target>` pattern
- ✅ **Built-in help**: `make help` shows all available commands
- ✅ **Dependency management**: Commands automatically run prerequisites
- ✅ **Error handling**: Better error messages and validation
- ✅ **Colored output**: Clear status indicators
- ✅ **Organized commands**: Grouped by functionality
- ✅ **Cross-platform**: Works on Linux, macOS, and Windows

## 📋 Command Categories

### **Environment Setup**
- `make setup` - Setup environment files

### **Validation**
- `make validate` - Validate configuration

### **Docker Operations**
- `make build` - Build images
- `make pull` - Pull latest images

### **Deployment**
- `make deploy` - Full deployment
- `make quick-deploy` - Quick deployment

### **Service Management**
- `make start` - Start services
- `make stop` - Stop services
- `make restart` - Restart services
- `make down` - Stop and remove containers

### **Monitoring**
- `make status` - Service status
- `make logs` - All service logs
- `make health` - Health checks

### **Testing**
- `make test` - Run tests

### **Maintenance**
- `make clean` - Clean resources
- `make backup` - Backup data

## 🔧 Customization

The Makefile can be customized by modifying variables at the top:

```makefile
COMPOSE_FILE := docker-compose.prod.yml
PROJECT_NAME := aurum-miniapp-prod
LOG_FILE := deployment.log
```

## 📚 Additional Resources

- Run `make help` for complete command list
- See `PRODUCTION-DEPLOYMENT.md` for detailed deployment guide
- Check `README.md` for project overview

---

**The Makefile provides a more robust, organized, and user-friendly deployment experience!** 🎯