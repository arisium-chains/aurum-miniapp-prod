# Docker Build npm Network Timeout Fix Plan

## Problem Analysis

### Current Issue

The Docker build is failing with `ETIMEDOUT` errors during npm installation:

```
npm error code ETIMEDOUT
npm error errno ETIMEDOUT
npm error network request to https://registry.npmjs.org/csstype/-/csstype-3.1.3.tgz failed
```

### Root Causes

1. **Network connectivity issues** between Docker container and npm registry
2. **Unreliable npm registry access** during build process
3. **Missing retry mechanisms** for transient network failures
4. **No fallback registry configuration**
5. **Inadequate timeout settings** for npm operations

## Solution Strategy

### Phase 1: Network Configuration & npm Settings

1. **Configure npm with better timeout settings**

   - Increase timeout from default to 300 seconds
   - Add retry logic with exponential backoff
   - Configure max retries for failed requests

2. **Setup npm registry fallback mechanism**
   - Primary: https://registry.npmjs.org
   - Fallback 1: https://registry.yarnpkg.com
   - Fallback 2: https://registry.npmmirror.com (formerly taobao)
   - Configure npm to try multiple registries

### Phase 2: Build Process Optimization

1. **Implement npm cache warming**

   - Pre-warm npm cache before installation
   - Use offline package caching when available
   - Leverage Docker layer caching for dependencies

2. **Create robust installation script**
   - Implement retry logic with exponential backoff
   - Add fallback installation methods
   - Include comprehensive error handling and logging

### Phase 3: Docker Configuration

1. **Update Dockerfile with network optimizations**

   - Add better network configuration
   - Configure npm settings in Docker build context
   - Implement multi-stage build optimizations

2. **Add build arguments for registry configuration**
   - Allow custom registry URLs
   - Support proxy configuration
   - Enable/disable offline mode

## Implementation Plan

### Step 1: Create Robust npm Installation Script

```bash
#!/bin/sh
# scripts/install-deps.sh

set -e

# Configure npm settings
npm config set fetch-timeout 300000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-retry-factor 2

# Setup registry fallback
REGISTRIES=(
  "https://registry.npmjs.org"
  "https://registry.yarnpkg.com"
  "https://registry.npmmirror.com"
)

# Function to install with retry
install_with_retry() {
  local max_attempts=3
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    echo "📦 Attempt $attempt to install dependencies..."

    if npm ci --ignore-scripts --registry "$1" 2>/dev/null; then
      echo "✅ Dependencies installed successfully"
      return 0
    fi

    echo "❌ Attempt $attempt failed"
    if [ $attempt -lt $max_attempts ]; then
      echo "⏳ Waiting before retry..."
      sleep 10
    fi
    attempt=$((attempt + 1))
  done

  return 1
}

# Try each registry
for registry in "${REGISTRIES[@]}"; do
  echo "🔍 Trying registry: $registry"
  if install_with_retry "$registry"; then
    exit 0
  fi
done

echo "❌ All registries failed"
exit 1
```

### Step 2: Update Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    curl \
    wget \
    && rm -rf /var/cache/apk/*

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-retry-factor 2

# Copy package files
COPY package*.json ./

# Use robust installation script
COPY scripts/install-deps.sh .
RUN chmod +x install-deps.sh && ./install-deps.sh
```

### Step 3: Add Network Configuration Support

```dockerfile
# Add build arguments for network configuration
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG NPM_PROXY=
ARG NPM_OFFLINE=false

# Configure npm based on build arguments
RUN if [ ! -z "$NPM_PROXY" ]; then \
      npm config set proxy "$NPM_PROXY" \
    ; fi \
    && if [ "$NPM_OFFLINE" = "true" ]; then \
      npm config set offline true \
    ; fi
```

### Step 4: Create Build Script with Network Diagnostics

```bash
#!/bin/sh
# scripts/build-with-network-check.sh

set -e

echo "🔍 Running network diagnostics..."

# Test network connectivity
if ! curl -s --max-time 10 https://registry.npmjs.org > /dev/null; then
  echo "⚠️  Primary npm registry unreachable"
  echo "🔄 Trying alternative registries..."

  # Try alternative registries
  if curl -s --max-time 10 https://registry.yarnpkg.com > /dev/null; then
    echo "✅ Yarn registry accessible"
    export NPM_REGISTRY=https://registry.yarnpkg.com
  elif curl -s --max-time 10 https://registry.npmmirror.com > /dev/null; then
    echo "✅ npmmirror registry accessible"
    export NPM_REGISTRY=https://registry.npmmirror.com
  else
    echo "❌ No registries accessible"
    exit 1
  fi
fi

echo "🚀 Starting build with registry: ${NPM_REGISTRY:-default}"
docker build --build-arg NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org}" -t aurum-circle-miniapp .
```

## Testing Strategy

### Test Cases

1. **Normal Network Conditions**

   - Test with primary npm registry
   - Verify all dependencies install correctly
   - Confirm build completes successfully

2. **Network Degradation**

   - Test with slow/unreliable network
   - Verify retry mechanism works
   - Confirm fallback registries are used

3. **Registry Unavailability**

   - Test with primary registry down
   - Verify fallback to alternative registries
   - Confirm build still completes

4. **Proxy Configuration**
   - Test with proxy settings
   - Verify npm proxy configuration
   - Confirm build works behind proxy

### Success Criteria

- ✅ Docker build completes successfully
- ✅ All dependencies installed without errors
- ✅ Build time is reasonable (under 10 minutes)
- ✅ Works in various network conditions
- ✅ Supports proxy configuration
- ✅ Has proper error handling and logging

## Rollout Plan

### Phase 1: Development Testing

1. Test the new installation script locally
2. Verify network diagnostic functionality
3. Test with different registry configurations

### Phase 2: Integration Testing

1. Update Dockerfile with new installation method
2. Test build process in CI/CD environment
3. Verify all build stages work correctly

### Phase 3: Production Deployment

1. Deploy updated Dockerfile to production
2. Monitor build success rates
3. Collect performance metrics
4. Fine-tune configuration based on results

## Monitoring & Maintenance

### Build Metrics to Track

- Build success rate
- Average build time
- Network retry attempts
- Registry usage statistics
- Error rates by registry

### Maintenance Tasks

- Regular registry health checks
- Update npm version periodically
- Monitor npm registry status
- Update fallback registries as needed
- Review and update timeout settings

## Alternative Solutions

### Option 1: Use Yarn Instead of npm

```dockerfile
RUN npm install -g yarn
RUN yarn install --ignore-scripts --frozen-lockfile
```

### Option 2: Use Package Caching

```dockerfile
# Pre-cache packages
RUN npm ci --ignore-scripts --cache /tmp/.npm
```

### Option 3: Multi-Registry Configuration

```json
// .npmrc
registry=https://registry.npmjs.org
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
//registry.yarnpkg.com/:_authToken=${YARN_TOKEN}
```

## Conclusion

This comprehensive plan addresses the npm network timeout issue by implementing:

- Robust retry mechanisms
- Multiple registry fallbacks
- Better network configuration
- Comprehensive error handling
- Build process optimization

The solution ensures reliable Docker builds in various network conditions while maintaining good performance and scalability.
