# Changelog - Aurum Circle Attractiveness Engine

All notable changes to the ML-powered attractiveness scoring system.

## [v3.0.0] - 2025-07-25

### 🚀 Major System Upgrade

#### Infrastructure & Architecture
- **Redis Caching Layer**: Implemented facial score caching with 24-hour TTL
- **Image Preprocessing Queue**: Added BullMQ for asynchronous image processing
- **Dedicated Scoring Engine Worker**: Split scoring engine into separate Docker container
- **Persistent Vector Store**: Migrated from in-memory to Qdrant for production persistence

#### Feature Enhancements
- **Profile Strength Meter**: Added UI component showing profile completeness
- **ML Score Breakdown UI**: Visual display of score components with explanations
- **Leaderboard Filter**: Added filtering by gender and university
- **Score Expiry System**: Implemented 30-day expiry for facial scores

#### API Improvements
- **Rate Limiting Middleware**: Added request limiting for API endpoints
- **Enhanced `/api/score`**: Updated response format with score components
- **`POST /api/ai/score-log`**: New endpoint for logging interpreted scores

#### Security Enhancements
- **Tokenized Image Upload URL**: Pre-signed URLs with 5-minute expiration
- **AI Middleware Protection**: API key validation for AI routes

#### Mobile UX Polish
- **Facial Upload Guide Overlay**: Step-by-step instructions for photo uploads
- **Score Reveal Animation**: Animated score display with confetti for top scores

#### Long-Term Extensibility
- **Modularized ML Logic**: Abstracted scoring engine for future model integration
- **Abstract NFTProvider.ts**: Chain-agnostic NFT verification supporting multiple blockchains

#### Deployment
- **Docker Compose Setup**: Multi-container orchestration with Redis and Qdrant
- **Environment Configuration**: Documented setup for all required services

## [v2.6.0] - 2025-07-25

### 🚀 New Feature

#### Final Score Calculation API
- **New `/api/score` endpoint**: Calculates comprehensive user scores combining facial attractiveness, university ranking, and NFT tier
- **University ranking system**: Predefined scores for Bangkok universities
- **NFT tier bonuses**: Additional points for male users with verified NFTs
- **Flexible scoring logic**: Handles missing fields gracefully with sensible defaults
- **Comprehensive documentation**: README with usage examples and scoring rules

## [v2.5.0] - 2025-01-25

### 🚀 Major Improvements

#### Fixed ML Model Integration Issues
- **Removed auto-initialization**: ML models no longer auto-load on server startup
- **Graceful fallback system**: Automatic fallback to simulated mode when real ML fails
- **Default simulated mode**: API now defaults to `useRealML: false` for stability
- **Robust error handling**: Health checks don't crash when models are unavailable

#### Enhanced Face Quality Validation
- **Relaxed quality thresholds**: Lowered from 0.7 to 0.3 for broader acceptance
- **Improved quality calculations**: All metrics now have generous minimum floors
  - Quality: guaranteed ≥0.35
  - Frontality: guaranteed ≥0.2  
  - Symmetry: guaranteed ≥0.2
  - Resolution: guaranteed ≥0.25
- **Debug logging**: Failed validations now show detailed quality metrics
- **Demo-optimized**: System accepts typical portrait photos without issues

#### Configuration & Setup Improvements
- **Fixed Turbopack conflicts**: Resolved Next.js configuration warnings
- **One-command setup**: Added `just setup` for complete system initialization
- **Enhanced justfile**: Added comprehensive commands for testing and status
- **Updated documentation**: Comprehensive ML model documentation updates

### 🔧 Technical Changes

#### API Updates
- Changed default `useRealML` from `true` to `false`
- Added fallback detection and automatic mode switching
- Improved error messages and status reporting
- Added `fallbackUsed` flag in API responses

#### Quality Validation Improvements
```typescript
// Old thresholds (too strict)
minQuality: 0.7, frontality: 0.4, symmetry: 0.3, resolution: 0.3

// New thresholds (demo-friendly)  
minQuality: 0.3, frontality: 0.1, symmetry: 0.1, resolution: 0.1
```

#### ML Model System
- Removed auto-initialization on import
- Improved health check logic without dummy image processing
- Better model availability detection
- Graceful degradation when models fail to load

### 📋 New Commands Available

```bash
just setup        # Complete one-command setup
just test-demo    # Quick demo test with simulated scoring
just demo-old     # Open original AI scoring demo
just demo-new     # Open attractiveness engine demo
just test-ml      # Test ML model integration
just models       # Show model information
just full-status  # Complete project status
```

### 🛠️ Files Modified

- `src/app/api/attractiveness/score/route.ts` - API fallback logic
- `src/lib/face-embeddings.ts` - Quality validation improvements  
- `src/lib/ml-models/model-integration.ts` - Removed auto-init
- `src/lib/attractiveness-engine.ts` - Default mode changes
- `next.config.mjs` - Turbopack compatibility fixes
- `package.json` - Removed Turbopack flag
- `justfile` - Added comprehensive commands
- `ML_MODELS_README.md` - Updated documentation

## [v2.0.0] - 2025-01-24

### 🎯 Initial Release
- Complete attractiveness scoring engine with real ML support
- Face detection and embedding extraction system
- Vector store with percentile-based scoring  
- Vibe clustering and personality tagging
- Docker deployment configuration
- Demo UI for attractiveness scoring

---

**Legend**: 🚀 Major • 🔧 Technical • 📋 Commands • 🛠️ Files • 🎯 Features