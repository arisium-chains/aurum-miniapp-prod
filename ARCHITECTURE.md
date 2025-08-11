# Aurum ML Service Architecture Overview

## Executive Summary

This document outlines the comprehensive architectural migration of the Aurum ML service from a nested, tightly-coupled implementation to a clean, standalone microservice with enhanced capabilities and production-ready features.

## Migration Overview

### Before: Nested Architecture (Legacy)

```mermaid
graph TB
    subgraph "Web Application (apps/web)"
        WA[Next.js Web App]
        subgraph "Nested ML API"
            NMLA[ml-face-score-api-nodejs/]
            SM[Simulated Models]
            BQ[Basic Queue]
        end
    end

    WA --> NMLA
    NMLA --> SM
    NMLA --> BQ

    classDef legacy fill:#ffebee,stroke:#c62828
    classDef issue fill:#fff3e0,stroke:#f57c00

    class NMLA,SM,BQ legacy
```

**Issues with Legacy Architecture:**

- **Architectural Boundary Violations**: ML API embedded within web application
- **Limited Scalability**: Tightly coupled to web app lifecycle
- **Basic ML Capabilities**: Only simulated processing
- **Resource Conflicts**: Shared resources with web application
- **Deployment Complexity**: Cannot scale ML processing independently

### After: Standalone Architecture (Current)

```mermaid
graph TB
    subgraph "Web Application (apps/web)"
        WA[Next.js Web App]
        MSC[ML Service Client]
        FE[Fallback Engine]
    end

    subgraph "Standalone ML Service (apps/ml-api)"
        MLA[ML API Server]

        subgraph "ML Processing Pipeline"
            ONNX[ONNX Runtime]
            FD[Face Detection]
            FEM[Face Embedding]
            AS[Attractiveness Scoring]
        end

        subgraph "Infrastructure"
            BMQ[BullMQ Queues]
            RC[Redis Cache]
            LG[Advanced Logging]
            RL[Rate Limiting]
        end

        subgraph "Monitoring"
            HC[Health Checks]
            MS[Model Status]
            PM[Performance Metrics]
        end
    end

    subgraph "Shared Packages"
        ST["@shared/types"]
        SU["@shared/utils"]
        SC["@shared/config"]
    end

    WA --> MSC
    MSC --> MLA
    MSC -.-> FE

    MLA --> ONNX
    ONNX --> FD
    ONNX --> FEM
    ONNX --> AS

    MLA --> BMQ
    MLA --> RC
    MLA --> LG
    MLA --> RL

    MLA --> HC
    MLA --> MS
    MLA --> PM

    MLA --> ST
    MLA --> SU
    MLA --> SC

    classDef webapp fill:#e8f5e8,stroke:#2e7d32
    classDef mlapi fill:#e3f2fd,stroke:#1976d2
    classDef infrastructure fill:#f3e5f5,stroke:#7b1fa2
    classDef shared fill:#fff8e1,stroke:#f57c00

    class WA,MSC,FE webapp
    class MLA,ONNX,FD,FEM,AS mlapi
    class BMQ,RC,LG,RL,HC,MS,PM infrastructure
    class ST,SU,SC shared
```

## Key Architectural Benefits

### 1. Separation of Concerns

- **Independent Deployment**: ML service can be deployed and scaled separately
- **Technology Focus**: Each service optimized for its specific purpose
- **Resource Isolation**: Dedicated resources for ML processing
- **Fault Isolation**: ML service failures don't affect web application

### 2. Enhanced ML Capabilities

- **Real ONNX Models**: Production-grade face detection and embedding extraction
- **Batch Processing**: Process multiple images in parallel
- **Quality Validation**: Comprehensive face quality metrics
- **Fallback Mechanisms**: Graceful degradation when models unavailable

### 3. Production-Ready Infrastructure

- **Advanced Queuing**: BullMQ with monitoring and retry logic
- **Caching Layer**: Redis for high-performance data access
- **Comprehensive Monitoring**: Health checks, metrics, and observability
- **Security Features**: Rate limiting, input validation, and CORS

### 4. Monorepo Integration

- **Shared Types**: Consistent interfaces across services
- **Shared Utilities**: Standardized error handling and logging
- **Configuration Management**: Centralized config patterns

## Service Communication Patterns

### 1. Synchronous Processing

```mermaid
sequenceDiagram
    participant WA as Web App
    participant MSC as ML Service Client
    participant MLA as ML API
    participant ONNX as ONNX Runtime

    WA->>MSC: processImage(imageBase64)
    MSC->>MLA: POST /api/ml/score
    MLA->>ONNX: Face Detection
    ONNX-->>MLA: Face Coordinates
    MLA->>ONNX: Extract Embeddings
    ONNX-->>MLA: Face Embeddings
    MLA->>ONNX: Calculate Attractiveness
    ONNX-->>MLA: Attractiveness Score
    MLA-->>MSC: ScoringResult
    MSC-->>WA: MLProcessingResult
```

### 2. Fallback Handling

