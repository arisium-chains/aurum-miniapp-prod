# Aurum Circle Deployment Fix

This guide explains how to fix the docker-compose path issue that causes the error:

```
ERROR: build path /root/aurum-circle-miniapp/miniapp/aurum-circle-miniapp/ml-face-score-api either does not exist, is not accessible, or is not a valid URL
```

## Root Cause

The error occurs when the `docker-compose.yml` file on your Ubuntu server has incorrect absolute paths. The file is trying to reference directories that don't exist at the specified locations.

## Solution

This repository contains the correct configuration files. You need to update the `docker-compose.yml` file on your server with the correct paths.

## Files in this Repository

1. `docker-compose.yml` - Correct relative paths configuration
2. `docker-compose-absolute.yml` - Alternative with absolute paths that work on your server
3. `docker-compose-fixed.yml` - Another version with correct relative paths
4. `fix-deployment.sh` - Automated script to fix the issue

## How to Fix the Issue

### Option 1: Automated Fix (Recommended)

1. Copy the `fix-deployment.sh` script to your Ubuntu server
2. Make it executable:
   ```bash
   chmod +x fix-deployment.sh
   ```
3. Run the script from the `aurum-circle` directory:
   ```bash
   ./fix-deployment.sh
   ```

### Option 2: Manual Fix

1. Copy the correct `docker-compose.yml` file to your server:

   ```bash
   # Backup the current file
   cp docker-compose.yml docker-compose.yml.backup

   # Replace with the correct file
   cp docker-compose-fixed.yml docker-compose.yml
   ```

2. Clear Docker cache:

   ```bash
   docker-compose down
   docker system prune -af
   docker volume prune -f
   ```

3. Start services:
   ```bash
   docker-compose up --build -d
   ```

## Verification

After applying the fix, verify that the services start correctly:

1. Check if services are running:

   ```bash
   docker-compose ps
   ```

2. Check logs if there are issues:
   ```bash
   docker-compose logs
   ```

## Additional Troubleshooting

If you still encounter issues:

1. Verify directory structure:

   ```bash
   ls -la miniapp/aurum-circle-miniapp/ml-face-score-api
   ```

2. Test Dockerfile directly:

   ```bash
   docker build -f miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile miniapp/aurum-circle-miniapp/ml-face-score-api
   ```

3. Check permissions:
   ```bash
   chmod -R 755 miniapp/aurum-circle-miniapp/ml-face-score-api
   ```

## Using Absolute Paths (Alternative Solution)

If you prefer to use absolute paths, you can use the `docker-compose-absolute.yml` file:

```bash
# Replace docker-compose.yml with absolute path version
cp docker-compose-absolute.yml docker-compose.yml

# Then start services
docker-compose up --build -d
```

Note: This version assumes your repository is located at `/root/aurum-miniapp-prod/` on the server.
