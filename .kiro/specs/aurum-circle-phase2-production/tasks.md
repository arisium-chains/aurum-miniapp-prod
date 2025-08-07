# Implementation Plan

- [x] 1. Production World ID Integration Setup

  - Install and configure @worldcoin/idkit SDK for production mode
  - Create /api/auth/callback route for World ID proof verification
  - Implement JWT session token generation with 24-hour expiration
  - Create middleware to protect Vault page using verified sessions
  - Write tests for World ID production integration flow
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Docker Infrastructure Foundation
- [x] 2.1 Frontend Container Configuration

  - Create optimized Dockerfile for Next.js with static output
  - Configure next.config.ts for standalone output mode
  - Set up multi-stage build for production optimization
  - Add health check endpoint for container monitoring
  - _Requirements: 2.1, 2.4_

- [x] 2.2 Scoring Service Container Setup

  - Create separate Dockerfile for Node.js scoring microservice
  - Implement scoring service with Express.js framework
  - Add health check and status endpoints for monitoring
  - Configure container networking and port exposure
  - _Requirements: 2.2, 2.4_

- [x] 2.3 Docker Compose Orchestration

  - Create docker-compose.yml for local and production deployment
  - Configure service networking and container dependencies
  - Set up volume mapping for persistent data and logs
  - Add Redis container configuration with persistence
  - Include optional NGINX reverse proxy configuration
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 3. Mock Scoring System Implementation
- [x] 3.1 Random Score Generation Service

  - Modify /api/score endpoint to generate random scores (55-95)
  - Implement deterministic random algorithm based on user + image hash
  - Create realistic score breakdown with component scores
  - Add processing delay simulation for authentic user experience
  - _Requirements: 3.1, 3.4_

- [x] 3.2 Score Storage and Prevention Logic

  - Implement score storage per user session in R2
  - Create re-scoring prevention logic for same session
  - Add score retrieval functionality for existing users
  - Build score history tracking and management
  - _Requirements: 3.2, 3.3, 3.5_

- [x] 4. BaZi and Mystic Tag System
- [x] 4.1 Birth Data Collection Interface

  - Add birthdate and time input fields to profile creation
  - Create timezone selection component for accurate calculations
  - Implement form validation for birth data requirements
  - Add privacy notice for birth data collection
  - _Requirements: 4.1_

- [x] 4.2 Mystic Tag Generation Algorithm

  - Create deterministic BaZi tag generation using birth data hash
  - Implement mystic tags (Phoenix, Tiger, Lotus, Dragon, etc.)
  - Build element calculation system (Fire, Earth, Metal, Water, Wood)
  - Add compatibility matrix for tag-based matching bias
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 4.3 Tag Display and Integration

  - Display mystic tags in profile and Vault interfaces
  - Integrate tag compatibility into match display logic
  - Add tag-based filtering and sorting options
  - Store tag data in user profiles with proper schema
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 5. Database Integration and Profile Storage
- [x] 5.1 User Profile Database Schema

  - Design and implement user profile database schema
  - Add BaZi data storage with proper indexing
  - Create user session management in database
  - Implement profile retrieval and update operations
  - _Requirements: 4.5, 8.4_

- [x] 5.2 Profile Storage Integration

  - Replace mock profile data with database operations
  - Integrate BaZi profile storage in /api/profile/create
  - Update /api/profile/bazi to store and retrieve from database
  - Add profile completion tracking and validation
  - _Requirements: 4.5, 8.4_

- [ ] 6. PWA and Push Notification System
- [ ] 6.1 Progressive Web App Configuration

  - Install and configure next-pwa package
  - Create manifest.json with proper PWA metadata
  - Implement service worker for offline functionality
  - Add PWA installation prompts and UI
  - _Requirements: 5.1, 5.2_

- [ ] 6.2 Push Notification Infrastructure

  - Set up web-push backend service for notifications
  - Create notification subscription management system
  - Implement VAPID key configuration and security
  - Store notification subscriptions in Redis or R2
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 6.3 Match Notification System

  - Create "Match Found" notification trigger system
  - Implement notification toggle UI component
  - Add notification permission request flow
  - Build notification delivery and retry logic
  - Write tests for notification system functionality
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 7. CI/CD Pipeline Implementation
- [ ] 7.1 GitHub Actions Workflow Setup

  - Create lint, build, and test workflow for all pushes
  - Implement Docker image building and registry push
  - Add secret injection from GitHub Actions environment
  - Configure workflow triggers for main branch and PRs
  - _Requirements: 6.1, 6.2_

- [ ] 7.2 Preview and Staging Deployment

  - Create preview deployment workflow for PR branches
  - Implement staging auto-deployment on main branch push
  - Add deployment status reporting to GitHub PRs
  - Configure environment-specific docker-compose files
  - _Requirements: 6.3, 6.4_

