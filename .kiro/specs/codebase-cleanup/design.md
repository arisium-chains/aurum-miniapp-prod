# Design Document

## Overview

The codebase cleanup and restructuring project will transform the current scattered repository into a well-organized monorepo with clear separation of concerns, unified tooling, and a streamlined docker-compose setup. The design focuses on creating a maintainable structure that supports both development and production workflows while eliminating redundancy and unused code.

## Architecture

### Current State Analysis

The current repository has several structural issues:

- Multiple duplicate docker-compose files (`docker-compose.yml`, `docker-compose-fixed.yml`, `docker-compose-absolute.yml`)
- Scattered applications in different directories (`apps/`, `miniapp/`, root-level `src/`)
- Duplicate package.json files with similar configurations
- Numerous documentation files with overlapping or outdated content
- Inconsistent directory structures across applications

### Target Architecture

```
aurum-workspace/
├── apps/
│   ├── web/                    # Next.js web application
│   ├── ml-api/                 # ML scoring API
│   └── landing-page/           # Landing page application
├── services/
│   └── rust-ml/                # Rust ML services (face detection, embeddings)
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── shared-config/          # Shared configurations (ESLint, TypeScript, etc.)
│   └── shared-utils/           # Shared utility functions
├── infra/
│   ├── docker/                 # Docker configurations
│   ├── nginx/                  # Nginx configurations
│   ├── redis/                  # Redis configurations
│   └── qdrant/                 # Qdrant configurations
├── docs/
│   ├── architecture.md         # System architecture documentation
│   ├── deployment.md           # Deployment guide
│   └── development.md          # Development setup guide
├── scripts/
│   ├── setup.sh               # Initial setup script
│   ├── build.sh               # Build all applications
│   └── deploy.sh              # Deployment script
├── docker-compose.yml          # Unified docker-compose configuration
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── package.json               # Root package.json for workspace management
├── turbo.json                 # Turborepo configuration
└── README.md                  # Comprehensive project documentation
```

## Components and Interfaces

### Workspace Management

**Turborepo Integration**

- Unified build system using Turborepo for efficient monorepo management
- Shared caching for builds, tests, and linting
- Parallel execution of tasks across applications

**Package Management**

- Root-level package.json for workspace dependencies
- Individual package.json files for each app with specific dependencies
- Shared packages for common functionality

### Application Structure

**Standardized App Structure**

```
apps/{app-name}/
├── src/
│   ├── api/                   # API routes/controllers
│   ├── components/            # React components (for web apps)
│   ├── services/              # Business logic services
│   ├── types/                 # App-specific types
│   └── utils/                 # App-specific utilities
├── tests/
├── docs/
├── Dockerfile
├── package.json
└── README.md
```

### Shared Packages

**shared-types**

- Common TypeScript interfaces and types
- API response/request types
- Database schema types

**shared-config**

- ESLint configurations
- TypeScript configurations
- Jest configurations
- Prettier configurations

**shared-utils**

- Common utility functions
- Logging utilities
- Validation helpers

### Infrastructure Components

**Docker Configuration**

- Base docker-compose.yml with core services
- Environment-specific override files
- Standardized Dockerfiles for each service

**Service Discovery**

- Consistent service naming conventions
- Internal networking configuration
- Health check implementations

## Data Models

### Configuration Models

**Docker Service Configuration**

```typescript
interface ServiceConfig {
  name: string;
  build?: {
    context: string;
    dockerfile: string;
  };
  image?: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  depends_on: string[];
  networks: string[];
  healthcheck?: HealthCheck;
}

interface HealthCheck {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
  start_period: string;
}
```

**Package Configuration**

```typescript
interface PackageConfig {
  name: string;
  version: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  workspaces?: string[];
}
```

### Cleanup Models

**File Analysis Result**

```typescript
interface FileAnalysis {
  path: string;
  type: "code" | "documentation" | "configuration" | "asset";
  isUsed: boolean;
  references: string[];
  size: number;
  lastModified: Date;
  recommendation: "keep" | "remove" | "consolidate" | "move";
}

interface CleanupReport {
  totalFiles: number;
  filesToRemove: FileAnalysis[];
  filesToMove: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  duplicates: Array<{
    files: string[];
    recommendation: string;
  }>;
  estimatedSpaceSaved: number;
}
```

## Error Handling

### File Operation Errors

**Safe File Operations**

- Backup creation before any destructive operations
- Rollback capability for failed operations
- Validation of file references before removal

**Docker Configuration Errors**

- Validation of service dependencies
- Port conflict detection
- Volume mount validation

### Build and Deployment Errors

**Build Failure Handling**

- Individual app build isolation
- Dependency resolution error reporting
- Clear error messages with resolution suggestions

**Service Startup Errors**

- Health check implementation for all services
- Graceful degradation for optional services
- Comprehensive logging for troubleshooting

## Testing Strategy

### Cleanup Validation

**Pre-cleanup Testing**

- Automated tests to identify all file dependencies
- Reference analysis across all configuration files
- Build verification before cleanup

**Post-cleanup Validation**

- Automated build tests for all applications
- Docker-compose validation and startup tests
- Integration tests to ensure service communication

### Continuous Integration

**Workspace Testing**

- Parallel testing across all applications
- Shared test utilities and configurations
- Coverage reporting aggregation

**Docker Testing**

- Multi-stage build testing
- Service integration testing
- Performance regression testing

### Development Workflow Testing

**Local Development**

- Hot reload functionality testing
- Development server startup validation
- Database migration testing

**Production Deployment**

- Production build validation
- Service health check testing
- Load balancer configuration testing

## Implementation Phases

### Phase 1: Analysis and Planning

- Comprehensive codebase analysis
- Dependency mapping
- Cleanup plan generation

### Phase 2: Structure Creation

- Create new directory structure
- Set up shared packages
- Configure Turborepo

### Phase 3: Code Migration

- Move applications to new structure
- Update import paths
- Consolidate duplicate code

### Phase 4: Docker Integration

- Create unified docker-compose configuration
- Set up service networking
- Implement health checks

### Phase 5: Documentation and Cleanup

- Create comprehensive documentation
- Remove unused files
- Final validation and testing