```mermaid
sequenceDiagram
    participant WA as Web App
    participant MSC as ML Service Client
    participant MLA as ML API
    participant FE as Fallback Engine

    WA->>MSC: processImage(imageBase64)
    MSC->>MLA: Health Check
    MLA-->>MSC: Status: Unhealthy
    MSC->>FE: simulateProcessing()
    FE-->>MSC: Simulated Result
    MSC-->>WA: MLProcessingResult (fallback mode)
```

### 3. Batch Processing

```mermaid
sequenceDiagram
    participant WA as Web App
    participant MSC as ML Service Client
    participant MLA as ML API
    participant BMQ as BullMQ
    participant ONNX as ONNX Runtime

    WA->>MSC: processImageBatch(images[])
    MSC->>MLA: POST /api/ml/score/batch
    MLA->>BMQ: Queue Batch Job

    loop For each image
        BMQ->>ONNX: Process Image
        ONNX-->>BMQ: Processing Result
    end

    BMQ-->>MLA: Batch Results
    MLA-->>MSC: BatchResponse
    MSC-->>WA: Results[]
```

## Data Flow Architecture

### Input Processing Pipeline

```mermaid
flowchart TD
    I[Image Input] --> V[Validation Layer]
    V --> |Valid| P[Preprocessing]
    V --> |Invalid| E1[Validation Error]

    P --> FD[Face Detection]
    FD --> |Face Found| FE[Feature Extraction]
    FD --> |No Face| E2[No Face Error]

    FE --> AS[Attractiveness Scoring]
    AS --> QV[Quality Validation]

    QV --> |Pass| R[Result Assembly]
    QV --> |Fail| E3[Quality Error]

    R --> C[Caching]
    C --> O[Output]

    classDef process fill:#e3f2fd,stroke:#1976d2
    classDef error fill:#ffebee,stroke:#c62828
    classDef success fill:#e8f5e8,stroke:#2e7d32

    class I,V,P,FD,FE,AS,QV,R,C process
    class E1,E2,E3 error
    class O success
```

### Error Handling Strategy

```mermaid
flowchart TD
    E[Error Occurs] --> T[Error Type Classification]

    T --> |Validation| VE[Validation Error]
    T --> |Processing| PE[Processing Error]
    T --> |System| SE[System Error]

    VE --> VR[User-Friendly Response]
    PE --> |Retryable| R[Retry Logic]
    PE --> |Non-Retryable| NR[Fallback Processing]
    SE --> SR[Service Recovery]

    R --> |Success| S[Success Response]
    R --> |Max Retries| F[Fallback Processing]
    NR --> FB[Fallback Response]
    F --> FB
    SR --> FB

    classDef error fill:#ffebee,stroke:#c62828
    classDef retry fill:#fff3e0,stroke:#f57c00
    classDef fallback fill:#e8f5e8,stroke:#2e7d32

    class E,T,VE,PE,SE error
    class R,SR retry
    class NR,F,FB,VR,S fallback
```

## Performance Architecture

### Caching Strategy

```mermaid
graph LR
    subgraph "Cache Layers"
        L1[L1: In-Memory Cache]
        L2[L2: Redis Cache]
        L3[L3: Model Cache]
    end

    subgraph "Processing Pipeline"
        PP[Preprocessing]
        ML[ML Models]
        PS[Post-processing]
    end

    L1 --> |Miss| L2
    L2 --> |Miss| L3
    L3 --> |Miss| PP

    PP --> ML
    ML --> PS
    PS --> |Cache Result| L3
    PS --> |Cache Result| L2
    PS --> |Cache Result| L1

    classDef cache fill:#e8f5e8,stroke:#2e7d32
    classDef process fill:#e3f2fd,stroke:#1976d2

    class L1,L2,L3 cache
    class PP,ML,PS process
```

### Scalability Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end

    subgraph "ML Service Instances"
        MLS1[ML Service 1]
        MLS2[ML Service 2]
        MLS3[ML Service N]
    end

    subgraph "Shared Infrastructure"
        Redis[(Redis Cluster)]
        Queue[(BullMQ)]
        Models[(Model Storage)]
    end

    subgraph "Monitoring"
        Metrics[Prometheus]
        Alerts[Alertmanager]
        Dashboards[Grafana]
    end

    LB --> MLS1
    LB --> MLS2
    LB --> MLS3

    MLS1 --> Redis
    MLS1 --> Queue
    MLS1 --> Models

    MLS2 --> Redis
    MLS2 --> Queue
    MLS2 --> Models

    MLS3 --> Redis
    MLS3 --> Queue
    MLS3 --> Models

    MLS1 --> Metrics
    MLS2 --> Metrics
    MLS3 --> Metrics

    Metrics --> Alerts
    Metrics --> Dashboards

    classDef balancer fill:#ffecb3,stroke:#ff8f00
    classDef service fill:#e3f2fd,stroke:#1976d2
    classDef infra fill:#f3e5f5,stroke:#7b1fa2
    classDef monitor fill:#e8f5e8,stroke:#2e7d32

    class LB balancer
    class MLS1,MLS2,MLS3 service
    class Redis,Queue,Models infra
    class Metrics,Alerts,Dashboards monitor
