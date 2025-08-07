#!/bin/sh

# Docker build script with network diagnostics and fallback options
# Provides robust build process with multiple registry options

set -e

echo "🚀 Docker Build Script with Network Support"
echo "==========================================="

# Default values
REGISTRY=""
USE_NETWORK_CHECK=true
FORCE_OFFLINE=false
SHOW_HELP=false

# Parse command line arguments
while [ $# -gt 0 ]; do
  case $1 in
    --registry)
      REGISTRY="$2"
      shift 2
      ;;
    --no-network-check)
      USE_NETWORK_CHECK=false
      shift
      ;;
    --offline)
      FORCE_OFFLINE=true
      shift
      ;;
    --help|-h)
      SHOW_HELP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Show help if requested
if [ "$SHOW_HELP" = true ]; then
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --registry URL      Use specific npm registry"
  echo "  --no-network-check  Skip network diagnostic check"
  echo "  --offline           Force offline mode"
  echo "  --help, -h          Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0                                    # Normal build"
  echo "  $0 --registry https://registry.yarnpkg.com  # Use Yarn registry"
  echo "  $0 --offline                         # Force offline build"
  echo "  $0 --no-network-check                # Skip network check"
  echo ""
  exit 0
fi

# Build arguments for Docker
BUILD_ARGS="--build-arg NPM_OFFLINE=$FORCE_OFFLINE"

# Add registry if specified
if [ ! -z "$REGISTRY" ]; then
  echo "🎯 Using custom registry: $REGISTRY"
  BUILD_ARGS="$BUILD_ARGS --build-arg NPM_REGISTRY=$REGISTRY"
else
  echo "🔄 Using default registry fallback mechanism"
fi

# Add proxy if configured
if [ ! -z "$NPM_PROXY" ]; then
  echo "🔗 Using proxy: $NPM_PROXY"
  BUILD_ARGS="$BUILD_ARGS --build-arg NPM_PROXY=$NPM_PROXY"
fi

# Network diagnostic check
if [ "$USE_NETWORK_CHECK" = true ]; then
  echo ""
  echo "🔍 Running network diagnostic..."
  
  if [ -f "scripts/network-check.sh" ]; then
    chmod +x scripts/network-check.sh
    if ./scripts/network-check.sh; then
      echo "✅ Network diagnostic passed"
    else
      echo "⚠️  Network diagnostic failed, but continuing with build..."
      echo "💡 You can skip network check with --no-network-check"
    fi
  else
    echo "⚠️  Network check script not found"
  fi
fi

# Build command
echo ""
echo "🏗️  Starting Docker build..."
echo "   Build arguments: $BUILD_ARGS"
echo ""

# Run the build
if docker build $BUILD_ARGS -t aurum-circle-miniapp .; then
  echo ""
  echo "🎉 Docker build completed successfully!"
  echo ""
  echo "📦 To run the container:"
  echo "   docker run -p 3000:3000 aurum-circle-miniapp"
  echo ""
  echo "🔍 To inspect the image:"
  echo "   docker images | grep aurum-circle-miniapp"
  echo ""
  echo "🗑️  To clean up:"
  echo "   docker rmi aurum-circle-miniapp"
else
  echo ""
  echo "❌ Docker build failed!"
  echo ""
  echo "💡 Troubleshooting options:"
  echo "1. Try with different registry:"
  echo "   $0 --registry https://registry.yarnpkg.com"
  echo ""
  echo "2. Try with offline mode:"
  echo "   $0 --offline"
  echo ""
  echo "3. Check network connectivity:"
  echo "   ./scripts/network-check.sh"
  echo ""
  echo "4. Build with verbose output:"
  echo "   docker build $BUILD_ARGS --no-cache -t aurum-circle-miniapp ."
  echo ""
  exit 1
fi