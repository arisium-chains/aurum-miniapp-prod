#!/bin/bash

# Deploy Aurum Circle Attractiveness Engine to Fly.io (Real ML Mode)
# Optimized for TensorFlow.js + MediaPipe + ArcFace models

set -e

echo "🚀 Deploying Aurum Circle Attractiveness Engine (Real ML Mode) to Fly.io..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Please install: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check if logged in to Fly.io
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Please log in to Fly.io first:"
    fly auth login
fi

# Create app if it doesn't exist
APP_NAME="aurum-circle-attractiveness-ml"
if ! fly apps list | grep -q "$APP_NAME"; then
    echo "📱 Creating new Fly.io app: $APP_NAME"
    fly apps create "$APP_NAME" --generate-name=false
else
    echo "✅ App $APP_NAME already exists"
fi

# Create persistent volume for embeddings if it doesn't exist
VOLUME_NAME="aurum_embeddings_vol"
if ! fly volumes list | grep -q "$VOLUME_NAME"; then
    echo "💾 Creating persistent volume for embeddings..."
    fly volumes create "$VOLUME_NAME" --region sea --size 10 # 10GB for embeddings
else
    echo "✅ Volume $VOLUME_NAME already exists"
fi

# Set required secrets (if not already set)
echo "🔐 Setting up production secrets..."

# Check if secrets exist, if not prompt user to set them
secrets_needed=(
    "JWT_SECRET"
    "NEXT_PUBLIC_WORLDCOIN_APP_ID" 
    "WORLDCOIN_APP_SECRET"
)

for secret in "${secrets_needed[@]}"; do
    if ! fly secrets list | grep -q "$secret"; then
        echo "⚠️  Secret $secret not found. Please set it:"
        echo "   fly secrets set $secret=your_value_here"
        echo ""
    fi
done

# Optional secrets for advanced features
echo "📋 Optional secrets for advanced features:"
echo "   fly secrets set NFT_CONTRACT_ADDRESS=0x..."
echo "   fly secrets set ALCHEMY_API_KEY=your_key"
echo "   fly secrets set R2_ACCESS_KEY_ID=your_key (for backup storage)"
echo "   fly secrets set R2_SECRET_ACCESS_KEY=your_key"
echo "   fly secrets set R2_BUCKET_NAME=your_bucket"
echo ""

# Deploy the application
echo "🏗️  Building and deploying application..."
fly deploy --config fly.attractiveness.toml --dockerfile Dockerfile.attractiveness

# Check deployment status
echo "🔍 Checking deployment status..."
fly status --app="$APP_NAME"

# Show logs
echo "📋 Recent logs:"
fly logs --app="$APP_NAME" --limit=20

# Test ML endpoints
echo "🧪 Testing ML endpoints..."
APP_URL="https://${APP_NAME}.fly.dev"

echo "Testing health check..."
curl -f "$APP_URL/api/attractiveness/ml-status" | jq . || echo "❌ Health check failed"

echo "Testing stats endpoint..."
curl -f "$APP_URL/api/attractiveness/stats" | jq . || echo "❌ Stats endpoint failed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Main App: $APP_URL"
echo "   Old Demo: $APP_URL/ai-demo"
echo "   New Demo: $APP_URL/attractiveness-demo"
echo "   ML Status: $APP_URL/api/attractiveness/ml-status"
echo ""
echo "🔧 Management Commands:"
echo "   fly logs --app=$APP_NAME"
echo "   fly ssh console --app=$APP_NAME"
echo "   fly scale count 2 --app=$APP_NAME  # Scale to 2 instances"
echo "   fly scale memory 4096 --app=$APP_NAME  # Scale to 4GB RAM"
echo ""
echo "📊 Monitor performance:"
echo "   fly dashboard --app=$APP_NAME"
echo "   fly metrics --app=$APP_NAME"
echo ""

# Performance recommendations
echo "🎯 Performance Tips:"
echo "   - Monitor memory usage with: fly metrics --app=$APP_NAME"
echo "   - Scale up for high traffic: fly scale count 3"
echo "   - Use fly regions list to deploy closer to users"
echo "   - Check ML model loading time in logs"
echo ""

echo "🎉 Ready to serve attractiveness scoring with real ML models!"