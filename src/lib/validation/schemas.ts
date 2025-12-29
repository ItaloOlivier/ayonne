/**
 * Zod Validation Schemas
 *
 * Centralized schema definitions for API input validation.
 */

import { z } from 'zod'

// ============================================
// Common Schemas
// ============================================

export const emailSchema = z.string().email('Invalid email address').transform(val => val.toLowerCase().trim())

export const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password is too long')

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().max(50).trim().optional(),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
})

// ============================================
// Skin Analysis Schemas
// ============================================

export const skinAnalysisImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  imageData: z.string().optional(), // Base64 data
})

export const multiAngleAnalysisSchema = z.object({
  frontImage: z.string().min(1, 'Front image is required'),
  leftImage: z.string().min(1, 'Left profile image is required'),
  rightImage: z.string().min(1, 'Right profile image is required'),
  age: z.coerce.number().int().min(18).max(120).optional(),
})

export const analysisIdParamSchema = z.object({
  id: z.string().cuid('Invalid analysis ID'),
})

// ============================================
// Discount & Referral Schemas
// ============================================

export const discountCodeSchema = z.string()
  .min(4, 'Discount code must be at least 4 characters')
  .max(20, 'Discount code is too long')
  .regex(/^[A-Z0-9]+$/, 'Discount code must be alphanumeric uppercase')

export const referralCodeSchema = z.string()
  .length(8, 'Referral code must be exactly 8 characters')
  .regex(/^[A-Z0-9]+$/, 'Referral code must be alphanumeric uppercase')

export const createDiscountSchema = z.object({
  discountPercent: z.number().int().min(1).max(100),
  expiresAt: z.coerce.date(),
  type: z.enum(['REFERRAL', 'REFERRED', 'STREAK', 'SPIN', 'WELCOME', 'CHALLENGE', 'GUEST']),
})

// ============================================
// Admin Schemas
// ============================================

export const adminDiscountSyncSchema = z.object({
  codeId: z.string().cuid().optional(),
  syncAll: z.boolean().default(false),
})

export const adminProductSyncSchema = z.object({
  syncInventory: z.boolean().default(true),
  syncPrices: z.boolean().default(true),
  syncVariantIds: z.boolean().default(true),
})

export const seoUpdateSchema = z.object({
  action: z.enum(['update', 'optimize', 'bulk-optimize']),
  productId: z.string().optional(),
  handle: z.string().optional(),
  title: z.string().max(60).optional(),
  description: z.string().max(160).optional(),
  category: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  skinConcerns: z.array(z.string()).optional(),
})

// ============================================
// Growth Hacking Schemas
// ============================================

export const spinWheelSchema = z.object({
  analysisId: z.string().cuid('Invalid analysis ID'),
})

export const guestConvertSchema = z.object({
  email: emailSchema,
  sessionToken: z.string().min(1, 'Session token is required'),
})

export const guestFullConvertSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(50).trim(),
  sessionToken: z.string().min(1),
})

// ============================================
// Helper Types (inferred from schemas)
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type MultiAngleAnalysisInput = z.infer<typeof multiAngleAnalysisSchema>
export type AdminDiscountSyncInput = z.infer<typeof adminDiscountSyncSchema>
export type SEOUpdateInput = z.infer<typeof seoUpdateSchema>
