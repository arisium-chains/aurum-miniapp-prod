/**
 * @description Standardized API response interfaces following project conventions
 */

/**
 * Base API response structure used across all services
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

/**
 * Legacy API response format for backward compatibility
 */
export interface LegacyApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * API error response with additional error context
 */
export interface ApiErrorResponse {
  status: 'error';
  message: string;
  error_type?:
    | 'validation_error'
    | 'processing_error'
    | 'unauthorized'
    | 'not_found'
    | 'internal_error';
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Request metadata for tracking and debugging
 */
export interface RequestMetadata {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: string;
  clientVersion?: string;
  platform?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  services?: Record<
    string,
    {
      status: 'healthy' | 'unhealthy' | 'degraded';
      latency?: number;
      error?: string;
    }
  >;
  timestamp: string;
}

/**
 * Legacy health check response for backward compatibility
 */
export interface LegacyHealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    redis: boolean;
    queue: boolean;
    models: boolean;
  };
  version: string;
}
