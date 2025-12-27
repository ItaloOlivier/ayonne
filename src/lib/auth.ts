import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import { prisma } from './prisma'

const CUSTOMER_COOKIE_NAME = 'ayonne_session'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

// Session secret - REQUIRED in production, allows dev fallback only in development
// Uses lazy initialization to avoid build-time errors
let _sessionSecret: string | null = null

function getSessionSecret(): string {
  // Return cached value if already validated
  if (_sessionSecret) {
    return _sessionSecret
  }

  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET

  if (secret) {
    _sessionSecret = secret
    return secret
  }

  // Only allow fallback in development mode
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  WARNING: Using insecure dev session secret. Set SESSION_SECRET in production!')
    _sessionSecret = 'dev-only-insecure-secret-do-not-use-in-prod'
    return _sessionSecret
  }

  // In production, throw error if no secret is configured
  throw new Error(
    'CRITICAL: SESSION_SECRET environment variable is required in production. ' +
    'Generate a secure random string (min 32 characters) and set it in your environment.'
  )
}

export interface CustomerSession {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phone: string | null
  createdAt: Date
  analysisCount: number
}

/**
 * Create a signed session token
 */
function signToken(customerId: string): string {
  const timestamp = Date.now()
  const payload = `${customerId}.${timestamp}`
  const signature = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex')
    .substring(0, 16) // Use first 16 chars for shorter token
  return `${payload}.${signature}`
}

/**
 * Verify and extract customer ID from signed token
 */
function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [customerId, timestamp, signature] = parts
    const payload = `${customerId}.${timestamp}`

    // Verify signature
    const expectedSignature = createHmac('sha256', getSessionSecret())
      .update(payload)
      .digest('hex')
      .substring(0, 16)

    if (signature !== expectedSignature) return null

    // Check if token is expired (30 days)
    const tokenAge = Date.now() - parseInt(timestamp, 10)
    if (tokenAge > COOKIE_MAX_AGE * 1000) return null

    return customerId
  } catch {
    return null
  }
}

/**
 * Set customer session cookie (call from API route)
 */
export function setSessionCookie(customerId: string): { name: string; value: string; options: Record<string, unknown> } {
  const signedToken = signToken(customerId)
  return {
    name: CUSTOMER_COOKIE_NAME,
    value: signedToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    }
  }
}

/**
 * Clear customer session cookie (call from API route)
 */
export function clearSessionCookie(): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: CUSTOMER_COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    }
  }
}

/**
 * Get current customer from session cookie (server-side only)
 */
export async function getCurrentCustomer(): Promise<CustomerSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(CUSTOMER_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    // Verify the signed token
    const customerId = verifyToken(sessionCookie.value)
    if (!customerId) {
      return null
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { skinAnalyses: true }
        }
      }
    })

    if (!customer) {
      return null
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      createdAt: customer.createdAt,
      analysisCount: customer._count.skinAnalyses,
    }
  } catch (error) {
    console.error('Error getting current customer:', error)
    return null
  }
}

/**
 * Get customer ID from cookie (for use in API routes)
 */
export async function getCustomerIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(CUSTOMER_COOKIE_NAME)
    if (!sessionCookie?.value) return null
    // Verify the signed token and extract customer ID
    return verifyToken(sessionCookie.value)
  } catch {
    return null
  }
}

/**
 * Require authentication - returns customer ID or throws unauthorized response
 */
export async function requireAuth(): Promise<{ customerId: string; customer: CustomerSession }> {
  const customer = await getCurrentCustomer()
  if (!customer) {
    throw new Error('Unauthorized')
  }
  return { customerId: customer.id, customer }
}