- [ ] 7.3 Monitoring and Health Checks

  - Add logging configuration for all containers
  - Implement health check endpoints for each service
  - Create monitoring dashboard for deployment status
  - Add error alerting and notification system
  - _Requirements: 6.5_

- [ ] 8. Enhanced Score UI and Feedback System
- [ ] 8.1 Score Details Modal Implementation

  - Create "View Score Details" modal component
  - Display randomized breakdown (symmetry, vibe, mystique)
  - Add score visualization with progress bars and animations
  - Include percentile ranking display
  - _Requirements: 7.1, 7.2_

- [ ] 8.2 Score Feedback and Re-upload Logic

  - Implement low score feedback UI (< 65 threshold)
  - Add "Try a different photo" suggestion system
  - Create one-time re-upload functionality per user
  - Include mythic animal tag display with scores
  - Write tests for score feedback and re-upload logic
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 8. Security and Rate Limiting Implementation
- [x] 8.1 API Rate Limiting System

  - Implement rate limiting for /api/score endpoint
  - Add rate limiting for /api/match/send endpoint
  - Create rate limiting for /api/invite/use endpoint
  - Configure Redis-based rate limiting with sliding windows
  - _Requirements: 8.1_

- [x] 8.2 JWT Security and Session Management

  - Ensure all JWTs expire within 24 hours
  - Implement JWT refresh mechanism via World ID
  - Add secure session cookie configuration
  - Create session cleanup and garbage collection
  - _Requirements: 8.2_

- [x] 8.3 Security Headers and CSRF Protection

  - Add CSRF protection middleware for all forms
  - Implement secure headers (HSTS, CSP, X-Frame-Options)
  - Configure CORS policies for API endpoints
  - Add input validation and sanitization
  - _Requirements: 8.3_

- [x] 8.4 Storage Security and Access Control

  - Harden R2 access to specific folder paths only
  - Implement user-specific storage isolation
  - Add access logging for all storage operations
  - Create storage quota and abuse prevention
  - _Requirements: 8.4_

- [x] 8.5 Authentication Gate Enforcement

  - Prevent Vault access without World ID verification
  - Block features without NFT verification when required
  - Add comprehensive access control middleware
  - Create audit logging for authentication events
  - _Requirements: 8.5_

- [x] 9. Environment Configuration Management
- [x] 9.1 Environment Variables Setup

  - Create comprehensive .env.example file
  - Document all required environment variables
  - Add validation for critical environment variables
  - Implement environment-specific configuration loading
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9.2 Configuration Validation and Security

  - Add runtime validation for all environment variables
  - Implement secure secret management practices
  - Create configuration health checks
  - Add environment variable documentation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Production Monitoring and Observability
- [x] 10.1 Health Check System Implementation

  - Create health check endpoints for all containers
  - Implement dependency health checking (Redis, R2)
  - Add service status monitoring and reporting
  - Create health check aggregation dashboard
  - _Requirements: 10.1, 10.3_

- [x] 10.2 Logging and Error Tracking

  - Implement structured logging across all services
  - Add error tracking and correlation IDs
  - Create log aggregation and search functionality
  - Add performance metrics collection
  - _Requirements: 10.2, 10.4_

- [x] 10.3 Performance Monitoring and Scaling

  - Add response time and resource usage tracking
  - Implement auto-scaling metrics collection
  - Create performance alerting thresholds
  - Add audit logging for all critical operations
  - _Requirements: 10.4, 10.5_

- [x] 11. Integration Testing and Quality Assurance
- [x] 11.1 Docker Integration Tests

  - Write tests for Docker container startup and health
  - Create integration tests for service communication
  - Add tests for environment variable configuration
  - Implement container networking and volume tests
  - _Requirements: All requirements validation_

- [x] 11.2 End-to-End Production Flow Tests

  - Create tests for complete user authentication flow
  - Add tests for mock scoring system functionality
  - Implement tests for PWA and notification features
  - Write tests for CI/CD pipeline and deployment
  - _Requirements: All requirements validation_

- [x] 12. Documentation and Deployment Preparation
- [x] 12.1 Production Deployment Documentation

  - Create deployment guide for production environment
  - Document environment variable configuration
  - Add troubleshooting guide for common issues
  - Create monitoring and maintenance procedures
  - _Requirements: All requirements documentation_

- [x] 12.2 Security and Performance Optimization
  - Conduct security audit of all implemented features
  - Optimize Docker images for production deployment
  - Add final performance tuning and optimization
  - Create backup and disaster recovery procedures
  - _Requirements: All requirements final validation_
