# 🌟 Aurum Circle - Exclusive Dating Miniapp

A secret society-themed dating platform for Bangkok university students with World ID verification and NFT access gates.

## 🚀 Optimized Version

This repository includes an optimized version that reduces the upload size from over 2GB to ~832MB. See `README_OPTIMIZED.md` for details on the optimizations applied.

## 📦 Important Note About ML Models

To reduce repository size, ML model files have been removed from Git tracking. After cloning this repository, you'll need to download the models separately:

```bash
# Download models separately (models are not included in the repo)
npm run download-models
```

In a real deployment, replace the placeholder script with actual download commands pointing to your model repository or CDN.

## 🚀 Quick Start

### Option 1: Complete Setup (Recommended)

```bash
# Complete setup with ML models (one command)
just setup         # Install deps + ML models + start server

# Or step by step
just install       # Install dependencies
just setup-ml      # Setup ML models (optional)
just dev          # Start development server
```

### Option 2: Docker Setup (Recommended for Production)

```bash
# Build and start all services
docker-compose up --build
```

### Option 3: Available Just Commands

```bash
# Core Commands
just               # Show all available commands
just setup         # Complete setup (recommended)
just dev           # Start development server
just build         # Build for production
just clean         # Clean project

# ML & Demo Commands
just setup-ml      # Setup ML models
just demo-old      # Open original AI demo
just demo-new      # Open attractiveness demo
just test-demo     # Test scoring API
just test-ml       # Check ML status

# Status & Info
just models        # Show ML model info
just full-status   # Complete project status
```

### Option 4: Manual Setup

```bash
npm install
# Edit .env.local with your World ID credentials
npm run dev
```

## 📱 Testing in World App

1. **Install World App** on your mobile device
2. **Complete World ID verification** (Orb required)
3. **Open the mobile URL** in World App browser (not regular browser)
4. **Test the authentication flow**

## 🔧 Configuration Required

You'll need a World ID app configured at https://developer.worldcoin.org/:

- **App Type**: `Miniapp` (not Web)
- **Verification Level**: `Orb`
- **Action**: `verify-human`

See `WORLD_ID_SETUP.md` for detailed instructions.

## ✨ Features

- 🌍 **World ID Verification** - Anti-bot protection
- 💼 **NFT Access Gate** - Exclusive to Bangkok university students
- 🎭 **Secret Society Theme** - Dark academia aesthetic
- 📱 **Mobile-First PWA** - Optimized for World App
- 🔒 **Secure Authentication** - JWT session management
- 🤖 **AI Attractiveness Scoring** - Facial analysis with ML
- 📊 **Comprehensive Scoring System** - Facial + University + NFT
- 🚀 **High Performance** - Redis caching, BullMQ queues, persistent vector store
- ⚡ **Rust ML Services** - High-performance face detection and embedding extraction

## 🏗️ Authentication Flow

```
World ID → Wallet Connection → NFT Gate → Profile Setup → Main App
```

## 📚 Documentation

- `DEV_SETUP.md` - Complete development guide
- `WORLD_ID_SETUP.md` - World ID app configuration
- `ARCHITECTURE.md` - System design overview
- `REQUIREMENTS.md` - Detailed requirements
- `ML_MODELS_README.md` - ML model setup and configuration
- `CHANGELOG.md` - Recent updates and version history
- `ENVIRONMENT.md` - Environment variables setup
- `RUST_ML_ARCHITECTURE.md` - Rust ML services architecture
- `RUST_INTEGRATION_PLAN.md` - Integration plan for Rust services
- `RUST_DEPLOYMENT_PLAN.md` - Deployment plan for Rust services

## 🛠️ Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: World ID Miniapp SDK
- **Blockchain**: Viem + Wagmi
- **State**: Zustand
- **UI**: Custom components with dark academia theme
- **ML Models**: TensorFlow.js + MediaPipe + ArcFace (with simulation fallback)
- **Rust ML Services**: High-performance face detection and embedding extraction
- **Vector Store**: Qdrant (persistent) with in-memory fallback for development
- **Caching**: Redis
- **Queues**: BullMQ
- **Deployment**: Docker + Docker Compose

## 🚧 Development Status

### ✅ Complete

- World ID Miniapp SDK integration
- Complete authentication flow
- Profile onboarding system
- Dark academia UI design
- Session management
- **AI Attractiveness Scoring Engine** (v2.5)
- **ML Model Integration** (Real + Simulated modes)
- **Face Quality Validation** (Demo-optimized)
- **Vector-based Similarity Matching**
- **Percentile Ranking System**
- **Final Score Calculation API** (facial + university + NFT)
- **Redis Caching Layer**
- **Image Preprocessing Queue**
- **Persistent Vector Store**
- **Rate Limiting**
- **Tokenized Image Uploads**
- **Profile Strength Meter**
- **Score Breakdown UI**
- **Leaderboard Filters**
- **Score Expiry System**
- **Modular ML Logic**
- **Multi-chain NFT Support**
- **Rust ML Services Integration** - High-performance face detection and embedding extraction

### 🔄 Next Steps

- Deploy ML models to production
- Real blockchain NFT verification
- Discovery/matching system integration
- Secret signals feature
- Real-time user matching with ML scores
- Full deployment of Rust ML services

## 📞 Support

- Check documentation files
- Review error logs in browser console
- Ensure you're testing in World App (not regular browser)

---

**Ready to find your perfect match in Bangkok's exclusive student circle? Run the app and start connecting! 💫**
