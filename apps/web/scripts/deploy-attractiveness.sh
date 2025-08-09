#!/bin/bash

# Deployment script for Aurum Circle Attractiveness Engine on Fly.io
set -e

echo "🚀 Deploying Aurum Circle Attractiveness Engine to Fly.io..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in to Fly
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly. Please run 'fly auth login' first."
    exit 1
fi

# Create volume for persistent embeddings storage if it doesn't exist
echo "📦 Setting up persistent volume for embeddings..."
if ! fly volumes list | grep -q "aurum_embeddings_vol"; then
    fly volumes create aurum_embeddings_vol --region sea --size 10
    echo "✅ Created persistent volume for embeddings"
else
    echo "✅ Embeddings volume already exists"
fi

# Set required secrets
echo "🔐 Setting up secrets..."

# Check if secrets exist, prompt if not
if ! fly secrets list | grep -q "NFT_VERIFICATION_KEY"; then
    echo "⚠️  NFT_VERIFICATION_KEY not set. Setting placeholder..."
    fly secrets set NFT_VERIFICATION_KEY="placeholder_nft_key"
fi

if ! fly secrets list | grep -q "WLD_VERIFICATION_KEY"; then
    echo "⚠️  WLD_VERIFICATION_KEY not set. Setting placeholder..."
    fly secrets set WLD_VERIFICATION_KEY="placeholder_wld_key"
fi

# Optional R2 backup storage
if ! fly secrets list | grep -q "R2_ACCESS_KEY_ID"; then
    echo "ℹ️  R2 backup storage not configured (optional)"
fi

# Build and deploy
echo "🔨 Building and deploying application..."
fly deploy --config fly.attractiveness.toml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
APP_URL="https://aurum-circle-attractiveness.fly.dev"

if curl -f -s "$APP_URL/api/attractiveness/stats" > /dev/null; then
    echo "✅ Health check passed!"
    echo "🎉 Deployment successful!"
    echo ""
    echo "📊 API Endpoints:"
    echo "   Score User:    POST $APP_URL/api/attractiveness/score"
    echo "   Get Score:     GET  $APP_URL/api/attractiveness/score?userId=USER_ID"
    echo "   Leaderboard:   GET  $APP_URL/api/attractiveness/leaderboard"
    echo "   Statistics:    GET  $APP_URL/api/attractiveness/stats"
    echo "   Similar Users: GET  $APP_URL/api/attractiveness/similar?userId=USER_ID"
    echo ""
    echo "🔗 Dashboard: https://fly.io/apps/aurum-circle-attractiveness"
    echo "📈 Metrics: https://fly.io/apps/aurum-circle-attractiveness/metrics"
else
    echo "❌ Health check failed. Check logs with 'fly logs'"
    exit 1
fi

# Show current status
echo ""
echo "📋 Current Status:"
fly status --config fly.attractiveness.toml

echo ""
echo "🎯 Next Steps:"
echo "1. Update NFT_VERIFICATION_KEY: fly secrets set NFT_VERIFICATION_KEY='your_real_key'"
echo "2. Update WLD_VERIFICATION_KEY: fly secrets set WLD_VERIFICATION_KEY='your_real_key'"
echo "3. Configure R2 backup (optional): fly secrets set R2_ACCESS_KEY_ID='key' R2_SECRET_ACCESS_KEY='secret' R2_BUCKET_NAME='bucket'"
echo "4. Scale if needed: fly scale count 2 --config fly.attractiveness.toml"
echo "5. Monitor: fly logs --config fly.attractiveness.toml"