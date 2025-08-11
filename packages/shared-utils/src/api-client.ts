/**
 * @description API client utilities for standardized service communication
 * Based on existing API patterns found in the codebase
 */

import {
  formatErrorResponse,
  NetworkError,
  TimeoutError,
  ValidationError,
} from './errors';

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API client configuration options
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Request configuration for individual API calls
 */
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  params?: Record<string, string>;
}

/**
 * Standardized API response structure
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error_type?: string;
  timestamp?: string;
}

/**
 * @description Creates a standardized API client with retry logic and error handling
 */
export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * @description Makes an HTTP request with standardized error handling
   * @param endpoint - API endpoint (relative to base URL)
   * @param config - Request configuration
   * @param body - Request body data
   * @returns Promise with API response
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {},
    body?: any
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      timeout = this.config.timeout,
      retries = this.config.retryAttempts,
      params = {},
    } = config;

    const url = this.buildUrl(endpoint, params);
    const requestHeaders = {
      ...this.config.defaultHeaders,
      ...headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = JSON.stringify(body);
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return this.formatResponse(data);
      } catch (error) {
        lastError = this.handleError(error as Error);

        if (attempt === retries) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        await this.delay(this.config.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError!;
  }

  /**
   * @description Makes a GET request
   * @param endpoint - API endpoint
   * @param config - Request configuration
   * @returns Promise with API response
   */
  async get<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * @description Makes a POST request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param config - Request configuration
   * @returns Promise with API response
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST' }, body);
  }

  /**
   * @description Makes a PUT request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param config - Request configuration
   * @returns Promise with API response
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT' }, body);
  }

  /**
   * @description Makes a PATCH request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param config - Request configuration
   * @returns Promise with API response
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH' }, body);
  }

  /**
   * @description Makes a DELETE request
   * @param endpoint - API endpoint
   * @param config - Request configuration
   * @returns Promise with API response
   */
  async delete<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * @description Builds full URL with query parameters
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Full URL string
   */
  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(endpoint, this.config.baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  /**
   * @description Formats API response to standard structure
   * @param data - Raw response data
   * @returns Formatted API response
   */
  private formatResponse<T>(data: any): ApiResponse<T> {
    // Handle both new standardized format and legacy format
    if (data.status && data.message !== undefined) {
      return data as ApiResponse<T>;
    }

    // Legacy format conversion
    if (data.success !== undefined) {
      return {
        status: data.success ? 'success' : 'error',
        message: data.message || (data.success ? 'Success' : 'Error'),
        data: data.data,
        error_type: data.error_type,
        timestamp: data.timestamp,
      };
    }

    // Default format for unknown structure
    return {
      status: 'success',
      message: 'Success',
      data: data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * @description Handles and categorizes errors
   * @param error - Error object
   * @returns Categorized error
   */
  private handleError(error: Error): Error {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new TimeoutError('Request timed out');
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError('Network error occurred');
    }

    if (error.message.includes('400')) {
      return new ValidationError('Invalid request data');
    }

    return error;
  }

  /**
   * @description Delays execution for retry logic
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * @description Creates a pre-configured API client for internal services
 * @param serviceUrl - Base URL for the service
 * @param apiKey - Optional API key for authentication
 * @returns Configured API client
 */
export function createServiceClient(
  serviceUrl: string,
  apiKey?: string
): ApiClient {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return new ApiClient({
    baseUrl: serviceUrl,
    defaultHeaders: headers,
    timeout: 15000,
    retryAttempts: 2,
    retryDelay: 500,
  });
}

/**
 * @description Creates a pre-configured API client for ML services
 * @param mlApiUrl - ML API base URL
 * @returns Configured ML API client
 */
export function createMLServiceClient(mlApiUrl: string): ApiClient {
  return new ApiClient({
    baseUrl: mlApiUrl,
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // Longer timeout for ML operations
    retryAttempts: 1, // Fewer retries for expensive ML operations
    retryDelay: 2000,
  });
}

/**
 * @description Utility function to make simple API requests without client instance
 * @param url - Full URL for the request
 * @param config - Request configuration
 * @param body - Request body
 * @returns Promise with response data
 */
export async function simpleRequest<T = any>(
  url: string,
  config: RequestConfig & { timeout?: number } = {},
  body?: any
): Promise<T> {
  const {
    method = 'GET',
    headers = { 'Content-Type': 'application/json' },
    timeout = 10000,
  } = config;

  const requestOptions: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeout),
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timed out');
      }
      if (error.message.includes('fetch')) {
        throw new NetworkError('Network error occurred');
      }
    }
    throw error;
  }
}
