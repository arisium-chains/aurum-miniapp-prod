# Implementation Plan

- [x] 1. Project Setup and Core Infrastructure

  - Initialize fresh Next.js 15 project with TypeScript and App Router
  - Configure Tailwind CSS with dark academia theme colors (#B3001B, #FFD700, #0c0c0c)
  - Set up environment variables structure for World ID, JWT, and Cloudflare R2
  - Create basic folder structure (components, lib, types, middleware)
  - _Requirements: 1.1, 9.1_

- [x] 2. Authentication System Foundation
- [x] 2.1 World ID SDK Integration

  - Install and configure @worldcoin/minikit-js package
  - Create World ID verification component with proper error handling
  - Implement World ID proof validation on server side
  - Write unit tests for World ID integration
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 JWT Session Management

  - Create JWT token generation and validation utilities using jose library
  - Implement session middleware for API route protection
  - Create session storage and retrieval functions
  - Write tests for session management and token validation
  - _Requirements: 1.5, 9.1, 9.2_

- [x] 2.3 NFT Verification System

  - Implement wallet connection using Viem and Wagmi
  - Create NFT ownership verification logic for multiple chains
  - Build NFT gate component with blocking UI and acquisition instructions
  - Write tests for NFT verification and multi-chain support
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Core UI Components and Theme
- [x] 3.1 Dark Academia Theme Implementation

  - Create Tailwind CSS custom theme with gold shimmer effects
  - Implement particle background component using tsparticles
  - Build animated sigil component with pulsing animations
  - Create reusable card components with golden glow effects
  - _Requirements: 1.1, 6.2, 8.3_

- [x] 3.2 Authentication UI Flow

  - Build splash page with gold shimmer and World ID CTA
  - Create NFT gate blocking screen with clear messaging
  - Implement loading states and error displays for auth flow
  - Add responsive design for mobile-first World App experience
  - _Requirements: 1.1, 2.3, 1.4_

- [x] 4. Cloudflare R2 Storage Integration
- [x] 4.1 R2 Client and Storage Utilities

  - Set up Cloudflare R2 client configuration
  - Create JSON object storage and retrieval functions
  - Implement data validation and sanitization for stored objects
  - Write error handling and retry logic for storage operations
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4.2 User Data Management

  - Create user profile storage schema and CRUD operations
  - Implement session data persistence in R2
  - Build invite code storage and management system
  - Write tests for data storage operations and validation
  - _Requirements: 4.1, 4.2, 5.2, 5.3_

- [x] 5. Profile Setup and Management System
- [x] 5.1 Profile Creation Interface

  - Build profile setup form with vibe tag selection
  - Create image upload component with validation
  - Implement profile completion progress indicator
  - Add NFT and World ID badge display components
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5.2 Profile Management Features

  - Create profile editing interface
  - Implement disconnect/logout functionality with proper cleanup
  - Build profile strength meter component
  - Write tests for profile management operations
  - _Requirements: 4.4, 4.5, 9.5_

- [x] 6. AI Attractiveness Scoring System
- [x] 6.1 Node.js ML Service Implementation

  - Set up TensorFlow.js and ONNX Runtime for Node.js environment
  - Create face detection service using MediaPipe or TensorFlow.js models
  - Implement face embedding extraction with ArcFace/InsightFace models
  - Build job queue system for ML processing requests with BullMQ
  - Add timeout and error handling for ML service calls
  - _Requirements: 3.1, 3.4, 3.5_

- [x] 6.2 Score Processing and Storage

  - Implement score calculation with facial, university, and NFT bonuses
  - Create score storage and retrieval system
  - Build re-upload prevention logic with existing score display
  - Add score breakdown UI component with detailed metrics
  - _Requirements: 3.2, 3.3, 3.5_

- [x] 6.3 Score Display and Analytics

  - Create score reveal animation component
  - Build percentile ranking system
  - Implement leaderboard generation and caching
  - Add score history and analytics dashboard
  - _Requirements: 3.2, 3.5_

- [x] 7. Invite System Implementation
- [x] 7.1 Invite Code Generation and Management

  - Create unique invite code generation algorithm
  - Implement 3-code limit enforcement per user
  - Build invite code storage and validation system
  - Add QR code generation for invite sharing
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 7.2 Invite Redemption and Tracking

  - Create invite code redemption flow
  - Implement claim logging with user handle and timestamp
  - Build invite history display with real-time updates
  - Write tests for invite system edge cases and limits
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 8. Secret Signal Matching System
- [x] 8.1 Signal Sending and Storage

  - Create secret signal sending interface
  - Implement signal storage with user anonymity protection
  - Build pulsing sigil animation for sent signals
  - Add signal status tracking and management
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 8.2 Mutual Match Detection and Unlock

  - Implement mutual signal detection algorithm
  - Create profile unlock mechanism with shimmer effects
  - Build match notification and display system
  - Add unlocked profile interaction features
  - _Requirements: 6.3, 6.4_

- [x] 9. Vault Dashboard and Profile Discovery
- [x] 9.1 Profile Card System

  - Create blurred profile card components
  - Implement horizontal scrolling with smooth animations
  - Build lazy loading for profile images and data
  - Add golden glow effects and hover interactions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9.2 Discovery Feed Logic

  - Implement profile filtering and recommendation algorithm
  - Create empty state handling for no available profiles
  - Build profile refresh and update mechanisms
  - Add performance optimization for large profile sets
  - _Requirements: 8.4, 8.5_

- [x] 10. Event Ticket NFT System
- [x] 10.1 Event Ticket Interface

  - Create event display with countdown timer
  - Build NFT minting interface for event tickets
  - Implement ticket status tracking and display
  - Add expiration handling and visual indicators
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 10.2 Ticket Management and Refund System

  - Implement ticket minting transaction handling
  - Create refund fallback mechanism for expired events
  - Build ticket history and status management
  - Write tests for ticket lifecycle and edge cases
  - _Requirements: 7.3, 7.4_

- [x] 11. Redis Caching Layer
- [x] 11.1 Cache Implementation

  - Set up Redis client configuration
  - Create caching utilities for scores, profiles, and sessions
  - Implement cache invalidation strategies
  - Add cache performance monitoring and metrics
  - _Requirements: 9.1, 10.4_

- [x] 11.2 Rate Limiting and Security

  - Implement rate limiting for API endpoints
  - Create anti-abuse measures for ML scoring
  - Build session validation caching
  - Add security headers and CSRF protection
  - _Requirements: 3.3, 9.3, 9.4_

- [x] 12. API Routes and Middleware
- [x] 12.1 Authentication API Routes

  - Create /api/auth/worldid endpoint for World ID verification
  - Build /api/auth/nft-verify endpoint for NFT gate checking
  - Implement /api/auth/session endpoint for session management
  - Add proper error handling and validation for auth endpoints
  - _Requirements: 1.2, 1.3, 2.1, 2.2_

- [x] 12.2 Core Feature API Routes

  - Create /api/score endpoint for attractiveness scoring
  - Build /api/signals/send endpoint for secret signal sending
  - Implement /api/invites endpoints for invite management
  - Add /api/events endpoints for ticket system
  - _Requirements: 3.1, 6.2, 5.3, 7.2_

- [x] 13. Testing and Quality Assurance
- [x] 13.1 Unit and Integration Tests

  - Write comprehensive tests for authentication flow
  - Create tests for ML processing pipeline
  - Build tests for invite system and edge cases
  - Add tests for storage operations and data validation
  - _Requirements: All requirements validation_

- [x] 13.2 End-to-End Testing

  - Create user journey tests for complete onboarding flow
  - Build matching system end-to-end tests
  - Implement performance tests for concurrent users
  - Add security tests for authentication and data protection
  - _Requirements: All requirements validation_

- [x] 14. Performance Optimization and Polish
- [x] 14.1 Performance Enhancements

  - Optimize image loading and processing performance
  - Implement proper caching strategies for all data
  - Add lazy loading for heavy components
  - Optimize bundle size and loading times
  - _Requirements: 8.4, 10.4_

- [x] 14.2 Final Polish and Deployment Preparation
  - Add comprehensive error boundaries and fallbacks
  - Implement proper loading states for all async operations
  - Create deployment configuration and environment setup
  - Add monitoring and analytics integration
  - _Requirements: All requirements final validation_
