# Aurum Circle Miniapp - Detailed Requirements

## 📋 **Project Overview**

**Project Name**: Aurum Circle Dating Miniapp  
**Type**: Mobile-first PWA with Web3 authentication  
**Target Audience**: Bangkok university students (18-25)  
**Platform**: Next.js 14 web app, PWA-ready  
**Timeline**: 12-16 days development + 4 days testing  

---

## 🎯 **Functional Requirements**

### **FR-1: Authentication System**

#### **FR-1.1: World ID Integration**
- **Priority**: P0 (Critical)
- **Description**: Users must verify humanity via Worldcoin World ID
- **Acceptance Criteria**:
  - [x] Integrate @worldcoin/idkit SDK
  - [x] Handle World ID verification flow
  - [x] Store nullifier hash securely
  - [x] Prevent duplicate accounts
  - [x] Handle verification failures gracefully
- **Implementation**: 
  ```typescript
  // World ID verification component
  import { IDKit, ISuccessResult } from '@worldcoin/idkit'
  
  const onSuccess = (result: ISuccessResult) => {
    // Verify proof server-side
    fetch('/api/auth/worldid', {
      method: 'POST',
      body: JSON.stringify({ ...result })
    })
  }
  ```

#### **FR-1.2: Wallet Connection**
- **Priority**: P0 (Critical)
- **Description**: Connect Web3 wallet for NFT verification
- **Acceptance Criteria**:
  - [x] Support MetaMask, WalletConnect, Coinbase Wallet
  - [x] Request signature for authentication
  - [x] Store wallet address securely
  - [x] Handle wallet disconnection
- **Implementation**: Use Viem + Wagmi for wallet connections

#### **FR-1.3: Session Management**
- **Priority**: P0 (Critical)
- **Description**: Secure session handling with JWT tokens
- **Acceptance Criteria**:
  - [x] JWT tokens with 24h expiry
  - [x] Refresh token rotation
  - [x] Secure httpOnly cookies
  - [x] CSRF protection
  - [x] Session invalidation on logout

### **FR-2: NFT Gating System**

#### **FR-2.1: NFT Ownership Verification**
- **Priority**: P0 (Critical)
- **Description**: Verify user owns required NFT for vault access
- **Acceptance Criteria**:
  - [x] Query Ethereum blockchain for NFT ownership
  - [x] Support multiple NFT contracts
  - [x] Cache results for 24 hours
  - [x] Handle blockchain connection errors
  - [x] Show appropriate error messages
- **NFT Contract**: `0x...` (TBD - specific contract address)
- **Blockchain**: Ethereum Mainnet
- **Backup**: Polygon for lower gas fees (future)

#### **FR-2.2: Access Control**
- **Priority**: P0 (Critical)
- **Description**: Restrict vault access to NFT holders only
- **Acceptance Criteria**:
  - [x] Block non-NFT holders from vault
  - [x] Show "Get a pass" screen for non-holders
  - [x] Re-verify NFT status periodically
  - [x] Handle NFT transfers (loss of access)

### **FR-3: User Profile System**

#### **FR-3.1: Profile Creation**
- **Priority**: P0 (Critical)
- **Description**: Users create profiles with vibe selection
- **Acceptance Criteria**:
  - [x] Upload profile photo (max 5MB, WebP preferred)
  - [x] Set display name and bio (max 500 chars)
  - [x] Select vibe: Wicked, Royal, or Mystic
  - [x] Add interest tags (max 5 tags)
  - [x] Generate unique @handle
- **Validation Rules**:
  - Display name: 2-50 characters
  - Handle: 3-20 characters, alphanumeric + underscore
  - Bio: Optional, max 500 characters
  - Photo: Required, 1:1 aspect ratio preferred

#### **FR-3.2: Profile Privacy**
- **Priority**: P1 (High)
- **Description**: Automatic profile blurring for discovery
- **Acceptance Criteria**:
  - [x] Generate blurred version of profile photos
  - [x] Show blurred photos in discovery feed
  - [x] Reveal clear photo only after mutual match
  - [x] Allow users to control blur intensity

### **FR-4: Discovery & Matching System**

#### **FR-4.1: Profile Discovery**
- **Priority**: P0 (Critical)
- **Description**: Tinder-style profile browsing with filters
- **Acceptance Criteria**:
  - [x] Horizontal swipe/card interface
  - [x] Filter by vibe (All, Friends, Crushes)
  - [x] Infinite scroll with pagination
  - [x] Exclude already signaled profiles
  - [x] Geographic filtering (Bangkok only)
