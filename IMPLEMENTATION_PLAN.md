# Aurum Circle - Enhanced Implementation Plan

## Overview

This plan outlines the integration of missing features into the existing Aurum Circle architecture, focusing on adding the core functionality outlined in the fresh MVP requirements while leveraging the already-implemented authentication, ML scoring, and basic UI components.

## Architecture Overview

### Current Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Redis Cache   │    │   Qdrant Vector │
│   (Port 3000)   │◄──►│   (Port 6379)   │    │   Store         │
│                 │    │                 │    │   (Port 6333)   │
│ - Auth Flow     │    │ - Session Cache │    │ - Face Embeds   │
│ - ML Scoring    │    │ - Score Cache   │    │ - Similarity    │
│ - Basic UI      │    │ - Rate Limiting │    │   Matching      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ World ID API    │    │ ML Face Scoring │    │ Rust ML Services│
│ (External)      │    │ API (Port 3001) │    │ (Planned)       │
│                 │    │                 │    │                 │
│ - Verification  │    │ - Face Detection│    │ - Face Detection│
│ - MiniKit SDK   │    │ - Embedding Ext │    │ - High Perf     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Enhanced Architecture (After Implementation)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Redis Cache   │    │   Qdrant Vector │
│   (Port 3000)   │◄──►│   (Port 6379)   │    │   Store         │
│                 │    │                 │    │   (Port 6333)   │
│ - Auth Flow     │    │ - Session Cache │    │ - Face Embeds   │
│ - ML Scoring    │    │ - Score Cache   │    │ - Similarity    │
│ - Profile Mgmt  │    │ - Rate Limiting │    │   Matching      │
│ - Invite System │    │ - Signal Cache  │    │                 │
│ - Secret Signals│    │ - Event Cache   │    │                 │
│ - Event Tickets │    │                 │    │                 │
│ - Vault Dashboard│   │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ World ID API    │    │ ML Face Scoring │    │ Rust ML Services│
│ (External)      │    │ API (Port 3001) │    │ (Planned)       │
│                 │    │                 │    │                 │
│ - Verification  │    │ - Face Detection│    │ - Face Detection│
│ - MiniKit SDK   │    │ - Embedding Ext │    │ - High Perf     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Cloudflare R2   │    │ BullMQ Queue    │    │ Blockchain API  │
│ Storage         │    │ System          │    │ (External)      │
│                 │    │                 │    │                 │
│ - User Profiles │    │ - ML Processing │    │ - NFT Verification│
│ - Invite Codes  │    │ - Signal Jobs   │    │ - Ticket Minting │
│ - Event Data    │    │ - Email Jobs    │    │ - Wallet Connect│
│ - Signal Logs   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Priority: HIGH** - Foundation for all other features

#### 1.1 Cloudflare R2 Storage Integration

- **Objective**: Replace in-memory storage with persistent R2 storage
- **Technical Approach**:
  ```typescript
  // New R2 client implementation
  class R2StorageService {
    private client: S3Client;
    private bucket: string;

    async storeUserProfile(userId: string, profile: UserProfile): Promise<void>;
    async getUserProfile(userId: string): Promise<UserProfile | null>;
    async storeInviteCode(code: string, data: InviteData): Promise<void>;
    async getInviteCode(code: string): Promise<InviteData | null>;
  }
  ```
- **Files to Create**:
  - `src/lib/storage/r2-client.ts`
  - `src/lib/storage/user-profile-storage.ts`
  - `src/lib/storage/invite-storage.ts`
  - `src/lib/storage/signal-storage.ts`
  - `src/lib/storage/event-storage.ts`

#### 1.2 Enhanced Profile Management System

- **Objective**: Complete profile onboarding and management
- **Technical Approach**:
  ```typescript
  // Enhanced profile schema
  interface UserProfile {
    id: string;
    worldId: string;
    walletAddress: string;
    vibeTags: string[];
    profileImage: string;
    bio: string;
    university?: string;
    graduationYear?: number;
    isProfileComplete: boolean;
    lastUpdatedAt: Date;
    verificationBadges: {
      worldId: boolean;
      nft: boolean;
      score: boolean;
    };
  }
  ```
- **Files to Create**:
  - `src/lib/types/profile.ts`
  - `src/components/profile/profile-setup.tsx`
  - `src/components/profile/profile-editor.tsx`
  - `src/components/profile/badge-display.tsx`
  - `src/app/api/profile/route.ts`

### Phase 2: Social Features (Week 3-4)

**Priority: HIGH** - Core user interaction features

#### 2.1 Invite System Implementation

- **Objective**: Create invite-only access system
- **Technical Approach**:
  ```typescript
  // Invite system logic
  class InviteService {
    generateInviteCode(userId: string): string;
    validateInviteCode(code: string): Promise<InviteData>;
    markInviteAsUsed(code: string, userId: string): Promise<void>;
    getUserInviteCodes(userId: string): Promise<InviteCode[]>;
    createQRCode(code: string): string;
  }
  ```
