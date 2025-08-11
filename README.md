# Aurum Workspace

A monorepo workspace containing advanced ML services, web applications, and shared packages for the Aurum face scoring platform with standalone ML architecture.

## 🚀 Recent Migration: Standalone ML Service Architecture

**Migration Completed: 2025-08-11**

We've successfully migrated from a nested ML API to a clean, standalone ML service architecture:

- **Before**: Nested ML API with architectural boundary violations
- **After**: Standalone ML service with enhanced ONNX capabilities, batch processing, and production-ready features
- **Benefits**: Better separation of concerns, improved scalability, enhanced ML capabilities, robust error handling

## Architecture Overview

```
Web Application → ML Service Client → Standalone ML API → ONNX Runtime
                      ↓                       ↓              ↓
                   Fallback              BullMQ Queues    Face Detection
                   Handling              Redis Cache      Face Embedding
                                                         Attractiveness Scoring
```

## Structure

```
aurum-workspace/
├── apps/                    # Applications
│   ├── web/                # Next.js web application with ML service client
│   ├── ml-api/             # Standalone ML scoring API service (NEW)
│   └── landing-page/       # Marketing landing page
├── packages/               # Shared packages
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-utils/       # Shared utilities and error handling
│   └── shared-config/      # Shared configuration patterns
├── scripts/                # Utility scripts
│   ├── analyze-codebase.js # Codebase analysis tool
│   ├── backup.js           # Backup management tool
│   └── validate-cleanup.js # Cleanup validation tool
├── deploy/                 # Deployment configurations
├── ARCHITECTURE.md         # Comprehensive architecture documentation
└── ML_SERVICE_INTEGRATION_GUIDE.md # Integration guide
```

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development servers
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

## Scripts

### Codebase Analysis

Analyze the codebase for unused files, duplicates, and optimization opportunities:

```bash
npm run analyze
```

### Backup Management

Create backups before making changes:

```bash
# Create full backup
npm run backup full "Description"

# Create selective backup
node scripts/backup.js selective file1.js file2.js

# List backups
node scripts/backup.js list

# Restore backup
node scripts/backup.js restore backup-name
```

### Docker

```bash
# Build and start services
npm run docker:up

# Development mode
npm run docker:dev

# Production mode
npm run docker:prod

# Stop services
npm run docker:down
```

## ✨ Key Features

### Advanced ML Capabilities

- **Real ONNX Model Processing** - Face detection, embedding extraction, and attractiveness scoring
- **Batch Processing** - Process multiple images in parallel with configurable batch sizes
- **Fallback Mechanisms** - Graceful degradation to simulated ML when models unavailable
- **Quality Validation** - Comprehensive face quality metrics and thresholds

### Production-Ready Infrastructure

- **BullMQ Queues** - Advanced queue management with monitoring dashboard
- **Redis Caching** - High-performance caching layer
- **Rate Limiting** - Configurable request throttling
- **Health Monitoring** - Detailed service and model status endpoints
- **Comprehensive Logging** - Structured logging with request tracking

### Monorepo Integration

- **Shared Types** - Consistent type definitions across services
- **Shared Utilities** - Standardized error handling and logging
- **Configuration Management** - Centralized config patterns

## Development

This workspace uses:

- **Turborepo** for build orchestration
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting

## Applications

### Web App (`apps/web`)

Next.js application with face scoring functionality, user authentication, and discovery features. Now integrates with the standalone ML service via ML Service Client with robust fallback mechanisms.

**Key Integrations:**

- ML Service Client for communication with standalone ML API
- Fallback engines for graceful degradation
- Redis caching for performance optimization
- Comprehensive error handling and user feedback

### ML API (`apps/ml-api`)

Standalone ML scoring API service with advanced ONNX model processing, queue management, and production-ready monitoring capabilities.

**Key Features:**

- ONNX Runtime integration for face detection, embedding extraction, and attractiveness scoring
- BullMQ queue system for scalable image processing
- Redis caching and session management
- Health monitoring and status endpoints
- Batch processing capabilities
- Comprehensive error handling and logging

### Landing Page (`apps/landing-page`)

Marketing landing page for the Aurum platform.

## Packages

### Shared Types (`packages/shared-types`)

Common TypeScript type definitions used across applications, including ML processing results, API responses, and service interfaces.

### Shared Utils (`packages/shared-utils`)

Shared utilities including standardized error handling, logging, and validation functions used across all services.

### Shared Config (`packages/shared-config`)

Common configuration patterns for TypeScript, ESLint, Prettier, and Jest across the monorepo.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Create a pull request

## License

MIT
