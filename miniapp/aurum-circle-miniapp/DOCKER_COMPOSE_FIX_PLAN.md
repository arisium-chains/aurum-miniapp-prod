# Docker Compose Fix Plan

## Issue Summary

The docker-compose build was failing with the error:

```
ERROR: build path /root/aurum-circle-miniapp/miniapp/aurum-circle-miniapp/ml-face-score-api either does not exist, is not accessible, or is not a valid URL.
```

This was caused by incorrect context paths in the `miniapp/aurum-circle-miniapp/docker-compose.yml` file for the Rust ML services.

## Root Cause

In the `miniapp/aurum-circle-miniapp/docker-compose.yml` file, the Rust ML services had the following configuration:

```yaml
face-detection-service:
  build:
    context: ../..
    dockerfile: aurum-ml-services/face-detection/Dockerfile

face-embedding-service:
  build:
    context: ../..
    dockerfile: aurum-ml-services/face-embedding/Dockerfile
```

When running docker-compose from the `miniapp/aurum-circle-miniapp` directory, `../..` points to the root directory, but the Dockerfile paths were relative to that root directory. However, the actual structure requires the context to be set to the `aurum-ml-services` directory.

## Fix Applied

Updated the `miniapp/aurum-circle-miniapp/docker-compose.yml` file to use correct relative paths:

```yaml
face-detection-service:
  build:
    context: ../../aurum-ml-services
    dockerfile: face-detection/Dockerfile

face-embedding-service:
  build:
    context: ../../aurum-ml-services
    dockerfile: face-embedding/Dockerfile
```

## Verification Steps

1. **Verify File Structure**:

   - Confirm that all required Dockerfiles exist:
     - `aurum-ml-services/face-detection/Dockerfile`
     - `aurum-ml-services/face-embedding/Dockerfile`
     - `miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile`

2. **Test Docker Build Commands**:

   - Test building each service individually:

     ```bash
     # From miniapp/aurum-circle-miniapp directory
     docker build -f ml-face-score-api/Dockerfile ml-face-score-api

     # Test Rust services (from root directory)
     docker build -f aurum-ml-services/face-detection/Dockerfile aurum-ml-services
     docker build -f aurum-ml-services/face-embedding/Dockerfile aurum-ml-services
     ```

3. **Test Docker Compose Configuration**:

   - Run docker-compose from the `miniapp/aurum-circle-miniapp` directory:
     ```bash
     cd miniapp/aurum-circle-miniapp
     docker-compose up --build
     ```

4. **Verify Service Communication**:
   - Check that all services start correctly
   - Verify that the Next.js app can communicate with the ML services
   - Test the attractiveness scoring API endpoints

## Expected Results

After applying the fix:

- Docker-compose should build all services without path errors
- All containers should start successfully
- Services should be able to communicate with each other
- The application should function as expected with the Rust ML services

## Rollback Plan

If issues persist after the fix:

1. Revert the changes to `miniapp/aurum-circle-miniapp/docker-compose.yml`
2. Check if the docker-compose is being run from a different directory structure
3. Consider creating a separate docker-compose file for different deployment environments
