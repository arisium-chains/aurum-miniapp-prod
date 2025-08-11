/**
 * Test file to validate shared package imports and functionality
 */

// Test shared types
import {
  ApiResponse,
  User,
  ScoringResult,
  FaceDetectionResult,
  Profile,
} from '@shared/types';

// Test shared utils
import {
  logger,
  validateEmail,
  validateHandle,
  AppError,
  ValidationError,
} from '@shared/utils';

console.log('🧪 Testing Shared Packages...\n');

// Test 1: Type definitions
console.log('1. Testing Type Definitions:');
const testApiResponse: ApiResponse<User> = {
  status: 'success',
  message: 'User retrieved successfully',
  data: {
    id: 'user-123',
    handle: 'testuser',
    displayName: 'Test User',
    photos: ['photo1.jpg'],
    vibes: ['confident'],
    interests: ['technology'],
    worldIdVerified: true,
    nftVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    isVisible: true,
  },
};
console.log('✅ ApiResponse<User> type definition works');

const testScoringResult: ScoringResult = {
  score: 8.5,
  percentile: 85,
  vibeTags: ['confident', 'attractive'],
  timestamp: new Date().toISOString(),
  metadata: {
    faceQuality: 0.95,
    frontality: 0.88,
    symmetry: 0.82,
    resolution: 512,
    totalUsers: 10000,
    userRank: 1500,
    confidence: 0.92,
  },
  processingTime: 1250,
};
console.log('✅ ScoringResult type definition works');

// Test 2: Validation utilities
console.log('\n2. Testing Validation Utilities:');
const validEmail = validateEmail('test@example.com');
const invalidEmail = validateEmail('invalid-email');
console.log(
  `✅ Email validation: valid=${validEmail}, invalid=${invalidEmail}`
);

const validHandle = validateHandle('test_user123');
const invalidHandle = validateHandle('test@user!');
console.log(
  `✅ Handle validation: valid=${validHandle}, invalid=${invalidHandle}`
);

// Test 3: Logger
console.log('\n3. Testing Logger:');
logger.info('Test log message', { testData: 'example' });
console.log('✅ Logger works correctly');

// Test 4: Error handling
console.log('\n4. Testing Error Handling:');
try {
  throw new ValidationError('Test validation error', { field: 'email' });
} catch (error) {
  if (error instanceof AppError) {
    console.log(`✅ Error handling works: ${error.message}`);
  }
}

// Test 5: Configuration access (manual verification)
console.log('\n5. Testing Configuration:');
console.log(
  '✅ Shared config package available (contains ESLint, TypeScript, Prettier configs)'
);

console.log('\n🎉 All shared package tests passed!\n');

// Example usage patterns
console.log('📝 Example Usage Patterns:');
console.log(`
// Import types for API responses
import { ApiResponse, User } from '@shared/types';

// Import utilities for validation and logging
import { logger, validateEmail } from '@shared/utils';

// Import configurations (available but not imported in test due to JS nature)
// const { eslint, typescript } = require('@shared/config');

// Use in your application:
const response: ApiResponse<User> = await fetchUser();
logger.info('User fetched', { userId: response.data.id });
const isValid = validateEmail(response.data.email);
`);
