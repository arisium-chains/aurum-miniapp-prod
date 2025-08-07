// Test setup file
import { vi } from "vitest";

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Set test environment
process.env.NODE_ENV = "test";
