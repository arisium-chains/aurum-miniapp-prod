# @shared/utils

Common utility functions, error handling, validation, and API client utilities for the Aurum Miniapp monorepo. This package provides standardized functionality used throughout all applications and services to ensure consistency and reduce code duplication.

## Installation

This package is automatically available in the monorepo workspace. No separate installation required.

## Usage

### Logging

Centralized logging with Winston for consistent log formatting across all services:

```typescript
import { logger, createLogger, logRequest } from '@shared/utils';

// Use the default logger
logger.info('Application started', { port: 3000 });
logger.error('Database connection failed', { error: err.message });

// Create a custom logger for a specific service
const serviceLogger = createLogger('ml-api', {
  level: 'debug',
  enableConsole: true,
  enableFile: true,
});

// Log HTTP requests
app.use(logRequest(serviceLogger));
```

### Validation

Type-safe validation using Zod schemas:

```typescript
import {
  validateEmail,
  validateHandle,
  validateId,
  EmailSchema,
  HandleSchema,
} from '@shared/utils';

// Quick validation functions
const isValidEmail = validateEmail('user@example.com'); // true
const isValidHandle = validateHandle('username123'); // true

// Schema-based validation
const result = EmailSchema.safeParse('invalid-email');
if (!result.success) {
  console.error('Validation errors:', result.error.issues);
}

// Custom validation with error handling
try {
  const validatedData = HandleSchema.parse(userInput);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
  }
}
```

### Error Handling

Standardized error classes and handling:

```typescript
import {
  AppError,
  ValidationError,
  AuthError,
  NotFoundError,
  handleError,
  createErrorResponse,
} from '@shared/utils';

// Throw standardized errors
throw new ValidationError('Invalid email format', { email: userEmail });
throw new AuthError('Invalid credentials');
throw new NotFoundError('User not found', { userId: id });

// Error handling middleware
app.use((err, req, res, next) => {
  const errorResponse = handleError(err);
  res.status(errorResponse.statusCode).json(errorResponse);
});

// Create API error responses
const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
  field: 'email',
});
```

### API Client

HTTP client with retry logic and standardized error handling:

```typescript
import { ApiClient, createApiClient } from '@shared/utils';

// Create API client instance
const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Make requests with automatic retry and error handling
const user = await client.get<User>('/users/123');
const newUser = await client.post<User>('/users', userData);

// Service-specific clients
const mlApiClient = createApiClient('ml-api', {
  baseUrl: process.env.ML_API_URL,
  timeout: 30000, // Longer timeout for ML operations
});
```

### Common Utilities

Various utility functions for common operations:

```typescript
import {
  generateId,
  sleep,
  debounce,
  retry,
  formatBytes,
  sanitizeFilename,
} from '@shared/utils';

// Generate unique IDs
const userId = generateId(); // UUID v4
const requestId = generateId('req'); // Prefixed ID

// Async utilities
await sleep(1000); // Wait 1 second
const debouncedFn = debounce(expensiveFunction, 300);

// Retry with exponential backoff
const result = await retry(() => unstableApiCall(), {
  attempts: 3,
  delay: 1000,
});

// File utilities
const fileSize = formatBytes(1024); // "1 KB"
const safeName = sanitizeFilename('file name.txt'); // "file_name.txt"
```

## Core Features

### Logging System

#### Winston Integration

- Structured logging with consistent formatting
- Multiple transports (console, file, HTTP)
- Environment-specific log levels
- Request/response logging middleware
- Error serialization

#### Usage Patterns

```typescript
// Service initialization
const logger = createLogger('auth-service', {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
});

// Request logging
router.use(logRequest(logger));

// Contextual logging
logger.info('User authentication', {
  userId: user.id,
  method: 'worldid',
  timestamp: new Date().toISOString(),
});
```

### Validation Framework

#### Zod Schema Integration

- Pre-defined schemas for common data types
- Type-safe validation with TypeScript inference
- Consistent error message formatting
- Custom validation rules

#### Available Schemas

```typescript
// Email validation
EmailSchema.parse('user@example.com');

// Handle validation (alphanumeric + underscores)
HandleSchema.parse('user_123');

// ID validation (UUID format)
IdSchema.parse('550e8400-e29b-41d4-a716-446655440000');

// Common object schemas
UserCreateSchema.parse({
  email: 'user@example.com',
  handle: 'username',
  telegramId: '123456789',
});
```

### Error Management

#### Error Class Hierarchy

```typescript
AppError (base class)
├── ValidationError (400)
├── AuthError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
└── InternalServerError (500)
```

#### Error Context

All errors support additional context data:

```typescript
throw new ValidationError('Invalid user data', {
  field: 'email',
  value: userInput.email,
  constraints: ['must be valid email format'],
});
```

### API Client Features

#### Automatic Retry Logic

- Exponential backoff for failed requests
- Configurable retry attempts and delays
- Retry only on retriable errors (5xx, network errors)

#### Request/Response Interceptors

