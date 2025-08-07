# Aurum Circle Enhanced Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer (Next.js)"
        A[Next.js App]
        B[World App Browser]
        C[Mobile Devices]

        A --> D[Authentication Flow]
        A --> E[Profile Management]
        A --> F[Vault Dashboard]
        A --> G[Invite System]
        A --> H[Signal Matching]
        A --> I[Event Tickets]
        A --> J[AI Scoring]
    end

    subgraph "API Layer"
        K[API Gateway]

        K --> L[Auth Endpoints]
        K --> M[Profile Endpoints]
        K --> N[Storage Endpoints]
        K --> O[Invite Endpoints]
        K --> P[Signal Endpoints]
        K --> Q[Event Endpoints]
        K --> R[ML Endpoints]
        K --> S[Discovery Endpoints]
    end

    subgraph "Business Logic Layer"
        T[Services]

        T --> U[Profile Service]
        T --> V[Invite Service]
        T --> W[Signal Service]
        T --> X[Event Service]
        T --> Y[Discovery Service]
        T --> Z[Scoring Service]
    end

    subgraph "Data Layer"
        AA[Primary Storage]
        BB[Cache Layer]
        CC[Vector Store]
        DD[Queue System]

        AA --> EE[Cloudflare R2]
        BB --> FF[Redis]
        CC --> GG[Qdrant]
        DD --> HH[BullMQ]
    end

    subgraph "External Services"
        II[World ID API]
        JJ[Blockchain API]
        KK[ML Services]
        LL[CDN]

        II --> AAA[MiniKit SDK]
        JJ --> BBB[Wallet Connect]
        JJ --> CCC[NFT Verification]
        KK --> DDD[Rust ML]
        LL --> EEE[Image CDN]
    end

    %% Connections
    A --> K
    B --> A
    C --> A

    K --> T
    T --> AA
    T --> BB
    T --> CC
    T --> DD

    AA --> II
    AA --> JJ
    BB --> FF
    CC --> GG
    DD --> HH

    AA --> LL
    AA --> KK

    style A fill:#e1f5fe
    style K fill:#f3e5f5
    style T fill:#e8f5e8
    style AA fill:#fff3e0
    style II fill:#fce4ec
```

## Data Flow Architecture

### 1. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant WA as World App
    participant A as Next.js App
    participant WI as World ID API
    participant R as Redis
    participant R2 as Cloudflare R2

    U->>WA: Open App
    WA->>A: Load MiniKit
    A->>WI: Verify World ID
    WI-->>A: Proof Response
    A->>R: Store Session
    A->>R2: Store User Profile
    A-->>U: Access Granted
```

### 2. Profile Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Next.js App
    participant T as Profile Service
    participant R2 as Cloudflare R2
    participant R as Redis

    U->>A: Upload Profile Data
    A->>T: Validate & Process
    T->>R2: Store Profile
    T->>R: Cache Profile
    A-->>U: Profile Updated
```

### 3. Invite System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Next.js App
    participant T as Invite Service
    participant R2 as Cloudflare R2
    participant R as Redis

    U->>A: Request Invite Code
    A->>T: Generate Code
    T->>R2: Store Invite Data
    T->>R: Cache Invite Codes
    A->>U: Display QR Code
```

### 4. Signal Matching Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant A as Next.js App
    participant T as Signal Service
    participant R2 as Cloudflare R2
    participant CC as Qdrant
    participant R as Redis

    U1->>A: Send Signal to U2
    A->>T: Store Signal
    T->>R2: Log Signal
    T->>CC: Update Vector Index
    T->>R: Cache Signal State

    U2->>A: Send Signal to U1
    A->>T: Check Mutual Match
    T->>R: Check Signal State
    T-->>A: Mutual Match Detected
    A->>U1: Unlock Profile
    A->>U2: Unlock Profile
```

### 5. Event Ticket Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Next.js App
    participant T as Event Service
    participant JJ as Blockchain API
    participant R2 as Cloudflare R2
    participant R as Redis

    U->>A: Request Event Ticket
    A->>T: Check Event Status
    T->>R: Cache Event Data
    T->>JJ: Mint NFT Ticket
    JJ-->>T: Transaction Result
    T->>R2: Store Ticket Data
    A-->>U: Ticket Minted
```

## Component Architecture

### Frontend Components

