# Shared Packages

This directory contains shared packages used across the Aurum Miniapp monorepo. These packages provide common functionality, types, configurations, and utilities to ensure consistency and reduce code duplication across all applications and services.

## Package Overview

### 📦 [@shared/types](./shared-types)

**Shared TypeScript interfaces and types**

Provides standardized TypeScript interfaces and types used across all applications in the monorepo. This ensures type safety and consistency in data structures, API responses, and service communication.

**Key Features:**

- API response interfaces following project conventions
- ML processing and scoring types
- Authentication and user management interfaces
- Discovery and matching types
- Common utility types

### ⚙️ [@shared/config](./shared-config)

**Unified tooling configurations**

Contains shared configuration files for development tools including ESLint, TypeScript, Jest, and Prettier. This ensures consistent code quality, formatting, and testing practices across all packages.

**Key Features:**

- Base ESLint configuration with TypeScript support
- Next.js specific ESLint rules
- TypeScript configurations for different project types
- Jest testing configuration
- Prettier formatting rules
- Configuration validation utilities

### 🛠️ [@shared/utils](./shared-utils)

**Common utility functions**

Provides a collection of utility functions, error handling, validation helpers, and API client utilities used throughout the monorepo. These utilities follow consistent patterns and provide standardized functionality.

**Key Features:**

- Centralized logging with Winston
- Validation utilities with Zod schemas
- Standardized error handling and types
- API client with retry logic and error handling
- Common utility functions (UUID generation, string manipulation, etc.)

## Installation & Usage

### Installing Dependencies

From the root of the monorepo:

```bash
npm install
```

This will install dependencies for all packages and run the postinstall script to build shared packages.

### Using Shared Packages

In any application or service within the monorepo, you can import from shared packages:

```typescript
// Import types
import { ApiResponse, User, ScoringResult } from '@shared/types';

// Import configurations
import { eslint, typescript, prettier } from '@shared/config';

// Import utilities
import { logger, validateEmail, ApiClient } from '@shared/utils';
```

### Development Workflow

#### Building Packages

Build all shared packages:

```bash
npm run build --workspace=packages/shared-types
npm run build --workspace=packages/shared-config
npm run build --workspace=packages/shared-utils
```

Or build all shared packages at once:

```bash
turbo run build --filter=@shared/*
```

#### Type Checking

Check types across all shared packages:

```bash
turbo run type-check --filter=@shared/*
```

#### Testing

Run tests for shared utilities:

```bash
npm run test --workspace=packages/shared-utils
```

## Package Dependencies

The packages have the following dependency relationships:

```
@shared/types (no dependencies)
    ↑
@shared/utils (depends on @shared/types)
    ↑
applications and services
```

`@shared/config` is independent and can be used by any package or application.

## Adding New Shared Functionality

### When to Create Shared Code

Create shared code when:

- The same interface/type is used in 2+ applications
- The same utility function is needed across multiple services
- Configuration needs to be standardized across the monorepo
- Error handling patterns should be consistent

### Guidelines

1. **Types**: Add to `@shared/types` when interfaces are used across multiple applications
2. **Configuration**: Add to `@shared/config` when tool configurations need to be standardized
3. **Utilities**: Add to `@shared/utils` when functions provide common functionality
4. **Documentation**: Always document new exports with JSDoc comments
5. **Testing**: Add unit tests for new utility functions
6. **Versioning**: Update package.json version when making breaking changes

### Creating a New Shared Package

1. Create directory under `packages/`
2. Add `package.json` with appropriate name (`@shared/package-name`)
3. Configure TypeScript and build scripts
4. Update this README with package information
5. Add to workspace and turbo configuration if needed

## Best Practices

### Import/Export Patterns

- Use named exports for better tree-shaking
- Re-export from index files for clean imports
- Follow consistent naming conventions

```typescript
// Good
export { ApiResponse, ValidationError } from './types';

// Import
import { ApiResponse, ValidationError } from '@shared/types';
```

### Type Safety

- Use strict TypeScript configurations
- Provide generic types where appropriate
- Document complex type relationships

### Error Handling

- Use standardized error types from `@shared/utils`
- Follow consistent error response formats
- Include context in error objects

### Configuration

- Extend base configurations rather than duplicating
- Document configuration options
- Provide environment-specific overrides

## Troubleshooting

### Common Issues

#### Type Resolution Problems

```bash
# Rebuild shared packages
turbo run build --filter=@shared/*

# Clear TypeScript cache
npx tsc --build --clean
```

#### Import Errors

- Ensure shared packages are built before importing
- Check that package names match in package.json
- Verify workspace configuration includes packages/\*

#### Circular Dependencies

- Keep dependency flow unidirectional
- Types package should have no dependencies on other shared packages
- Utilities can depend on types but not vice versa

### Getting Help

1. Check package-specific README files
2. Review existing usage patterns in the codebase
3. Consult team documentation for project-specific conventions