```typescript
const client = new ApiClient({
  baseUrl: 'https://api.example.com',
  interceptors: {
    request: config => {
      // Add authentication headers
      config.headers.Authorization = `Bearer ${getToken()}`;
      return config;
    },
    response: response => {
      // Log successful responses
      logger.info('API response', {
        status: response.status,
        url: response.config.url,
      });
      return response;
    },
  },
});
```

## Best Practices

### Logging Guidelines

1. **Use appropriate log levels:**
   - `error`: System errors, exceptions
   - `warn`: Potentially harmful situations
   - `info`: General application flow
   - `debug`: Detailed diagnostic information

2. **Include relevant context:**

   ```typescript
   logger.error('Database query failed', {
     query: 'SELECT * FROM users',
     error: err.message,
     duration: queryTime,
     userId: req.user?.id,
   });
   ```

3. **Avoid logging sensitive data:**

   ```typescript
   // Bad
   logger.info('User login', { password: user.password });

   // Good
   logger.info('User login', {
     userId: user.id,
     method: 'password',
     success: true,
   });
   ```

### Validation Best Practices

1. **Validate at boundaries:**

   ```typescript
   // API endpoints
   app.post('/users', (req, res) => {
     const userData = UserCreateSchema.parse(req.body);
     // Process validated data
   });
   ```

2. **Use schema composition:**

   ```typescript
   const UpdateUserSchema = UserCreateSchema.partial();
   const UserWithIdSchema = UserCreateSchema.extend({
     id: IdSchema,
   });
   ```

3. **Handle validation errors consistently:**
   ```typescript
   try {
     const data = schema.parse(input);
   } catch (error) {
     if (error instanceof z.ZodError) {
       throw new ValidationError('Invalid input', {
         errors: error.issues,
       });
     }
     throw error;
   }
   ```

### Error Handling Patterns

1. **Use specific error types:**

   ```typescript
   // Instead of generic Error
   throw new ValidationError('Email already exists');
   throw new NotFoundError('User not found');
   ```

2. **Include actionable context:**

   ```typescript
   throw new ValidationError('Invalid file upload', {
     maxSize: '10MB',
     actualSize: formatBytes(file.size),
     allowedTypes: ['image/jpeg', 'image/png'],
   });
   ```

3. **Handle errors at appropriate levels:**

   ```typescript
   // Service level - business logic errors
   if (!user) {
     throw new NotFoundError('User not found');
   }

   // API level - HTTP error responses
   app.use(handleError);
   ```

### API Client Guidelines

1. **Configure timeouts appropriately:**

   ```typescript
   const mlClient = createApiClient('ml-api', {
     timeout: 30000, // 30s for ML operations
     retries: 2,
   });

   const authClient = createApiClient('auth', {
     timeout: 5000, // 5s for auth operations
     retries: 3,
   });
   ```

2. **Use typed requests:**

   ```typescript
   const user = await client.get<User>('/users/123');
   const users = await client.get<User[]>('/users');
   ```

3. **Handle client errors:**
   ```typescript
   try {
     const response = await client.post('/users', userData);
   } catch (error) {
     if (error instanceof ApiClientError) {
       // Handle API-specific errors
       logger.error('API request failed', {
         status: error.status,
         message: error.message,
         url: error.config?.url,
       });
     }
     throw error;
   }
   ```

## Testing

### Unit Testing

The package includes comprehensive unit tests:

```bash
# Run all tests
npm test --workspace=packages/shared-utils

# Run with coverage
npm run test:coverage --workspace=packages/shared-utils

# Watch mode for development
npm run test:watch --workspace=packages/shared-utils
```

### Test Examples

```typescript
import { validateEmail, generateId, retry } from '@shared/utils';

describe('Validation utilities', () => {
  test('validates correct email format', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});

describe('ID generation', () => {
  test('generates valid UUID', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
```

## Configuration

### Environment Variables

The utilities support various environment variables:

```bash
# Logging configuration
LOG_LEVEL=info          # debug, info, warn, error
LOG_ENABLE_CONSOLE=true # Enable console logging
LOG_ENABLE_FILE=false   # Enable file logging
LOG_FILE_PATH=./logs    # Log file directory

# API client configuration
API_TIMEOUT=5000        # Default timeout in milliseconds
API_RETRIES=3           # Default retry attempts
API_BASE_URL=http://localhost:3000  # Default base URL
```

### TypeScript Configuration

The package requires TypeScript with strict settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Contributing

### Adding New Utilities

1. Create the utility function with proper TypeScript types
2. Add comprehensive JSDoc documentation
3. Write unit tests with good coverage
4. Export from the appropriate module
5. Update this README with usage examples

### Code Style

- Use descriptive function names
- Include JSDoc comments for all public functions
- Follow existing error handling patterns
- Add TypeScript types for all parameters and return values
- Write comprehensive unit tests

## Version History

- **v1.0.0** - Initial release with core utilities
  - Winston-based logging system
  - Zod validation framework
  - Standardized error handling
  - HTTP client with retry logic
  - Common utility functions
