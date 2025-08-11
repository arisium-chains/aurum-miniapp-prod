/**
 * @description Base Jest configuration for Aurum Miniapp monorepo
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.(test|spec).{ts,tsx}'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
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
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/.next/'],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/.next/',
  ],
};
