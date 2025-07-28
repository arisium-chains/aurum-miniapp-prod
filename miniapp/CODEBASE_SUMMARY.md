# Aurum Circle Miniapp - Complete Codebase Summary

## Project Overview

Aurum Circle is an exclusive dating miniapp with a secret society theme, targeted at Bangkok university students. It features World ID verification, NFT access gating, and an AI-powered attractiveness scoring engine.

## Core Technologies

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: World ID Miniapp SDK
- **Blockchain**: Viem + Wagmi for Ethereum interactions
- **State Management**: Zustand + React Context
- **ML Engine**: TensorFlow.js + MediaPipe + ArcFace (with simulation fallback)
- **Database**: In-memory vector store for face embeddings
- **Deployment**: Fly.io with Docker containers

## Key Features

### 1. Authentication & Access Control
- World ID verification (proof of humanity)
- Wallet connection and signature verification
- NFT gating system (exclusive to Bangkok university students)
- Session management with JWT tokens

### 2. Profile Management
- Onboarding flow with profile creation
- Image upload with automatic blurring for privacy
- Vibe selection (Wicked, Royal, Mystic)
- Tag-based interest system

### 3. Discovery & Matching
- Profile browsing with filtering options
- Secret signals system (mutual interest required for matching)
- Swipe-based interaction model
- Match notifications

### 4. Invite System
- Limited invite codes per user (3 max)
- Invite expiration (30 days)
- Viral growth mechanics (successful invites grant additional codes)

### 5. Attractiveness Scoring Engine
- Facial analysis using ML models (TensorFlow.js + MediaPipe)
- Percentile-based scoring system
- Vibe clustering and personality tagging
- Leaderboard rankings
- Real ML and simulated modes for development/testing

### 6. Final Score Calculation API
- Combines facial attractiveness, university ranking, and NFT tier (for males)
- University scoring system with predefined rankings for Bangkok universities
- NFT tier bonuses for male users (none, basic, rare, elite, legendary)
- Exposed as REST API endpoint at `POST /api/score`

## API Endpoints

### Authentication
```
POST   /api/auth/worldid              # World ID verification
POST   /api/auth/wallet               # Wallet signature verification  
GET    /api/auth/session              # Get current session
DELETE /api/auth/logout               # Logout and invalidate tokens
```

### User Management
```
GET    /api/users/me                  # Current user profile
PUT    /api/users/me                  # Update profile
POST   /api/users/me/upload           # Upload profile image
GET    /api/users/:id                 # Get user by ID (limited data)
DELETE /api/users/me                  # Delete account
```

### NFT & Access Control
```
GET    /api/nft/verify/:address       # Check NFT ownership
GET    /api/access/gate               # Check user access level
```

### Discovery & Matching
```
GET    /api/discovery/profiles        # Get potential matches (paginated)
POST   /api/signals                   # Send interest signal
GET    /api/signals/received          # Get received signals
GET    /api/matches                   # Get current matches
DELETE /api/matches/:id               # Unmatch
```

### Invite System
```
GET    /api/invites/me                # My invite codes
POST   /api/invites                   # Generate new invite
GET    /api/invites/:code             # Validate invite code
POST   /api/invites/:code/claim       # Claim invite code
GET    /api/invites/claims            # Who claimed my invites
```

### Scoring System
```
POST   /api/attractiveness/score      # Calculate facial attractiveness score
GET    /api/attractiveness/score      # Get existing facial score
POST   /api/score                     # Calculate final score (facial + university + NFT)
GET    /api/attractiveness/leaderboard # Get attractiveness leaderboard
GET    /api/attractiveness/similar    # Find similar users
GET    /api/attractiveness/stats      # Get system statistics
GET    /api/attractiveness/ml-status  # Check ML model status
```

### AI Services
```
POST   /api/ai/score                  # AI interpretation of scores
POST   /api/ai/score-interpreter      # Interpret attractiveness score with AI
```

## ML Model Integration

The app uses a hybrid approach with real ML models and simulated fallbacks:

1. **Real ML Mode**:
   - Face detection using MediaPipe
   - Face embedding extraction with ArcFace
   - Quality validation based on frontality, symmetry, and resolution

2. **Simulated Mode**:
   - Fallback system when real models are unavailable
   - Useful for development and testing
   - Defaults to simulated mode for stability

## Data Models

### User
```typescript
interface User {
  id: string
  worldId: string
  walletAddress: string
  handle: string
  displayName: string
  bio?: string
  profileImage: string
  blurredImage: string
  vibe: 'Wicked' | 'Royal' | 'Mystic'
  tags: string[]
  nftVerified: boolean
  lastSeen: Date
  createdAt: Date
  status: 'active' | 'suspended' | 'deleted'
}
```

### Match
```typescript
interface Match {
  id: string
  user1Id: string
  user2Id: string
  matchedAt: Date
  conversationId?: string
  status: 'pending' | 'matched' | 'unmatched'
}
```

### Signal
```typescript
interface Signal {
  id: string
  fromUserId: string
  toUserId: string
  type: 'interest' | 'super_interest' | 'pass'
  message?: string
  sentAt: Date
}
```

### Invite
```typescript
interface Invite {
  id: string
  code: string
  createdBy: string
  claimedBy?: string
  claimedAt?: Date
  expiresAt: Date
  maxUses: number
  currentUses: number
  status: 'active' | 'expired' | 'exhausted'
}
```

## Scoring System Details

### Attractiveness Scoring Engine
- Processes face images and assigns percentile-based scores (0-100)
- Uses vector similarity matching against existing user base
- Generates vibe tags based on facial characteristics
- Includes confidence metrics based on face quality and dataset size

### Final Score Calculation
- Combines three components:
  1. Facial Attractiveness Score (0-100)
  2. University Ranking Score (0, 5, 10, or 20 points)
  3. NFT Tier Bonus (0, 3, 5, 10, or 15 points for males only)
- University Rankings:
  - Top tier (20 points): Chulalongkorn University, Mahidol International College, Thammasat Rangsit, Siriraj Hospital (Mahidol)
  - Mid tier (10 points): Kasetsart University, KMUTT, Srinakharinwirot University, Silpakorn University, TU Tha Prachan
  - Lower tier (5 points): Bangkok University, Rangsit University, Sripatum University, Assumption University (ABAC)
- NFT Tier Bonuses (for male users):
  - None: 0 points
  - Basic: 3 points
  - Rare: 5 points
  - Elite: 10 points
  - Legendary: 15 points

## Development Status

### ✅ Complete
- World ID Miniapp SDK integration
- Complete authentication flow
- Profile onboarding system
- Dark academia UI design
- Session management
- AI Attractiveness Scoring Engine (v2.5)
- ML Model Integration (Real + Simulated modes)
- Face Quality Validation (Demo-optimized)
- Vector-based Similarity Matching
- Percentile Ranking System
- Final Score Calculation API (facial + university + NFT)

### 🔄 Next Steps
- Deploy ML models to production
- Real blockchain NFT verification
- Discovery/matching system integration
- Secret signals feature
- Real-time user matching with ML scores

## Deployment & DevOps

- Docker containerization for easy deployment
- Fly.io deployment configuration
- Automated setup scripts with Justfile
- Health checks for ML models
- Environment-specific configurations (.env files)

## Testing

- Unit tests for scoring functions
- API endpoint tests
- Integration tests with mock blockchain
- Example scripts for demonstrating functionality

## Documentation

- Comprehensive README with setup instructions
- Architecture documentation
- API documentation
- ML model setup guide
- World ID configuration guide
- Development setup guide
- Changelog with version history