# Server Deployment Fix for Docker Compose Path Issue

## Issue Analysis

The error `ERROR: build path /root/aurum-circle-miniapp/miniapp/aurum-circle-miniapp/ml-face-score-api either does not exist, is not accessible, or is not a valid URL` occurs when running `docker-compose up --build` from the `/root/aurum-circle-miniapp` directory.

## Root Cause

After analyzing the directory structure and docker-compose configuration, the issue appears to be related to path resolution in the docker-compose environment. The path exists and is correct, but docker-compose is unable to access it properly.

## Solutions

### Solution 1: Clear Docker Compose Cache

```bash
# Clear docker-compose cache
docker-compose down
docker system prune -af
docker volume prune -f

# Then try again
docker-compose up --build
```

### Solution 2: Use Absolute Paths

Modify the `docker-compose.yml` file to use absolute paths instead of relative paths:

```yaml
# Change this section in docker-compose.yml
ml-api:
  build:
    context: /root/aurum-circle-miniapp/miniapp/aurum-circle-miniapp/ml-face-score-api
    dockerfile: Dockerfile
```

### Solution 3: Run from the Correct Directory

Instead of running from `/root/aurum-circle-miniapp`, try running from the `miniapp/aurum-circle-miniapp` directory:

```bash
cd miniapp/aurum-circle-miniapp
docker-compose up --build
```

But you'll need to update the paths in the docker-compose.yml file accordingly.

### Solution 4: Check Permissions

Ensure that the directory has the correct permissions:

```bash
# Check current permissions
ls -la miniapp/aurum-circle-miniapp/ml-face-score-api

# If needed, fix permissions
chmod -R 755 miniapp/aurum-circle-miniapp/ml-face-score-api
chown -R root:root miniapp/aurum-circle-miniapp/ml-face-score-api
```

### Solution 5: Use Docker Build Context Explicitly

Try building the service directly first:

```bash
# Build the ml-api service directly
docker build -t ml-api -f miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile miniapp/aurum-circle-miniapp/ml-face-score-api

# Then run docker-compose
docker-compose up
```

## Recommended Approach

1. First try Solution 1 (clear cache)
2. If that doesn't work, check permissions (Solution 4)
3. As a last resort, use absolute paths (Solution 2)

## Verification Steps

After applying any of the solutions:

1. Verify the directory exists: `ls -la miniapp/aurum-circle-miniapp/ml-face-score-api`
2. Verify the Dockerfile exists: `ls -la miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile`
3. Test building the Dockerfile directly: `docker build -f miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile miniapp/aurum-circle-miniapp/ml-face-score-api`
4. Run docker-compose: `docker-compose up --build`
