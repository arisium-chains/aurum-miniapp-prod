# Requirements Document

## Introduction

The Aurum Circle Miniapp is an exclusive dating platform designed as a World ID miniapp with NFT-gated access and AI-powered attractiveness scoring. The platform creates a secret society experience for verified users, featuring matchmaking through "secret signals," invite-only access, and event-based NFT drops. The system emphasizes exclusivity, mystique, and high-quality user interactions through multiple verification layers and sophisticated scoring mechanisms.

## Requirements

### Requirement 1: World ID Authentication System

**User Story:** As a user, I want to verify my identity through World ID so that I can access the exclusive platform with anti-bot protection.

#### Acceptance Criteria

1. WHEN a user visits the splash page THEN the system SHALL display a gold shimmer interface with World ID verification CTA
2. WHEN a user clicks the verification CTA THEN the system SHALL initiate World ID SDK verification flow
3. WHEN World ID verification is successful THEN the system SHALL create a signed session and proceed to NFT gate check
4. IF World ID verification fails THEN the system SHALL display an error message and prevent platform access
5. WHEN a user has an active session THEN the system SHALL maintain authentication state across app navigation

### Requirement 2: NFT Access Gate System

**User Story:** As a platform owner, I want to restrict access to NFT holders only so that the platform maintains exclusivity and proper user qualification.

#### Acceptance Criteria

1. WHEN a user completes World ID verification THEN the system SHALL check their wallet for required NFT ownership
2. IF the user owns the required NFT THEN the system SHALL grant vault access
3. IF the user does not own the required NFT THEN the system SHALL display NFT gate blocking screen with acquisition instructions
4. WHEN NFT verification expires THEN the system SHALL trigger re-verification flow
5. WHEN a user disconnects their wallet THEN the system SHALL revoke access and return to authentication flow

### Requirement 3: AI Attractiveness Scoring System

**User Story:** As a user, I want to receive an attractiveness score based on my photo so that I can understand my profile strength and matching potential.

#### Acceptance Criteria

1. WHEN a user uploads a photo THEN the system SHALL process it through Rust ONNX runtime for facial analysis
2. WHEN image processing is complete THEN the system SHALL generate a single attractiveness score (0-100 scale)
3. IF a user attempts to re-upload for rescoring THEN the system SHALL block the request and display existing score
4. WHEN scoring fails due to poor image quality THEN the system SHALL provide specific feedback for improvement
5. WHEN a score is generated THEN the system SHALL store it permanently and display score breakdown UI

### Requirement 4: Profile Setup and Management

**User Story:** As a user, I want to set up my profile with vibe tags and view my verification badges so that I can present myself authentically on the platform.

#### Acceptance Criteria

1. WHEN a user first accesses the vault THEN the system SHALL guide them through profile setup
2. WHEN setting up profile THEN the system SHALL allow selection of personality vibe tags
3. WHEN profile is complete THEN the system SHALL display NFT verification badge and World ID badge
4. WHEN a user wants to disconnect THEN the system SHALL provide clear logout/disconnect functionality
5. WHEN profile setup is incomplete THEN the system SHALL prevent access to main features

### Requirement 5: Invite System with Code Management

**User Story:** As a user, I want to invite others using shareable codes so that I can bring qualified people into the exclusive platform.

#### Acceptance Criteria

1. WHEN a user accesses invite system THEN the system SHALL display their unique invite code and QR code
2. WHEN generating invite codes THEN the system SHALL limit each user to maximum 3 active codes
3. WHEN someone uses an invite code THEN the system SHALL log the claim with user handle and timestamp
4. WHEN displaying invite interface THEN the system SHALL show claim history and remaining invite slots
5. WHEN an invite code is used THEN the system SHALL update the inviter's claim log in real-time

### Requirement 6: Secret Signal Matching System

**User Story:** As a user, I want to send secret signals to other users and unlock their profiles when mutual interest exists so that I can connect with compatible matches.

#### Acceptance Criteria

1. WHEN a user views blurred profiles in the vault THEN the system SHALL display "secret signal" action button
2. WHEN a user sends a secret signal THEN the system SHALL store the signal and display pulsing sigil animation
3. WHEN mutual signals exist between two users THEN the system SHALL unlock both profiles with shimmer effect
4. WHEN profiles are unlocked THEN the system SHALL reveal full profile information and enable direct interaction
5. WHEN a signal is sent THEN the system SHALL provide visual feedback but maintain recipient anonymity until mutual match

### Requirement 7: Event Ticket NFT System

**User Story:** As a user, I want to mint event tickets as NFTs with expiration dates so that I can participate in exclusive platform events.

#### Acceptance Criteria

1. WHEN a user accesses event ticket section THEN the system SHALL display current event with countdown timer
2. IF no ticket is minted THEN the system SHALL provide mint functionality with clear expiration date
3. WHEN a ticket is successfully minted THEN the system SHALL display ticket details and confirmation
4. WHEN event expires without minting THEN the system SHALL trigger refund fallback mechanism
5. WHEN viewing minted ticket THEN the system SHALL show ticket status, event details, and expiration countdown

### Requirement 8: Vault Dashboard with Profile Discovery

**User Story:** As a user, I want to browse blurred profiles in a private dashboard so that I can discover potential matches while maintaining privacy.

#### Acceptance Criteria

1. WHEN a user enters the vault THEN the system SHALL display horizontally scrollable blurred profile cards
2. WHEN displaying profiles THEN the system SHALL show handles and blurred images with golden glow effects
3. WHEN a user interacts with profiles THEN the system SHALL maintain smooth scrolling and responsive animations
4. WHEN profiles are loaded THEN the system SHALL implement lazy loading for performance optimization
5. WHEN no profiles are available THEN the system SHALL display appropriate empty state messaging

### Requirement 9: Session Management and Security

**User Story:** As a platform owner, I want secure session management with proper authentication state so that user access is properly controlled and protected.

#### Acceptance Criteria

1. WHEN a user authenticates THEN the system SHALL create signed JWT session with World ID proof validation
2. WHEN session expires THEN the system SHALL automatically redirect to authentication flow
3. WHEN detecting suspicious activity THEN the system SHALL invalidate session and require re-authentication
4. WHEN user data is accessed THEN the system SHALL validate session signature to prevent spoofing
5. WHEN user logs out THEN the system SHALL properly clear all session data and authentication state

### Requirement 10: Data Storage with Cloudflare R2

**User Story:** As a platform owner, I want stateless backend storage using Cloudflare R2 so that user data is reliably stored and retrieved without complex database management.

#### Acceptance Criteria

1. WHEN user data needs storage THEN the system SHALL store JSON objects in Cloudflare R2 buckets
2. WHEN retrieving user data THEN the system SHALL fetch and parse JSON objects from R2 storage
3. WHEN data is updated THEN the system SHALL overwrite existing R2 objects with new data
4. WHEN storage operations fail THEN the system SHALL implement proper error handling and retry logic
5. WHEN accessing stored data THEN the system SHALL ensure proper data validation and sanitization
