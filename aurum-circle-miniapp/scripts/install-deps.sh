#!/bin/sh

# Robust npm installation script with retry logic and fallback registries
# Designed to handle network timeouts and unreliable registry access

set -e

echo "🚀 Starting robust npm installation..."

# Configure npm with better timeout and retry settings
echo "⚙️  Configuring npm for better network handling..."
npm config set fetch-timeout 300000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-retry-factor 2
npm config set fetch-retry-maxtimeout 120000

# Setup registry fallback configuration
# Use custom registry if provided, otherwise use default fallbacks
if [ ! -z "$NPM_REGISTRY" ] && [ "$NPM_REGISTRY" != "https://registry.npmjs.org" ]; then
  echo "🎯 Using custom registry: $NPM_REGISTRY"
  REGISTRIES="$NPM_REGISTRY"
else
  REGISTRIES="https://registry.npmjs.org https://registry.yarnpkg.com https://registry.npmmirror.com"
fi

# Function to install with retry logic
install_with_retry() {
  local registry="$1"
  local max_attempts=3
  local attempt=1
  
  echo "📦 Attempting installation with registry: $registry"
  
  while [ $attempt -le $max_attempts ]; do
    echo "🔄 Attempt $attempt of $max_attempts..."
    
    if npm ci --ignore-scripts --registry "$registry" --legacy-peer-deps 2>/dev/null; then
      echo "✅ Dependencies installed successfully using $registry"
      return 0
    fi
    
    echo "❌ Attempt $attempt failed with registry: $registry"
    if [ $attempt -lt $max_attempts ]; then
      echo "⏳ Waiting before retry (10s)..."
      sleep 10
    fi
    attempt=$((attempt + 1))
  done
  
  return 1
}

# Function to test registry connectivity
test_registry() {
  local registry="$1"
  echo "🔍 Testing connectivity to: $registry"
  
  if curl -s --max-time 15 --head "$registry" > /dev/null 2>&1; then
    echo "✅ Registry $registry is accessible"
    return 0
  else
    echo "❌ Registry $registry is not accessible"
    return 1
  fi
}

# Test network connectivity first
echo "🌐 Testing network connectivity..."
NETWORK_TEST=false

for registry in $REGISTRIES; do
  if test_registry "$registry"; then
    NETWORK_TEST=true
    break
  fi
done

if [ "$NETWORK_TEST" = false ]; then
  echo "❌ No registries are accessible. Please check your network connection."
  echo "💡 You might be behind a proxy. Try setting:"
  echo "   docker build --build-arg NPM_PROXY=http://proxy:port"
  exit 1
fi

# Try each registry in order
for registry in $REGISTRIES; do
  echo "🎯 Trying registry: $registry"
  
  if install_with_retry "$registry"; then
    echo "🎉 Installation completed successfully!"
    exit 0
  fi
  
  echo "⚠️  Registry $registry failed, trying next..."
done

echo "❌ All registries failed. Here are some troubleshooting options:"
echo ""
echo "1. Check your network connection:"
echo "   docker build --no-cache ."
echo ""
echo "2. Use a different registry:"
echo "   docker build --build-arg NPM_REGISTRY=https://registry.yarnpkg.com ."
echo ""
echo "3. Configure proxy settings:"
echo "   docker build --build-arg NPM_PROXY=http://proxy:port ."
echo ""
echo "4. Try offline mode (if you have npm cache):"
echo "   docker build --build-arg NPM_OFFLINE=true ."
echo ""
echo "5. Check if npm registry is down:"
echo "   curl -I https://registry.npmjs.org"
echo ""
exit 1