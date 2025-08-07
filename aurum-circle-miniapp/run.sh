#!/bin/bash

# 🚀 Aurum Circle Miniapp - Easy Run Script
# This script sets up and runs the miniapp with one command

set -e

echo "🌟 Starting Aurum Circle Miniapp Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo ""
    echo "🔧 Creating .env.local with template..."
    cat > .env.local << 'EOF'
# ===== REQUIRED CONFIGURATION =====
# Get these from https://developer.worldcoin.org/

# World ID Configuration (REQUIRED)
# 1. Create app at https://developer.worldcoin.org/
# 2. Set App Type to "Miniapp" 
# 3. Copy App ID and App Secret below
NEXT_PUBLIC_WORLDCOIN_APP_ID=app_staging_your_actual_app_id_here
WORLDCOIN_APP_SECRET=sk_your_actual_app_secret_here

# JWT Configuration (REQUIRED)
# Generate a secure random string for session management
# Use: openssl rand -base64 32
JWT_SECRET=dev-jwt-secret-change-in-production-12345

# ===== OPTIONAL CONFIGURATION =====

# Wallet Connect Configuration (for future features)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id

# Blockchain Configuration (for NFT verification)
ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_CHAIN_ID=1

# NFT Contract Configuration (Bangkok University NFTs)
NFT_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Environment
NODE_ENV=development
EOF
    echo "✅ Created .env.local template"
    echo ""
    echo "⚠️  IMPORTANT: You need to update .env.local with your World ID credentials!"
    echo "   1. Visit: https://developer.worldcoin.org/"
    echo "   2. Create a new app with type 'Miniapp'"
    echo "   3. Copy App ID and App Secret to .env.local"
    echo ""
    read -p "Press Enter after updating .env.local to continue..."
fi

# Validate environment variables
echo "🔍 Checking environment configuration..."

if grep -q "your_actual_app_id_here" .env.local; then
    echo "❌ Please update NEXT_PUBLIC_WORLDCOIN_APP_ID in .env.local"
    echo "   Visit: https://developer.worldcoin.org/ to get your App ID"
    exit 1
fi

if grep -q "your_actual_app_secret_here" .env.local; then
    echo "❌ Please update WORLDCOIN_APP_SECRET in .env.local"
    echo "   Visit: https://developer.worldcoin.org/ to get your App Secret"
    exit 1
fi

echo "✅ Environment configuration looks good"

# Get local IP address for mobile testing
LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)

echo ""
echo "🎉 Starting Aurum Circle Miniapp..."
echo ""
echo "📱 Access URLs:"
echo "   Local:    http://localhost:3000"
if [ ! -z "$LOCAL_IP" ]; then
    echo "   Mobile:   http://$LOCAL_IP:3000"
fi
echo ""
echo "🔧 For World App testing:"
echo "   1. Install World App on your phone"
echo "   2. Complete World ID verification (Orb required)"
echo "   3. Open the mobile URL above in World App browser"
echo ""
echo "📖 Need help? Check DEV_SETUP.md or WORLD_ID_SETUP.md"
echo ""
echo "🚀 Starting development server..."

# Start the development server
npm run dev