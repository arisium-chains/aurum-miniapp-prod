/**
 * @description Standardized error handling utilities with consistent error types
 * Based on existing error patterns found in the codebase
 */

/**
 * Standard error types used across the application
 */
export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  PROCESSING_ERROR = 'processing_error',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not_found',
  INTERNAL_ERROR = 'internal_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
}

/**
 * Base application error class with additional context
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_ERROR,
    statusCode = 500,
    isOperational = true,
    context?: Record<string, any>
  ) {
    super(message);

    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.VALIDATION_ERROR, 400, true, context);
  }
}

/**
 * Processing error for business logic failures
 */
export class ProcessingError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.PROCESSING_ERROR, 422, true, context);
  }
}

/**
 * Unauthorized access error
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', context?: Record<string, any>) {
    super(message, ErrorType.UNAUTHORIZED, 401, true, context);
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', context?: Record<string, any>) {
    super(message, ErrorType.NOT_FOUND, 404, true, context);
  }
}

/**
 * Network connectivity error
 */
export class NetworkError extends AppError {
  constructor(
    message = 'Network error occurred',
    context?: Record<string, any>
  ) {
    super(message, ErrorType.NETWORK_ERROR, 503, true, context);
  }
}

/**
 * Timeout error for operations that exceed time limits
 */
export class TimeoutError extends AppError {
  constructor(message = 'Operation timed out', context?: Record<string, any>) {
    super(message, ErrorType.TIMEOUT_ERROR, 408, true, context);
  }
}

/**
 * @description Creates a standardized error response object
 * @param error - Error object to format
 * @returns Formatted error response
 */
export function formatErrorResponse(error: Error | AppError) {
  const isAppError = error instanceof AppError;

  return {
    status: 'error' as const,
    message: error.message,
    error_type: isAppError ? error.type : ErrorType.INTERNAL_ERROR,
    ...(isAppError && error.context && { details: error.context }),
    timestamp: isAppError ? error.timestamp : new Date().toISOString(),
  };
}

/**
 * @description Safely extracts error message from unknown error types
 * @param error - Error of unknown type
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * @description Determines if an error is operational (expected) or programming error
 * @param error - Error to check
 * @returns True if operational, false if programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }

  // Common operational errors
  const operationalNames = [
    'ValidationError',
    'UnauthorizedError',
    'NotFoundError',
    'NetworkError',
    'TimeoutError',
  ];

  return operationalNames.includes(error.name);
}

/**
 * @description Creates an error with retry information
 * @param originalError - Original error that occurred
 * @param attempt - Current retry attempt number
 * @param maxAttempts - Maximum number of retry attempts
 * @returns Enhanced error with retry context
 */
export function createRetryError(
  originalError: Error,
  attempt: number,
  maxAttempts: number
): AppError {
  const message = `Operation failed after ${attempt}/${maxAttempts} attempts: ${originalError.message}`;
  const context = {
    originalError: originalError.message,
    attempt,
    maxAttempts,
    ...(originalError instanceof AppError && originalError.context),
  };

  return new ProcessingError(message, context);
}

/**
 * @description Wraps async functions with standardized error handling
 * @param fn - Async function to wrap
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Re-throw operational errors as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unknown errors in AppError
      const message = getErrorMessage(error);
      throw new AppError(message, ErrorType.INTERNAL_ERROR, 500, false, {
        originalError: error,
      });
    }
  };
}

/**
 * HTTP status code mappings for error types
 */
export const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.TIMEOUT_ERROR]: 408,
  [ErrorType.PROCESSING_ERROR]: 422,
  [ErrorType.INTERNAL_ERROR]: 500,
  [ErrorType.NETWORK_ERROR]: 503,
};
