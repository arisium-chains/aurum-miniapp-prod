# @shared/types

Shared TypeScript interfaces and types for the Aurum Miniapp monorepo. This package provides standardized type definitions that ensure type safety and consistency across all applications and services.

## Installation

This package is automatically available in the monorepo workspace. No separate installation required.

## Usage

```typescript
import {
  ApiResponse,
  User,
  ScoringResult,
  FaceDetectionResult,
  Profile,
  DiscoveryAction,
} from '@shared/types';

// Example API response
const response: ApiResponse<User> = {
  status: 'success',
  message: 'User retrieved successfully',
  data: {
    id: 'user-123',
    worldIdVerified: true,
    nftProofProvided: false,
    telegramHandle: '@username',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Example ML result
const scoringResult: ScoringResult = {
  score: 8.5,
  confidence: 0.92,
  timestamp: new Date(),
  modelVersion: 'v2.1.0',
  processingTime: 1250,
};
```

## Type Categories

### API Types (`/api`)

Core API response interfaces following project conventions:

- **`ApiResponse<T>`** - Standard API response wrapper with status, message, and data
- **`PaginatedResponse<T>`** - Paginated API responses with metadata
- **`HealthCheckResponse`** - Health check endpoint response format

### Authentication Types (`/auth`)

User management and authentication interfaces:

- **`User`** - Core user entity with verification status
- **`UserSession`** - User session management
- **`WorldIdProof`** - World ID verification proof structure
- **`NFTProof`** - NFT ownership proof structure

### ML Processing Types (`/ml`)

Machine learning and image processing interfaces:

- **`FaceDetectionResult`** - Face detection API response
- **`ScoringResult`** - ML scoring computation result
- **`MLProcessingResult`** - Combined ML processing pipeline result
- **`FaceFeatures`** - Extracted facial feature data
- **`ScoringMetadata`** - Additional scoring context and metadata

### Discovery Types (`/discovery`)

User discovery and matching system interfaces:

- **`Profile`** - User profile for discovery system
- **`UserEmbedding`** - Vector embedding representation
- **`DiscoveryAction`** - User interaction tracking
- **`MatchResult`** - Matching algorithm results

## Type Safety Features

### Strict TypeScript Configuration

All types are built with strict TypeScript settings:

- No implicit any
- Strict null checks
- Exact optional property types
- Comprehensive type coverage

### Generic Support

Many interfaces support generics for flexible usage:

```typescript
// Generic API response
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

// Usage with specific types
const userResponse: ApiResponse<User> = await fetchUser();
const profilesResponse: ApiResponse<Profile[]> = await fetchProfiles();
```

### Validation Integration

Types are designed to work with runtime validation:

```typescript
import { z } from 'zod';
import type { User } from '@shared/types';

// Zod schema matching the User interface
const UserSchema = z.object({
  id: z.string(),
  worldIdVerified: z.boolean(),
  nftProofProvided: z.boolean(),
  telegramHandle: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type-safe validation
const validateUser = (data: unknown): User => {
  return UserSchema.parse(data);
};
```

## Best Practices

### Import Patterns

Use named imports for better tree-shaking:

```typescript
// Good
import { User, ApiResponse } from '@shared/types';

// Avoid
import * as Types from '@shared/types';
```

### Type Composition

Extend base types for specific use cases:

```typescript
import { User } from '@shared/types';

// Extend for application-specific needs
interface ExtendedUser extends User {
  preferences: UserPreferences;
  analytics: AnalyticsData;
}
```

### Optional vs Required

Follow the existing patterns for optional properties:

```typescript
interface User {
  id: string; // Required - always present
  telegramHandle?: string; // Optional - may not be set
  worldIdVerified: boolean; // Required - has default value
}
```

## Contributing

### Adding New Types

1. Choose the appropriate category (`api`, `auth`, `ml`, `discovery`)
2. Add the interface to the relevant file
3. Export from the category's index file
4. Re-export from the main `src/index.ts`
5. Update this README with usage examples

### Type Guidelines

- Use descriptive, consistent naming
- Include JSDoc comments for complex types
- Prefer composition over inheritance
- Keep interfaces focused and cohesive
- Use union types for controlled vocabularies

```typescript
/**
 * Represents the result of ML face scoring computation
 * @interface ScoringResult
 */
export interface ScoringResult {
  /** Computed attractiveness score (0-10) */
  score: number;

  /** Model confidence in the score (0-1) */
  confidence: number;

  /** Processing timestamp */
  timestamp: Date;

  /** Version of the scoring model used */
  modelVersion: string;

  /** Processing time in milliseconds */
  processingTime: number;
}
```

### Breaking Changes

When making breaking changes:

1. Increment the major version in package.json
2. Document the change in a CHANGELOG
3. Provide migration guide for dependent packages
4. Consider backward compatibility options

## TypeScript Configuration

This package uses strict TypeScript configuration:

```json
{
  "extends": "@shared/config/typescript/base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

## Build Output

The package builds to standard CommonJS and ES modules:

```
dist/
├── index.js          # Main entry point
├── index.d.ts        # Type definitions
├── api/              # API types
├── auth/             # Auth types
├── ml/               # ML types
└── discovery/        # Discovery types
```

## Version History

- **v1.0.0** - Initial release with core type definitions
  - API response interfaces
  - User and authentication types
  - ML processing interfaces
  - Discovery system types
