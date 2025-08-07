# Requirements Document

## Introduction

This document outlines the requirements for Phase 2 of the Aurum Circle miniapp, transitioning from MVP to production-ready system. The focus is on implementing production infrastructure, mock scoring system (replacing real AI models temporarily), enhanced security, and deployment automation while maintaining all hooks for future AI model integration.

## Requirements

### Requirement 1: Production World ID Integration

**User Story:** As a user, I want to authenticate using World ID in a production environment, so that I can access the elite dating platform with verified identity.

#### Acceptance Criteria

1. WHEN a user accesses the app THEN the system SHALL use @worldcoin/idkit SDK in production mode
2. WHEN World ID verification completes THEN the system SHALL create a secure JWT session token
3. WHEN a user accesses protected routes THEN the system SHALL validate the World ID verification status
4. IF verification fails THEN the system SHALL block access to the Vault page
5. WHEN a session expires THEN the system SHALL require re-verification through World ID

### Requirement 2: Dockerized Production Infrastructure

**User Story:** As a DevOps engineer, I want containerized deployment infrastructure, so that the application can be deployed consistently across environments.

#### Acceptance Criteria

1. WHEN deploying the frontend THEN the system SHALL use a Docker container with static Next.js output
2. WHEN deploying the scoring service THEN the system SHALL use a separate Docker container
3. WHEN running locally or in production THEN the system SHALL use docker-compose.yml for orchestration
4. WHEN containers start THEN the system SHALL include health checks for all services
5. WHEN scaling THEN the system SHALL support Redis, NGINX, and database containers
6. WHEN configuring THEN the system SHALL use .env.example for all required environment variables

### Requirement 3: Mock Scoring System

**User Story:** As a user, I want to receive attractiveness scores, so that I can participate in the platform while AI models are being developed.

#### Acceptance Criteria

1. WHEN a user uploads a photo THEN the system SHALL return a random score between 55-95
2. WHEN processing a score request THEN the system SHALL accept Base64 image data via POST
3. WHEN a user has been scored THEN the system SHALL prevent re-scoring for the same session
4. WHEN displaying scores THEN the system SHALL show realistic breakdown components
5. WHEN storing scores THEN the system SHALL persist results in R2 storage per user session

### Requirement 4: BaZi and Mystic Tag Integration

**User Story:** As a user, I want mystical personality tags based on my birth details, so that I can connect with compatible matches through spiritual alignment.

#### Acceptance Criteria

1. WHEN creating a profile THEN the system SHALL collect birthdate and time information
2. WHEN processing birth data THEN the system SHALL generate deterministic BaZi-based tags
3. WHEN displaying profiles THEN the system SHALL show mystic tags like "Phoenix", "Tiger", "Lotus"
4. WHEN matching users THEN the system SHALL apply compatibility bias based on tag combinations
5. WHEN storing profiles THEN the system SHALL persist tag data in user profiles

### Requirement 5: PWA and Match Notifications

**User Story:** As a user, I want push notifications for matches, so that I can be alerted when someone signals interest in me.

#### Acceptance Criteria

1. WHEN accessing the app THEN the system SHALL function as a Progressive Web App
2. WHEN a user enables notifications THEN the system SHALL register a service worker
3. WHEN matches occur THEN the system SHALL send push notifications using web-push
4. WHEN managing subscriptions THEN the system SHALL store notification data in Redis or R2
5. WHEN users interact with settings THEN the system SHALL provide a notification toggle

### Requirement 6: CI/CD Pipeline and Deployment

**User Story:** As a developer, I want automated deployment pipelines, so that code changes can be safely deployed to production.

#### Acceptance Criteria

1. WHEN code is pushed THEN the system SHALL run lint, build, and test processes via GitHub Actions
2. WHEN deploying THEN the system SHALL inject secrets from environment or GitHub dashboard
3. WHEN creating PRs THEN the system SHALL deploy preview environments for testing
4. WHEN pushing to main THEN the system SHALL auto-deploy to staging environment
5. WHEN monitoring THEN the system SHALL provide logging and health check endpoints

### Requirement 7: Enhanced Score UI and Feedback

**User Story:** As a user, I want detailed score breakdowns and feedback, so that I can understand my attractiveness rating and improve if needed.

#### Acceptance Criteria

1. WHEN viewing scores THEN the system SHALL provide a "View Score Details" modal
2. WHEN displaying breakdowns THEN the system SHALL show randomized component scores
3. WHEN scores are low (< 65) THEN the system SHALL suggest photo re-upload
4. WHEN re-uploading THEN the system SHALL allow only one retry per user
5. WHEN available THEN the system SHALL include mythic animal tags with scores

### Requirement 8: Security and Rate Limiting

**User Story:** As a platform administrator, I want comprehensive security measures, so that the application is protected from abuse and attacks.

#### Acceptance Criteria

1. WHEN users make API requests THEN the system SHALL enforce rate limits on scoring, matching, and invite endpoints
2. WHEN managing sessions THEN the system SHALL expire all JWTs within 24 hours
3. WHEN handling requests THEN the system SHALL implement CSRF protection and secure headers
4. WHEN accessing R2 storage THEN the system SHALL restrict access to specific folder paths
5. WHEN users access the Vault THEN the system SHALL verify all authentication gates are passed

### Requirement 9: Environment Configuration Management

**User Story:** As a developer, I want comprehensive environment configuration, so that the application can be deployed across different environments securely.

#### Acceptance Criteria

1. WHEN configuring World ID THEN the system SHALL use NEXT_PUBLIC_WLD_APP_ID and WLD_APP_SECRET
2. WHEN managing sessions THEN the system SHALL use JWT_SECRET for token signing
3. WHEN accessing storage THEN the system SHALL use Cloudflare R2 credentials and bucket configuration
4. WHEN using caching THEN the system SHALL connect to Redis via REDIS_URL
5. WHEN deploying THEN the system SHALL use NEXT_PUBLIC_SITE_URL for proper routing

### Requirement 10: Production Monitoring and Observability

**User Story:** As a system administrator, I want comprehensive monitoring, so that I can ensure system health and performance in production.

#### Acceptance Criteria

1. WHEN services are running THEN the system SHALL provide health check endpoints for all containers
2. WHEN errors occur THEN the system SHALL log detailed error information
3. WHEN monitoring performance THEN the system SHALL track response times and resource usage
4. WHEN scaling THEN the system SHALL provide metrics for auto-scaling decisions
5. WHEN troubleshooting THEN the system SHALL maintain audit logs for all critical operations
