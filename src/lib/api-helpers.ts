/**
 * API Route Helpers
 *
 * Consolidates common patterns used across 20+ API routes:
 * - Authentication checks
 * - Error responses
 * - Rate limiting integration
 */

import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS, type RateLimitConfig, type RateLimitResult } from '@/lib/rate-limiter'

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Standard bad request response
 */
export function badRequestResponse(error: string, details?: unknown) {
  return NextResponse.json(
    details ? { error, details } : { error },
    { status: 400 }
  )
}

/**
 * Standard not found response
 */
export function notFoundResponse(resource = 'Resource') {
  return NextResponse.json(
    { error: `${resource} not found` },
    { status: 404 }
  )
}

/**
 * Standard server error response
 */
export function serverErrorResponse(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * Rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: 'Too many attempts. Please try again later.' },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    }
  )
}

/**
 * Check rate limit and return error response if exceeded
 * Returns null if within limits, or NextResponse if exceeded
 */
export function checkRateLimitOrError(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.STANDARD
): NextResponse | null {
  const result = checkRateLimit(key, config)
  if (!result.success) {
    return rateLimitExceededResponse(result)
  }
  return null
}

/**
 * Get authenticated user or return unauthorized response
 *
 * @example
 * export async function GET() {
 *   const { user, error } = await requireAuth()
 *   if (error) return error
 *
 *   // user is guaranteed to be defined here
 *   return NextResponse.json({ userId: user.id })
 * }
 */
export async function requireAuth(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentCustomer>>>; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getCurrentCustomer()

  if (!user) {
    return { user: null, error: unauthorizedResponse() }
  }

  return { user, error: null }
}

/**
 * Higher-order function to wrap route handlers with auth
 *
 * @example
 * export const GET = withAuth(async (request, user) => {
 *   return NextResponse.json({ userId: user.id })
 * })
 */
export function withAuth<T>(
  handler: (
    request: Request,
    user: NonNullable<Awaited<ReturnType<typeof getCurrentCustomer>>>
  ) => Promise<NextResponse<T>>
) {
  return async (request: Request): Promise<NextResponse<T | { error: string }>> => {
    const user = await getCurrentCustomer()

    if (!user) {
      return unauthorizedResponse() as NextResponse<{ error: string }>
    }

    return handler(request, user)
  }
}

/**
 * Parse JSON body with error handling
 *
 * @example
 * const { body, error } = await parseJsonBody<{ email: string }>(request)
 * if (error) return error
 */
export async function parseJsonBody<T>(
  request: Request
): Promise<{ body: T; error: null } | { body: null; error: NextResponse }> {
  try {
    const body = await request.json()
    return { body: body as T, error: null }
  } catch {
    return {
      body: null,
      error: badRequestResponse('Invalid JSON body'),
    }
  }
}

/**
 * Combined auth + JSON parsing helper
 *
 * @example
 * const { user, body, error } = await requireAuthWithBody<{ analysisId: string }>(request)
 * if (error) return error
 */
export async function requireAuthWithBody<T>(
  request: Request
): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentCustomer>>>; body: T; error: null }
  | { user: null; body: null; error: NextResponse }
> {
  const authResult = await requireAuth()
  if (authResult.error) return { user: null, body: null, error: authResult.error }

  const { body, error: parseError } = await parseJsonBody<T>(request)
  if (parseError) return { user: null, body: null, error: parseError }

  return { user: authResult.user, body, error: null }
}