- **Files to Create**:
  - `src/lib/invite/invite-service.ts`
  - `src/components/invite/invite-dashboard.tsx`
  - `src/components/invite/qr-code-generator.tsx`
  - `src/app/api/invites/route.ts`
  - `src/app/api/invites/[code]/route.ts`

#### 2.2 Secret Signal Matching System

- **Objective**: Implement anonymous matching system
- **Technical Approach**:
  ```typescript
  // Signal matching logic
  class SignalService {
    sendSignal(fromUserId: string, toUserId: string): Promise<void>;
    checkMutualSignal(userId1: string, userId2: string): Promise<boolean>;
    getUnlockedProfiles(userId: string): Promise<Profile[]>;
    unlockProfile(userId1: string, userId2: string): Promise<void>;
  }
  ```
- **Files to Create**:
  - `src/lib/signals/signal-service.ts`
  - `src/components/signals/signal-button.tsx`
  - `src/components/signals/mutual-match-notification.tsx`
  - `src/app/api/signals/route.ts`
  - `src/app/api/signals/send/route.ts`

### Phase 3: Discovery and Events (Week 5-6)

**Priority: MEDIUM** - Enhanced user experience

#### 3.1 Enhanced Vault Dashboard

- **Objective**: Create profile discovery interface
- **Technical Approach**:
  ```typescript
  // Discovery logic
  class DiscoveryService {
    getAvailableProfiles(userId: string): Promise<Profile[]>;
    filterProfiles(userId: string, filters: ProfileFilters): Promise<Profile[]>;
    getRecommendedProfiles(userId: string): Promise<Profile[]>;
    refreshProfiles(): Promise<void>;
  }
  ```
- **Files to Create**:
  - `src/lib/discovery/discovery-service.ts`
  - `src/components/discovery/profile-card.tsx`
  - `src/components/discovery/profile-filters.tsx`
  - `src/components/discovery/empty-state.tsx`
  - `src/app/discover/page.tsx` (enhanced)

#### 3.2 Event Ticket NFT System

- **Objective**: Implement event ticketing
- **Technical Approach**:
  ```typescript
  // Event system logic
  class EventService {
    getCurrentEvent(): Promise<Event | null>;
    mintTicket(userId: string, eventId: string): Promise<Ticket>;
    getUserTickets(userId: string): Promise<Ticket[]>;
    checkTicketValidity(ticketId: string): Promise<boolean>;
    processRefund(ticketId: string): Promise<void>;
  }
  ```
- **Files to Create**:
  - `src/lib/events/event-service.ts`
  - `src/components/events/event-display.tsx`
  - `src/components/events/ticket-minter.tsx`
  - `src/components/events/ticket-display.tsx`
  - `src/app/api/events/route.ts`

### Phase 4: Enhanced Features (Week 7-8)

**Priority: MEDIUM** - Advanced functionality

#### 4.1 Enhanced AI Scoring Features

- **Objective**: Improve scoring system with detailed analytics
- **Technical Approach**:
  ```typescript
  // Enhanced scoring logic
  class ScoringService {
    getScoreBreakdown(userId: string): Promise<ScoreBreakdown>;
    getPercentileRanking(userId: string): Promise<number>;
    getLeaderboard(filters: LeaderboardFilters): Promise<UserScore[]>;
    getScoreHistory(userId: string): Promise<ScoreHistory[]>;
  }
  ```
- **Files to Create**:
  - `src/lib/scoring/scoring-analytics.ts`
  - `src/components/scoring/score-breakdown.tsx`
  - `src/components/scoring/leaderboard.tsx`
  - `src/components/scoring/score-history.tsx`

#### 4.2 API Routes and Middleware Enhancements

- **Objective**: Complete API coverage for new features
- **Files to Create**:
  - `src/app/api/storage/route.ts`
  - `src/app/api/storage/[key]/route.ts`
  - `src/app/api/profiles/route.ts`
  - `src/app/api/profiles/[userId]/route.ts`
  - `src/middleware/rate-limit.ts`

### Phase 5: Testing and Optimization (Week 9-10)

**Priority: LOW** - Quality and performance

#### 5.1 Comprehensive Testing

- **Objective**: Ensure all features work correctly
- **Files to Create**:
  - `tests/invite-system.test.ts`
  - `tests/signal-matching.test.ts`
  - `tests/profile-management.test.ts`
  - `tests/event-system.test.ts`
  - `tests/storage.test.ts`

#### 5.2 Performance Optimization

- **Objective**: Optimize bundle size and loading times
- **Tasks**:
  - Image optimization with Next.js Image component
  - Lazy loading for heavy components
  - Code splitting for API routes
  - Error boundaries and fallbacks

## Technical Specifications

### Data Models