```mermaid
graph TB
    subgraph "Authentication Components"
        A[WorldIDButton]
        B[ConnectWalletButton]
        C[SessionIndicator]
        D[NetworkIndicator]
    end

    subgraph "Profile Components"
        E[ProfileSetup]
        F[ProfileEditor]
        G[BadgeDisplay]
        H[ImageUpload]
    end

    subgraph "Discovery Components"
        I[ProfileCard]
        J[ProfileFilters]
        K[EmptyState]
        L[HorizontalScroll]
    end

    subgraph "Social Components"
        M[InviteDashboard]
        N[SignalButton]
        O[MutualMatchNotification]
        P[QRCodeGenerator]
    end

    subgraph "Event Components"
        Q[EventDisplay]
        R[TicketMinter]
        S[TicketDisplay]
        T[CountdownTimer]
    end

    subgraph "Scoring Components"
        U[ScoreBreakdown]
        V[Leaderboard]
        W[ScoreHistory]
        X[PercentileRanking]
    end

    subgraph "UI Components"
        Y[ParticleBackground]
        Z[AnimatedSigil]
        AA[GoldenGlowEffects]
        BB[LoadingStates]
    end
```

### Backend Services

```mermaid
graph TB
    subgraph "Core Services"
        A[ProfileService]
        B[InviteService]
        C[SignalService]
        D[EventService]
        E[DiscoveryService]
        F[ScoringService]
    end

    subgraph "Storage Services"
        G[R2StorageService]
        H[RedisCacheService]
        I[VectorStoreService]
        J[QueueService]
    end

    subgraph "External Services"
        K[WorldIDService]
        L[BlockchainService]
        M[MLService]
        N[NotificationService]
    end

    subgraph "Utilities"
        O[ValidationService]
        P[RateLimitService]
        Q[LoggingService]
        R[MonitoringService]
    end

    A --> G
    B --> G
    C --> G
    D --> G
    E --> H
    F --> I

    A --> K
    B --> L
    C --> M
    D --> L
    F --> M

    G --> O
    H --> P
    I --> Q
    J --> R
```

## Database Schema

### User Profile Schema

```mermaid
erDiagram
    USERS {
        string id PK
        string worldId
        string walletAddress
        string profileImage
        text bio
        string university
        int graduationYear
        boolean isProfileComplete
        timestamp lastUpdatedAt
    }

    USER_PROFILES {
        string userId FK
        json vibeTags
        json verificationBadges
        json preferences
    }

    USER_SCORES {
        string userId FK
        float score
        json breakdown
        int percentile
        timestamp scoredAt
        boolean isPublic
    }

    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ USER_SCORES : has
```

### Invite System Schema

```mermaid
erDiagram
    INVITE_CODES {
        string code PK
        string userId FK
        boolean isUsed
        string usedBy
        timestamp usedAt
        timestamp createdAt
        timestamp expiresAt
    }

    INVITE_CLAIMS {
        string id PK
        string inviteCode FK
        string userId FK
        timestamp claimedAt
        string ipAddress
    }

    INVITE_CODES ||--o{ INVITE_CLAIMS : generates
```

### Signal System Schema

```mermaid
erDiagram
    SIGNALS {
        string id PK
        string fromUserId FK
        string toUserId FK
        timestamp createdAt
        boolean isMutual
        boolean isRead
    }

    MUTUAL_MATCHES {
        string id PK
        string userId1 FK
        string userId2 FK
        timestamp matchedAt
        json interactionData
    }

    SIGNALS ||--o{ MUTUAL_MATCHES : creates
```

### Event System Schema

```mermaid
erDiagram
    EVENTS {
        string id PK
        string name
        text description
        string imageUrl
        timestamp startDate
        timestamp endDate
        decimal ticketPrice
        int maxTickets
        int currentTickets
        boolean isActive
    }

    TICKETS {
        string id PK
        string userId FK
        string eventId FK
        string tokenId
        timestamp mintedAt
        timestamp expiresAt
        boolean isValid
        json metadata
    }

    EVENTS ||--o{ TICKETS : has
```

## API Architecture

### RESTful API Structure

