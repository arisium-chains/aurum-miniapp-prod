/**
 * @description Jest setup file for ML API service tests
 * Configures global test environment and utilities
 */

import { jest } from '@jest/globals';

// Set test timeout for ML operations
jest.setTimeout(30000);

// Global test configuration
process.env.NODE_ENV = 'test';
process.env.ML_API_URL = 'http://localhost:3003';

// Mock console methods in test environment to reduce noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Allow test output but suppress verbose ML logging
console.log = jest.fn((...args) => {
  if (
    !args.some(arg => typeof arg === 'string' && arg.includes('ML processing'))
  ) {
    originalConsoleLog(...args);
  }
});

console.warn = jest.fn((...args) => {
  if (
    !args.some(arg => typeof arg === 'string' && arg.includes('ML service'))
  ) {
    originalConsoleWarn(...args);
  }
});

console.error = jest.fn(originalConsoleError);

// Global test utilities
global.testUtils = {
  // Helper to create test image buffers
  createTestImageBuffer: (size: number = 1024): Buffer => {
    return Buffer.alloc(size, 0);
  },

  // Helper to create mock form data
  createMockFormData: (imageBuffer: Buffer, filename: string = 'test.jpg') => {
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer]), filename);
    return formData;
  },

  // Helper to wait for async operations
  wait: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global teardown
afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
