/**
 * @description Jest setup file for Web App integration tests
 * Configures global test environment and utilities for Next.js and ML integration
 */

import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Set test timeout for integration tests
jest.setTimeout(30000);

// Global test configuration
process.env.NODE_ENV = 'test';
process.env.ML_API_URL = 'http://localhost:3003';

// Mock Next.js router
jest.mock('next/router', () => require('next-router-mock'));

// Mock Next.js navigation
jest.mock('next/navigation', () => require('next-router-mock'));

// Mock environment variables for testing
Object.defineProperty(process.env, 'ML_API_URL', {
  value: 'http://localhost:3003',
  writable: true,
});

// Global test utilities
global.testUtils = {
  // Helper to create test image base64
  createTestImageBase64: () => {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  },

  // Helper to wait for async operations
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate test user IDs
  generateTestUserId: () =>
    `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

console.log = jest.fn((...args) => {
  // Allow important test output but suppress verbose logs
  if (
    !args.some(
      arg =>
        typeof arg === 'string' &&
        (arg.includes('ML processing') || arg.includes('Testing ML service'))
    )
  ) {
    originalConsoleLog(...args);
  }
});

console.warn = jest.fn((...args) => {
  // Allow warnings but suppress ML service warnings in tests
  if (
    !args.some(arg => typeof arg === 'string' && arg.includes('ML service'))
  ) {
    originalConsoleWarn(...args);
  }
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global teardown
afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});