```mermaid
graph TB
    subgraph "Authentication APIs"
        A[POST /api/auth/worldid]
        B[POST /api/auth/nft-verify]
        C[GET /api/auth/session]
        D[POST /api/auth/logout]
    end

    subgraph "Profile APIs"
        E[GET /api/profiles]
        F[POST /api/profiles]
        G[PUT /api/profiles/:id]
        H[GET /api/profiles/:id]
    end

    subgraph "Storage APIs"
        I[GET /api/storage/:key]
        J[PUT /api/storage/:key]
        K[DELETE /api/storage/:key]
    end

    subgraph "Invite APIs"
        L[GET /api/invites]
        M[POST /api/infites]
        N[DELETE /api/invites/:code]
        O[POST /api/invites/:code/redeem]
    end

    subgraph "Signal APIs"
        P[POST /api/signals/send]
        Q[GET /api/signals/received]
        R[GET /api/signals/sent]
        S[GET /api/signals/mutual]
    end

    subgraph "Event APIs"
        T[GET /api/events]
        U[POST /api/events/:id/tickets]
        V[GET /api/events/:id/tickets]
        W[POST /api/events/:id/tickets/:id/refund]
    end

    subgraph "Discovery APIs"
        X[GET /api/discovery/profiles]
        Y[GET /api/discovery/recommended]
        Z[POST /api/discovery/filters]
    end

    subgraph "ML APIs"
        AA[POST /api/attractiveness/score]
        BB[GET /api/attractiveness/leaderboard]
        CC[GET /api/attractiveness/similar]
    end
```

## Security Architecture

### Authentication & Authorization

```mermaid
graph TB
    subgraph "Authentication Flow"
        A[User Request]
        B[JWT Validation]
        C[Session Check]
        D[Permission Check]
        E[Access Granted]
    end

    subgraph "Security Layers"
        F[Rate Limiting]
        G[Input Validation]
        H[Output Sanitization]
        I[CSRF Protection]
        J[SQL Injection Prevention]
    end

    A --> F
    F --> G
    G --> B
    B --> C
    C --> D
    D --> H
    H --> I
    I --> E
```

### Data Protection

```mermaid
graph TB
    subgraph "Data at Rest"
        A[Encryption]
        B[Access Control]
        C[Backup Strategy]
        D[Retention Policy]
    end

    subgraph "Data in Transit"
        E[HTTPS/TLS]
        F[API Key Management]
        G[Token Rotation]
        H[Certificate Pinning]
    end

    subgraph "Data in Use"
        I[Memory Protection]
        J[Variable Scoping]
        K[Error Message Sanitization]
        L[Logging Anonymization]
    end
```

## Performance Architecture

### Caching Strategy

```mermaid
graph TB
    subgraph "Cache Hierarchy"
        A[Browser Cache]
        B[CDN Cache]
        C[Redis Cache]
        D[Application Cache]
    end

    subgraph "Cache Types"
        E[User Profiles]
        F[Session Data]
        G[Invite Codes]
        H[Signal States]
        I[Event Data]
        J[ML Results]
    end

    A --> E
    B --> E
    C --> F
    C --> G
    C --> H
    C --> I
    D --> J
```

### Load Balancing

```mermaid
graph TB
    subgraph "Load Balancers"
        A[DNS Load Balancer]
        B[Application Load Balancer]
        C[Database Load Balancer]
    end

    subgraph "Servers"
        D[Web Server 1]
        E[Web Server 2]
        F[Web Server 3]
        G[ML Server 1]
        H[ML Server 2]
        I[Database Server]
    end

    A --> B
    B --> D
    B --> E
    B --> F
    C --> G
    C --> H
    C --> I
```

## Monitoring & Observability

### Logging Architecture

```mermaid
graph TB
    subgraph "Log Collection"
        A[Application Logs]
        B[System Logs]
        C[Access Logs]
        D[Error Logs]
    end

    subgraph "Log Processing"
        E[Log Aggregation]
        F[Log Indexing]
        G[Log Analysis]
        H[Alerting]
    end

    subgraph "Log Storage"
        I[Short-term Storage]
        J[Long-term Storage]
        K[Archive Storage]
    end

    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    E --> I
    I --> J
    J --> K
```

### Metrics Architecture

```mermaid
graph TB
    subgraph "Metrics Collection"
        A[Application Metrics]
        B[System Metrics]
        C[Business Metrics]
        D[User Metrics]
    end

    subgraph "Metrics Processing"
        E[Metrics Aggregation]
        F[Metrics Storage]
        G[Metrics Analysis]
        H[Alerting]
    end

    subgraph "Metrics Visualization"
        I[Dashboards]
        J[Reports]
        K[Alerts]
        L[Anomalies]
    end

    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    H --> K
    G --> L
```

This comprehensive architecture diagram provides a complete view of the enhanced Aurum Circle system, showing how all components interact and data flows through the system. The architecture is designed to be scalable, secure, and performant while maintaining the exclusive, secret society theme of the platform.
