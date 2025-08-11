/**
 * @description Jest configuration for ML API service
 * Extends the shared base configuration with ML-specific settings
 */

const baseConfig = require('@shared/config/jest/base');

module.exports = {
  ...baseConfig,
  displayName: 'ML API Service',
  rootDir: '.',
  testMatch: [
    '<rootDir>/test/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts',
    '!src/types/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/types$': '<rootDir>/../../packages/shared-types/src',
    '^@shared/utils$': '<rootDir>/../../packages/shared-utils/src',
    '^@shared/config$': '<rootDir>/../../packages/shared-config',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/models/'],
  verbose: true,
  testTimeout: 30000, // 30 seconds for ML operations
  // Additional settings for integration tests
  globalSetup: undefined,
  globalTeardown: undefined,
  maxWorkers: 2, // Limit workers for ML operations
};
