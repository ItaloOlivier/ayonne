/**
 * Validation Utilities
 *
 * Helper functions for validating request bodies and query parameters.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'

export * from './schemas'

// Zod v4 types
type ZodSchema = z.ZodType<unknown>
type ZodError = z.core.$ZodError

/**
 * Validation error response type
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Format Zod errors into a user-friendly structure
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue: z.core.$ZodIssue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }))
}

/**
 * Validate request body against a schema
 * Returns parsed data on success, or null with error response on failure
 */
export async function validateBody<T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data, error: null }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: formatZodErrors(err),
          },
          { status: 400 }
        ),
      }
    }

    // JSON parse error
    if (err instanceof SyntaxError) {
      return {
        data: null,
        error: NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        ),
      }
    }

    throw err
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T extends ZodSchema>(
  request: Request,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const data = schema.parse(params)
    return { data, error: null }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: formatZodErrors(err),
          },
          { status: 400 }
        ),
      }
    }
    throw err
  }
}

/**
 * Validate route parameters (e.g., [id]) against a schema
 */
export function validateParams<T extends ZodSchema>(
  params: Record<string, string>,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  try {
    const data = schema.parse(params)
    return { data, error: null }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Invalid route parameters',
            details: formatZodErrors(err),
          },
          { status: 400 }
        ),
      }
    }
    throw err
  }
}

/**
 * Simple sync validation (throws on error)
 */
export function validate<T extends ZodSchema>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data)
}

/**
 * Safe validation (returns result object)
 */
export function validateSafe<T extends ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  }
}