```

## Security Architecture

### Defense in Depth Strategy

```mermaid
graph TB
    subgraph "Network Layer"
        FW[Firewall]
        DDOS[DDoS Protection]
    end

    subgraph "Application Layer"
        CORS[CORS Policy]
        RL[Rate Limiting]
        VAL[Input Validation]
    end

    subgraph "Authentication Layer"
        API[API Keys]
        JWT[JWT Tokens]
        RBAC[Role-Based Access]
    end

    subgraph "Data Layer"
        ENC[Encryption at Rest]
        TLS[TLS in Transit]
        MASK[Data Masking]
    end

    FW --> CORS
    DDOS --> RL
    CORS --> API
    RL --> JWT
    VAL --> RBAC
    API --> ENC
    JWT --> TLS
    RBAC --> MASK

    classDef network fill:#ffecb3,stroke:#ff8f00
    classDef app fill:#e3f2fd,stroke:#1976d2
    classDef auth fill:#e8f5e8,stroke:#2e7d32
    classDef data fill:#f3e5f5,stroke:#7b1fa2

    class FW,DDOS network
    class CORS,RL,VAL app
    class API,JWT,RBAC auth
    class ENC,TLS,MASK data
```

## Deployment Architecture

### Container Orchestration

```mermaid
graph TB
    subgraph "Docker Containers"
        MLApp[ML API App]
        MLWorker[ML Worker]
        Redis[Redis Container]
        Monitor[Monitoring]
    end

    subgraph "Volumes"
        Models[Model Files]
        Logs[Log Files]
        Cache[Cache Data]
    end

    subgraph "Networks"
        Internal[Internal Network]
        External[External Network]
    end

    MLApp --> Models
    MLApp --> Logs
    MLWorker --> Models
    Redis --> Cache

    MLApp -.-> Internal
    MLWorker -.-> Internal
    Redis -.-> Internal
    Monitor -.-> Internal

    MLApp -.-> External

    classDef container fill:#e3f2fd,stroke:#1976d2
    classDef volume fill:#e8f5e8,stroke:#2e7d32
    classDef network fill:#f3e5f5,stroke:#7b1fa2

    class MLApp,MLWorker,Redis,Monitor container
    class Models,Logs,Cache volume
    class Internal,External network
```

## Monitoring and Observability

### Observability Stack

```mermaid
graph LR
    subgraph "Data Collection"
        Logs[Application Logs]
        Metrics[Performance Metrics]
        Traces[Request Traces]
    end

    subgraph "Data Processing"
        Collector[Log Collector]
        Aggregator[Metric Aggregator]
        Processor[Trace Processor]
    end

    subgraph "Storage"
        LogStore[Log Storage]
        MetricStore[Metric Storage]
        TraceStore[Trace Storage]
    end

    subgraph "Visualization"
        Dashboard[Grafana Dashboards]
        Alerts[Alert Manager]
        Search[Log Search]
    end

    Logs --> Collector
    Metrics --> Aggregator
    Traces --> Processor

    Collector --> LogStore
    Aggregator --> MetricStore
    Processor --> TraceStore

    LogStore --> Search
    MetricStore --> Dashboard
    TraceStore --> Dashboard

    Dashboard --> Alerts

    classDef collect fill:#e8f5e8,stroke:#2e7d32
    classDef process fill:#e3f2fd,stroke:#1976d2
    classDef store fill:#f3e5f5,stroke:#7b1fa2
    classDef visual fill:#ffecb3,stroke:#ff8f00

    class Logs,Metrics,Traces collect
    class Collector,Aggregator,Processor process
    class LogStore,MetricStore,TraceStore store
    class Dashboard,Alerts,Search visual
```

## Future Architecture Considerations

### Planned Enhancements

1. **GPU Acceleration**
   - CUDA-enabled containers for faster model inference
   - Dynamic GPU resource allocation
   - Cost optimization through GPU sharing

2. **Model Management**
   - Model versioning and rollback capabilities
   - A/B testing infrastructure for model comparison
   - Automated model deployment pipelines

3. **Advanced Analytics**
   - Real-time performance analytics
   - Predictive scaling based on usage patterns
   - ML model drift detection

4. **Global Distribution**
   - Multi-region deployment strategy
   - Edge computing for reduced latency
   - Content delivery network integration

### Scalability Targets

- **Throughput**: 10,000+ requests per minute
- **Latency**: Sub-200ms average response time
- **Availability**: 99.9% uptime with graceful degradation
- **Scalability**: Auto-scaling from 1 to 100+ instances

## Conclusion

The migration from nested to standalone ML service architecture represents a significant improvement in:

- **Architectural Cleanliness**: Clear separation of concerns
- **Scalability**: Independent scaling and resource management
- **Reliability**: Robust error handling and fallback mechanisms
- **Performance**: Optimized processing pipeline with caching
- **Maintainability**: Modular design with shared components
- **Observability**: Comprehensive monitoring and alerting

This foundation supports future enhancements and ensures the ML service can scale to meet growing demands while maintaining high quality and reliability standards.
