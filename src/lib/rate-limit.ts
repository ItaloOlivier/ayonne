/**
 * Simple in-memory rate limiter for API endpoints
 *
 * Uses a sliding window approach with automatic cleanup.
 * Suitable for single-server deployments.
 * For multi-server deployments, use Redis-based rate limiting.
 */

type RateLimitEntry = {
  count: number
  resetTime: number
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)

  // Don't prevent Node.js from exiting
  cleanupTimer.unref()
}

export type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check rate limit for a given identifier (e.g., IP address, user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = identifier

  let entry = rateLimitStore.get(key)

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client IP from request headers
 * Handles common proxy headers
 */
export function getClientIP(request: Request): string {
  // Check various proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the list (original client)
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Fallback - in development this may be localhost
  return '127.0.0.1'
}

/**
 * Pre-configured rate limits for common use cases
 */
export const RATE_LIMITS = {
  // Auth endpoints: 5 attempts per minute (prevents brute force)
  auth: { limit: 5, windowSeconds: 60 },

  // Signup: 3 per minute (prevent spam accounts)
  signup: { limit: 3, windowSeconds: 60 },

  // Skin analysis: 10 per hour (resource-intensive AI calls)
  analysis: { limit: 10, windowSeconds: 3600 },

  // General API: 100 requests per minute
  api: { limit: 100, windowSeconds: 60 },
} as const

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  }
}