#### User Profile

```typescript
interface UserProfile {
  id: string;
  worldId: string;
  walletAddress: string;
  vibeTags: string[];
  profileImage: string;
  bio: string;
  university?: string;
  graduationYear?: number;
  isProfileComplete: boolean;
  lastUpdatedAt: Date;
  verificationBadges: {
    worldId: boolean;
    nft: boolean;
    score: boolean;
  };
  score?: UserScore;
}
```

#### Invite System

```typescript
interface InviteCode {
  code: string;
  userId: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}
```

#### Signal System

```typescript
interface Signal {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Date;
  isMutual: boolean;
}
```

#### Event System

```typescript
interface Event {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  ticketPrice: number;
  maxTickets: number;
  currentTickets: number;
}

interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  tokenId: string;
  mintedAt: Date;
  expiresAt: Date;
  isValid: boolean;
}
```

### API Endpoints

#### Profile Management

- `GET /api/profiles` - Get user profiles
- `POST /api/profiles` - Create user profile
- `PUT /api/profiles/[userId]` - Update user profile
- `GET /api/profiles/[userId]` - Get specific profile

#### Invite System

- `GET /api/invites` - Get user's invite codes
- `POST /api/invites` - Generate new invite code
- `DELETE /api/invites/[code]` - Revoke invite code
- `POST /api/invites/[code]/redeem` - Redeem invite code

#### Signal System

- `POST /api/signals/send` - Send secret signal
- `GET /api/signals/received` - Get received signals
- `GET /api/signals/sent` - Get sent signals
- `GET /api/signals/mutual` - Get mutual matches

#### Event System

- `GET /api/events` - Get current events
- `POST /api/events/[eventId]/tickets` - Mint event ticket
- `GET /api/events/[eventId]/tickets` - Get user tickets
- `POST /api/events/[eventId]/tickets/[ticketId]/refund` - Process refund

#### Storage System

- `GET /api/storage/[key]` - Get stored data
- `PUT /api/storage/[key]` - Store data
- `DELETE /api/storage/[key]` - Delete data

### Environment Variables

#### Cloudflare R2

```env
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=aurum-circle-storage
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.dev
```

#### Invite System

```env
INVITE_CODE_LENGTH=8
INVITE_CODE_EXPIRY_DAYS=30
MAX_INVITE_CODES_PER_USER=3
```

#### Event System

```env
EVENT_TICKET_PRICE=0.01
EVENT_MAX_TICKETS=100
EVENT_DURATION_DAYS=7
```

## Implementation Timeline

### Week 1-2: Core Infrastructure

- [ ] Cloudflare R2 storage integration
- [ ] Enhanced profile management system
- [ ] Basic API endpoints for storage and profiles

### Week 3-4: Social Features

- [ ] Invite system implementation
- [ ] Secret signal matching system
- [ ] UI components for social features

### Week 5-6: Discovery and Events

- [ ] Enhanced vault dashboard
- [ ] Event ticket NFT system
- [ ] Discovery and filtering algorithms

### Week 7-8: Enhanced Features

- [ ] Enhanced AI scoring features
- [ ] Complete API coverage
- [ ] Advanced UI components

### Week 9-10: Testing and Optimization

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation and deployment

## Success Metrics

### Technical Metrics

- API response time < 200ms for cached data
- Bundle size < 1MB after optimization
- Test coverage > 80%
- Error rate < 0.1%

### User Experience Metrics

- Profile completion rate > 90%
- Invite system usage > 70% of active users
- Signal matching success rate > 60%
- Event ticket sales > 50% of capacity

### Business Metrics

- User retention > 80%
- Daily active users > 1000
- Invite conversion rate > 30%
- Event participation rate > 40%

## Risk Assessment

### Technical Risks

1. **Cloudflare R2 Integration**: May have latency issues
   - Mitigation: Implement caching layer and fallback mechanisms
2. **Signal Matching Performance**: May not scale well
   - Mitigation: Implement efficient indexing and caching
3. **Image Processing**: May impact performance
   - Mitigation: Use Next.js Image component and CDN

### Business Risks

1. **User Adoption**: New features may not be adopted
   - Mitigation: Clear onboarding and incentives
2. **Invite System Abuse**: May be exploited for spam
   - Mitigation: Rate limiting and verification requirements
3. **Event Ticket Sales**: May not meet targets
   - Mitigation: Marketing and exclusive content

## Conclusion

This implementation plan provides a comprehensive approach to integrating the missing features into the existing Aurum Circle architecture. By focusing on high-priority features first and following a phased approach, we can deliver a complete, production-ready platform that meets all the requirements outlined in the fresh MVP specification.

The plan leverages the existing authentication, ML scoring, and basic UI components while adding the core social features that make Aurum Circle a unique dating platform. The architecture is designed to be scalable, maintainable, and performant, ensuring the platform can grow to meet future demands.
