import { z } from "zod"

// User validation schemas
export const userProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  vibe: z.enum(['Wicked', 'Royal', 'Mystic']),
  tags: z.array(z.string()).max(5)
})

export const userHandleSchema = z.object({
  handle: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)
})

// Authentication schemas
export const worldIdProofSchema = z.object({
  merkle_root: z.string(),
  nullifier_hash: z.string(),
  proof: z.string(),
  verification_level: z.string()
})

export const walletAuthSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  message: z.string(),
  signature: z.string()
})

// Signal/Match schemas
export const sendSignalSchema = z.object({
  toUserId: z.string().uuid(),
  type: z.enum(['interest', 'super_interest', 'pass']),
  message: z.string().max(200).optional()
})

// Invite schemas
export const createInviteSchema = z.object({
  maxUses: z.number().min(1).max(1).default(1)
})

export const claimInviteSchema = z.object({
  code: z.string().regex(/^AURUM-[A-Z0-9]{4}$/)
})

// Discovery schemas
export const discoveryFiltersSchema = z.object({
  vibe: z.enum(['Wicked', 'Royal', 'Mystic', 'All']).optional(),
  tags: z.array(z.string()).optional(),
  maxDistance: z.number().min(0).max(100).optional()
})

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
})

// File upload schemas
export const imageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(file => file.type.startsWith('image/'), "File must be an image")
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 
      "File must be JPEG, PNG, or WebP")
})

// API Response validation
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional()
  })

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema).optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      hasMore: z.boolean()
    }).optional()
  })

// Environment variables schema
export const envSchema = z.object({
  NEXT_PUBLIC_WORLDCOIN_APP_ID: z.string(),
  WORLDCOIN_APP_SECRET: z.string(),
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string(),
  ALCHEMY_API_KEY: z.string(),
  JWT_SECRET: z.string(),
  NFT_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
})