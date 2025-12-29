/**
 * Admin Authentication Utilities
 *
 * Provides authentication for admin API endpoints.
 * In production, consider implementing proper role-based admin authentication.
 */

import { NextResponse } from 'next/server'

/**
 * Check if the request has valid admin authentication
 */
export function isAdminRequest(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_API_KEY

  if (!expectedKey) {
    console.warn('ADMIN_API_KEY not configured - admin endpoints are disabled')
    return false
  }

  return adminKey === expectedKey
}

/**
 * Get admin auth error response
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Wrapper to require admin auth for a handler
 * Usage: export const GET = withAdminAuth(async (request) => { ... })
 */
export function withAdminAuth<T>(
  handler: (request: Request) => Promise<NextResponse<T>>
): (request: Request) => Promise<NextResponse<T>> {
  return async (request: Request): Promise<NextResponse<T>> => {
    if (!isAdminRequest(request)) {
      return unauthorizedResponse() as NextResponse<T>
    }
    return handler(request)
  }
}

/**
 * Type-safe admin context for typed handlers
 */
export interface AdminContext {
  adminKey: string
}

/**
 * Get admin context from request (only call after auth check)
 */
export function getAdminContext(request: Request): AdminContext {
  return {
    adminKey: request.headers.get('x-admin-key') || '',
  }
}
