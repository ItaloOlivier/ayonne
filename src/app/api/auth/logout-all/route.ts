import { NextRequest, NextResponse } from 'next/server'
import { getCustomerIdFromCookie, clearSessionCookie, revokeAllTokens } from '@/lib/auth'
import { checkRateLimit, getClientIP, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit'

/**
 * POST /api/auth/logout-all
 * Logs out user from all devices by revoking all session tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`logout-all:${clientIP}`, RATE_LIMITS.auth)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Verify authentication
    const customerId = await getCustomerIdFromCookie()
    if (!customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Revoke all tokens for this customer
    await revokeAllTokens(customerId, 'logout_all')

    // Clear current session cookie
    const cookieData = clearSessionCookie()
    const response = NextResponse.json({
      success: true,
      message: 'You have been logged out from all devices'
    })

    response.cookies.set(cookieData.name, cookieData.value, cookieData.options as Parameters<typeof response.cookies.set>[2])

    console.log(`[PRIVACY] Logout all devices: ${customerId}`)

    return response
  } catch (error) {
    console.error('Logout all error:', error)
    return NextResponse.json(
      { error: 'Failed to logout from all devices' },
      { status: 500 }
    )
  }
}