- **Algorithm**: 
  - Prioritize recent activity
  - Boost profiles with mutual tags
  - Penalize inactive users (>7 days)

#### **FR-4.2: Secret Signal System**
- **Priority**: P0 (Critical)
- **Description**: Send interest signals (Tinder's "like" equivalent)
- **Acceptance Criteria**:
  - [x] Send secret signal to user
  - [x] Optional message with signal (max 200 chars)
  - [x] Track signal status (sent, mutual, expired)
  - [x] Rate limiting: 50 signals per day
  - [x] Prevent duplicate signals
- **Signal Types**:
  - Interest: Standard signal
  - Super Interest: Premium signal (3/day limit)
  - Pass: No interest (hidden from both sides)

#### **FR-4.3: Matching Algorithm**
- **Priority**: P0 (Critical)
- **Description**: Create matches when signals are mutual
- **Acceptance Criteria**:
  - [x] Detect mutual signals automatically
  - [x] Create match record in database
  - [x] Notify both users immediately
  - [x] Unlock profile visibility
  - [x] Enable conversation thread
- **Match Expiry**: 7 days if no conversation started

### **FR-5: Invite System**

#### **FR-5.1: Invite Code Generation**
- **Priority**: P1 (High)
- **Description**: Users can generate invite codes for friends
- **Acceptance Criteria**:
  - [x] Generate human-readable codes (AURUM-X123)
  - [x] Each user gets 3 active invites max
  - [x] Codes expire after 30 days
  - [x] Track invite usage and claims
  - [x] Reward successful invites (+1 additional invite)
- **Code Format**: `AURUM-[A-Z0-9]{4}` (e.g., AURUM-X9B4)

#### **FR-5.2: Invite Claiming**
- **Priority**: P1 (High)
- **Description**: New users can claim invite codes
- **Acceptance Criteria**:
  - [x] Validate invite code format
  - [x] Check code expiry and usage limits
  - [x] Link claimed invite to new user
  - [x] Update inviter's statistics
  - [x] Rate limit: 5 claims per hour globally

#### **FR-5.3: Invite Sharing**
- **Priority**: P2 (Medium)
- **Description**: Share invite codes via QR code and social media
- **Acceptance Criteria**:
  - [x] Generate QR code for invite URL
  - [x] Share to Instagram Stories
  - [x] Copy invite link to clipboard
  - [x] Track share events for analytics

---

## 🔧 **Technical Requirements**

### **TR-1: Frontend Architecture**

#### **TR-1.1: Framework & Tooling**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: React Query + Zustand
- **Animation**: Framer Motion
- **Web3**: Viem + Wagmi
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + Testing Library + Playwright

#### **TR-1.2: Performance Requirements**
- **Bundle Size**: <300KB initial, <100KB per route
- **Loading Time**: <2s first contentful paint on 3G
- **Core Web Vitals**: 
  - LCP: <2.5s
  - FID: <100ms
  - CLS: <0.1
- **PWA**: Service worker, offline profile cache

#### **TR-1.3: Mobile Optimization**
- **Responsive**: Mobile-first design, 320px minimum width
- **Touch**: Gesture support for swipe actions
- **Keyboard**: Virtual keyboard handling
- **Accessibility**: WCAG 2.1 AA compliance

### **TR-2: Backend Architecture**

#### **TR-2.1: API Design**
- **Protocol**: REST with JSON
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: Redis-based sliding window
- **Validation**: Zod schemas for all inputs
- **Error Handling**: Structured error responses
- **Documentation**: OpenAPI 3.0 specification

#### **TR-2.2: Database Design**
- **Primary**: Cloudflare D1 (SQLite)
- **File Storage**: Cloudflare R2
- **Cache**: Cloudflare KV Store
- **Search**: Full-text search on profiles
- **Backup**: Daily automated backups

#### **TR-2.3: External Integrations**
- **Blockchain**: Ethereum via Alchemy/Infura
- **World ID**: Worldcoin verification service
- **Image Processing**: Sharp for resizing/blurring
- **Analytics**: Custom event tracking
- **Monitoring**: Error tracking and performance monitoring

---

## 🛡️ **Security Requirements**

### **SR-1: Authentication Security**
- **Password Policy**: N/A (Web3 auth only)
- **Session Security**: 
  - Secure, httpOnly, sameSite cookies
  - 24-hour token expiry
  - Refresh token rotation
- **Brute Force Protection**: Rate limiting on auth endpoints
- **Account Security**: World ID prevents duplicate accounts

### **SR-2: Data Security**
- **Encryption**: AES-256 for sensitive data at rest
- **PII Protection**: Minimal data collection, GDPR compliance
- **Image Security**: NSFW detection on uploads
- **API Security**: CORS, CSRF protection, input sanitization

### **SR-3: Privacy Requirements**
- **Data Minimization**: Collect only necessary data
- **User Control**: Profile deletion, data export
- **Anonymity**: Blurred profiles until mutual match
- **Geographic Privacy**: City-level location only

---

## 🎨 **UI/UX Requirements**

### **UR-1: Design System**
- **Color Palette**:
  - Primary: Dark brown/black (#1C1917)
  - Accent: Crimson red (#DC2626)
  - Gold highlights: (#F59E0B)
- **Typography**: 
  - Headers: Playfair Display
  - Body: Inter
- **Components**: Consistent with Figma designs
- **Dark Mode**: Default and only theme

### **UR-2: User Experience**
- **Onboarding**: <3 minutes from landing to vault
- **Navigation**: Bottom tab bar, intuitive flow
- **Feedback**: Loading states, success/error messages
- **Accessibility**: Screen reader support, keyboard navigation

### **UR-3: Animation & Interaction**
- **Page Transitions**: Smooth 300ms transitions
- **Gesture Support**: Swipe gestures for cards
- **Micro-interactions**: Button hover states, loading spinners
- **Performance**: 60fps animations, optimized for mobile

---

## 📊 **Quality Requirements**

### **QR-1: Performance**
- **Availability**: 99.9% uptime SLA
- **Response Time**: <500ms API response time (95th percentile)
- **Throughput**: Support 1000 concurrent users
- **Scalability**: Horizontal scaling via edge functions

### **QR-2: Reliability**
- **Data Integrity**: Transaction consistency for matches
- **Fault Tolerance**: Graceful degradation of features
- **Recovery**: Automated backup and restore procedures
- **Monitoring**: Real-time alerts for critical failures

### **QR-3: Usability**
- **Learning Curve**: Intuitive UI, no tutorial needed
- **Error Recovery**: Clear error messages with next steps
- **Offline Support**: Basic profile browsing works offline
- **Cross-browser**: Chrome 90+, Safari 14+, Firefox 88+

---

## 🧪 **Testing Requirements**

### **Testing Strategy**
- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Load testing with 500 concurrent users
- **Security Tests**: OWASP Top 10 vulnerability scanning

### **Test Scenarios**
1. **Happy Path**: World ID → NFT Check → Profile Setup → Signal → Match
2. **Error Cases**: No NFT, Invalid invite, Network failures
3. **Edge Cases**: Concurrent signals, Expired sessions, Rate limits
4. **Security**: SQL injection, XSS, CSRF attacks
5. **Performance**: High load, Slow network, Large file uploads

---

## 📈 **Success Metrics**

### **Key Performance Indicators**
- **User Acquisition**: 500 active users in first month
- **Engagement**: 60% daily active users
- **Matching**: 15% signal-to-match conversion rate
- **Retention**: 40% D7, 20% D30 retention
- **Viral Growth**: K-factor of 1.2 (invite system success)

### **Technical Metrics**
- **Performance**: Core Web Vitals in green
- **Reliability**: 99.9% uptime, <1% error rate
- **Security**: Zero critical vulnerabilities
- **Quality**: <10 bugs per 1000 lines of code

---

## 🚀 **Deployment Requirements**

### **Environments**
- **Development**: Local development with mocked services
- **Staging**: Full-featured testing environment
- **Production**: Global edge deployment via Vercel

### **CI/CD Pipeline**
- **Source Control**: Git with feature branch workflow
- **Build**: Automated builds on PR creation
- **Testing**: Automated test suite on every commit
- **Deployment**: Automatic deployment to staging, manual to production
- **Monitoring**: Real-time error tracking and performance monitoring

---

This comprehensive requirements document ensures world-class development standards and provides complete context for continuous development. Ready for implementation! 🎭✨