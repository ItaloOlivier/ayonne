import { NextResponse } from 'next/server'
import { validateDiscountCode } from '@/lib/growth/discount'
import { checkRateLimit, getIpFromRequest, RATE_LIMITS, rateLimitHeaders } from '@/lib/rate-limiter'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Rate limit by IP address
    const ip = getIpFromRequest(request)
    const rateLimitResult = checkRateLimit(`discount-validate:${ip}`, RATE_LIMITS.VALIDATE)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const { code } = await params
    const result = await validateDiscountCode(code)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    return NextResponse.json({
      valid: true,
      discountPercent: result.discountPercent,
      type: result.type,
    }, { headers: rateLimitHeaders(rateLimitResult) })
  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    )
  }
}
