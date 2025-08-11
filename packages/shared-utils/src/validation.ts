/**
 * @description Validation utilities with consistent patterns and error handling
 * Based on existing validation patterns found in the codebase
 */

import { z } from 'zod';

/**
 * @description Validates user handle format (alphanumeric and underscore, 3-20 chars)
 * @param handle - User handle to validate
 * @returns True if valid, false otherwise
 */
export function validateHandle(handle: string): boolean {
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(handle);
}

/**
 * @description Validates display name length (2-50 characters)
 * @param name - Display name to validate
 * @returns True if valid, false otherwise
 */
export function validateDisplayName(name: string): boolean {
  return name.length >= 2 && name.length <= 50;
}

/**
 * @description Validates email format using a comprehensive regex
 * @param email - Email address to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * @description Validates wallet address format (Ethereum)
 * @param address - Wallet address to validate
 * @returns True if valid, false otherwise
 */
export function validateWalletAddress(address: string): boolean {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

/**
 * @description Validates base64 image string
 * @param base64 - Base64 string to validate
 * @returns True if valid, false otherwise
 */
export function validateBase64Image(base64: string): boolean {
  const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  return base64Regex.test(base64);
}

/**
 * @description Validates age range for user profiles
 * @param age - Age to validate
 * @returns True if valid (18-100), false otherwise
 */
export function validateAge(age: number): boolean {
  return Number.isInteger(age) && age >= 18 && age <= 100;
}

/**
 * @description Validates score value (0-100)
 * @param score - Score to validate
 * @returns True if valid, false otherwise
 */
export function validateScore(score: number): boolean {
  return (
    typeof score === 'number' && score >= 0 && score <= 100 && !isNaN(score)
  );
}

/**
 * Zod schemas for common validation patterns
 */
export const schemas = {
  /**
   * User handle schema
   */
  handle: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),

  /**
   * Display name schema
   */
  displayName: z.string().min(2).max(50),

  /**
   * Email schema
   */
  email: z.string().email(),

  /**
   * Wallet address schema
   */
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),

  /**
   * Age schema
   */
  age: z.number().int().min(18).max(100),

  /**
   * Score schema
   */
  score: z.number().min(0).max(100),

  /**
   * User ID schema
   */
  userId: z.string().uuid(),

  /**
   * Base64 image schema
   */
  base64Image: z.string().regex(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/),

  /**
   * API response schema
   */
  apiResponse: z.object({
    status: z.enum(['success', 'error']),
    message: z.string(),
    data: z.any().optional(),
  }),

  /**
   * Pagination params schema
   */
  paginationParams: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
};

/**
 * @description Validates data against a Zod schema and returns typed result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with typed data or error
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * @description Sanitizes HTML content by removing potentially dangerous tags
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * @description Validates and sanitizes user input for bio/description fields
 * @param input - Input string to validate and sanitize
 * @param maxLength - Maximum length allowed (default: 500)
 * @returns Sanitized and validated string
 */
export function validateAndSanitizeText(
  input: string,
  maxLength = 500
): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Check length
  if (sanitized.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }

  // Basic sanitization
  sanitized = sanitizeHtml(sanitized);

  return sanitized;
}
