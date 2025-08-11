/**
 * @description Shared TypeScript interfaces and types for Aurum Miniapp monorepo
 * @version 1.0.0
 */

// API response types
export * from './api';

// Authentication and user management types
export * from './auth';

// ML processing and scoring types
export * from './ml';

// Discovery and matching types
export * from './discovery';

// Common utility types
export type ID = string;
export type Timestamp = string;
export type Base64Image = string;

/**
 * Generic result type for operations that can succeed or fail
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Configuration interface for services
 */
export interface ServiceConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  port?: number;
  host?: string;
}

/**
 * Re-export specific types for backward compatibility
 */
export type { LegacyHealthCheckResponse, LegacyApiResponse } from './api';

export type { ModelConfig, QueueJobData } from './ml';

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

/**
 * Redis configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

/**
 * Log level enumeration
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  dir: string;
  enableConsole?: boolean;
  enableFile?: boolean;
}

/**
 * Error response interface with context
 */
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}
