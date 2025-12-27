import { cookies } from 'next/headers'
import { prisma } from './prisma'

const CUSTOMER_COOKIE_NAME = 'ayonne_session'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

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
 * Set customer session cookie (call from API route)
 */
export function setSessionCookie(customerId: string): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: CUSTOMER_COOKIE_NAME,
    value: customerId,
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

    const customerId = sessionCookie.value

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
    return sessionCookie?.value || null
  } catch {
    return null
  }
}
