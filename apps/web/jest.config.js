/**
 * @description Jest configuration for Web App ML integration tests
 * Extends the shared base configuration with Next.js and web-specific settings
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/test/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/types$': '<rootDir>/../../packages/shared-types/src',
    '^@shared/utils$': '<rootDir>/../../packages/shared-utils/src',
    '^@shared/config$': '<rootDir>/../../packages/shared-config',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testTimeout: 30000, // 30 seconds for integration tests
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/build/'],
  // Environment variables for tests
  setupFiles: ['<rootDir>/jest.env.js'],
  // Integration test specific settings
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/src/**/*.{test,spec}.{ts,tsx}'],
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/test/integration/**/*.test.{ts,tsx}'],
      testEnvironment: 'node',
      testTimeout: 60000, // Longer timeout for integration tests
    },
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
