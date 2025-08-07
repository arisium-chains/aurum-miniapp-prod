#!/bin/sh

# Network diagnostic script for Docker builds
# Helps identify connectivity issues and provides solutions

set -e

echo "🔍 Network Diagnostic Script"
echo "============================="

# Function to test a registry
test_registry() {
  local registry="$1"
  local name="$2"
  
  echo ""
  echo "📡 Testing $name ($registry)..."
  
  # Test basic connectivity
  if ! curl -s --max-time 10 --head "$registry" > /dev/null 2>&1; then
    echo "   ❌ Basic connectivity test FAILED"
    return 1
  fi
  
  # Test package download
  if ! curl -s --max-time 30 "$registry/csstype/-/csstype-3.1.3.tgz" > /dev/null 2>&1; then
    echo "   ❌ Package download test FAILED"
    return 1
  fi
  
  echo "   ✅ All tests PASSED"
  return 0
}

# Test main registries
echo ""
echo "🌐 Testing npm registries..."

REGISTRIES="https://registry.npmjs|Primary npm registry https://registry.yarnpkg.com|Yarn registry https://registry.npmmirror.com|npmmirror registry https://registry.npm.taobao.org|Taobao registry (legacy)"

REGISTRY_SUCCESS=false

for registry_info in $REGISTRIES; do
  IFS='|' read -r registry name <<< "$registry_info"
  
  if test_registry "$registry" "$name"; then
    REGISTRY_SUCCESS=true
    BEST_REGISTRY="$registry"
    BEST_NAME="$name"
    break
  fi
done

if [ "$REGISTRY_SUCCESS" = false ]; then
  echo ""
  echo "❌ No registries are accessible!"
  echo ""
  echo "🔧 Troubleshooting steps:"
  echo "1. Check your internet connection"
  echo "2. Check if you're behind a proxy"
  echo "3. Check firewall settings"
  echo "4. Try again later (might be temporary outage)"
  echo ""
  echo "🌐 Test your connection manually:"
  echo "   curl -I https://registry.npmjs.org"
  exit 1
fi

echo ""
echo "✅ Best registry found: $BEST_NAME ($BEST_REGISTRY)"
echo ""

# Test npm configuration
echo "⚙️  Testing npm configuration..."
echo "   Current registry: $(npm config get registry 2>/dev/null || echo 'not set')"
echo "   Current proxy: $(npm config get proxy 2>/dev/null || echo 'not set')"
echo "   Current timeout: $(npm config get fetch-timeout 2>/dev/null || echo 'default')"

# Test DNS resolution
echo ""
echo "🔍 Testing DNS resolution..."
if nslookup registry.npmjs.org > /dev/null 2>&1; then
  echo "   ✅ DNS resolution working"
else
  echo "   ❌ DNS resolution failed"
  echo "   💡 Try: echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf > /dev/null"
fi

# Test network speed
echo ""
echo "📊 Testing network speed..."
if command -v curl >/dev/null 2>&1; then
  echo "   Downloading test file..."
  if time curl -s --max-time 60 https://registry.npmjs.org/csstype/-/csstype-3.1.3.tgz > /dev/null; then
    echo "   ✅ Network speed test completed"
  else
    echo "   ❌ Network speed test failed"
  fi
fi

# Provide recommendations
echo ""
echo "💡 Recommendations:"
echo "1. Use the best registry found: $BEST_NAME"
echo "2. Configure npm timeout settings:"
echo "   npm config set fetch-timeout 300000"
echo "3. If using proxy, configure:"
echo "   npm config set proxy http://proxy:port"
echo "4. For Docker builds, use:"
echo "   docker build --build-arg NPM_REGISTRY='$BEST_REGISTRY' ."

echo ""
echo "🎉 Network diagnostic completed!"