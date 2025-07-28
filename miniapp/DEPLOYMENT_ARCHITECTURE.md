# Deployment Architecture

## System Architecture Diagram

```mermaid
graph TD
    A[Client] --> B[Nginx Reverse Proxy]
    B --> C[Next.js Application]
    B --> D[ML Face Scoring API]
    C --> E[Redis - Job Queue/Caching]
    C --> F[Qdrant - Vector Database]
    D --> E
    G[ML Worker] --> E
    H[Model Files] -.-> C
    H -.-> D
    H -.-> G

    subgraph "Docker Containers"
        B
        C
        D
        G
        E
        F
    end

    subgraph "External Storage"
        H
    end

    style C fill:#FFE4B5,stroke:#333
    style D fill:#98FB98,stroke:#333
    style G fill:#98FB98,stroke:#333
    style E fill:#87CEEB,stroke:#333
    style F fill:#87CEEB,stroke:#333
    style B fill:#FFB6C1,stroke:#333
    style H fill:#DDA0DD,stroke:#333

    classDef service fill:#FFE4B5,stroke:#333;
    classDef mlService fill:#98FB98,stroke:#333;
    classDef dataStore fill:#87CEEB,stroke:#333;
    classDef proxy fill:#FFB6C1,stroke:#333;
    classDef storage fill:#DDA0DD,stroke:#333;

    class C,D,G service
    class E,F dataStore
    class B proxy
    class H storage
```

## Deployment Workflow

```mermaid
graph LR
    A[Start Deployment] --> B[Validate Environment]
    B --> C[Check Required Directories]
    C --> D[Create Missing Directories]
    D --> E[Download/Validate Models]
    E --> F[Build Docker Images]
    F --> G[Start Services with Docker Compose]
    G --> H[Verify Service Health]
    H --> I[Deployment Complete]

    style A fill:#FFE4B5
    style B fill:#87CEEB
    style C fill:#87CEEB
    style D fill:#98FB98
    style E fill:#98FB98
    style F fill:#DDA0DD
    style G fill:#DDA0DD
    style H fill:#87CEEB
    style I fill:#98FB98
```

## Model Management Workflow

```mermaid
graph TD
    A[Model Management System] --> B{Models Exist?}
    B -->|Yes| C[Validate Model Integrity]
    B -->|No| D[Download Production Models]
    C --> E{Integrity OK?}
    E -->|Yes| F[Use Existing Models]
    E -->|No| D
    D --> G[Verify Downloaded Models]
    G --> H[Models Ready]

    style A fill:#FFE4B5
    style B fill:#87CEEB
    style C fill:#87CEEB
    style D fill:#98FB98
    style E fill:#87CEEB
    style F fill:#98FB98
    style G fill:#87CEEB
    style H fill:#98FB98
```

## Component Descriptions

### Next.js Application

- Main web application serving the frontend
- Handles user interactions and API requests
- Connects to Redis for job queue and caching
- Connects to Qdrant for vector database operations

### ML Face Scoring API

- REST API for facial attractiveness scoring
- Receives image processing requests
- Queues jobs in Redis for processing
- Returns scoring results to the frontend

### ML Worker

- Background worker processes for ML computations
- Processes jobs from Redis queue
- Uses ONNX Runtime and TensorFlow.js for model inference
- Returns results to the API service

### Redis

- Job queue for distributing work between services
- Caching layer for improved performance
- Shared state management between services

### Qdrant

- Vector database for storing and searching facial embeddings
- Used for similarity matching and clustering
- Handles vector similarity searches efficiently

### Nginx Reverse Proxy

- Routes incoming requests to appropriate services
- Handles SSL termination
- Provides load balancing capabilities
- Serves static assets efficiently

### Model Files

- External storage for ML model files
- Contains face detection and face embedding models
- Mounted as volumes to services that need them
- Managed separately for easier updates
