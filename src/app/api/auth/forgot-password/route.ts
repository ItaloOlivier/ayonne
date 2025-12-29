import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac, randomBytes } from 'crypto'
import { checkRateLimit, getIpFromRequest, RATE_LIMITS, rateLimitHeaders } from '@/lib/rate-limiter'

const RESET_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds

function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret')
    .update(token)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit password reset requests
    const ip = getIpFromRequest(request)
    const rateLimitResult = checkRateLimit(`forgot-password:${ip}`, RATE_LIMITS.AUTH)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const { email } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, firstName: true }
    })

    // Always return success to prevent email enumeration attacks
    // In production, only send email if customer exists
    if (customer) {
      const token = generateResetToken()
      const hashedToken = hashToken(token)

      // Invalidate any existing tokens for this email
      await prisma.passwordResetToken.updateMany({
        where: {
          email: normalizedEmail,
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: { usedAt: new Date() } // Mark as used to invalidate
      })

      // Store the new token in database
      await prisma.passwordResetToken.create({
        data: {
          tokenHash: hashedToken,
          email: normalizedEmail,
          expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY),
        }
      })

      // In production, send email here with reset link
      // The link would be: /reset-password?token=${token}
      // NOTE: In development, you may want to log something generic
      // but NEVER log the actual token or email in production
      if (process.env.NODE_ENV === 'development') {
        console.log(`Password reset requested for user (dev mode)`)
      }

      // Clean up expired tokens periodically
      await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    })
  } catch (error) {
    console.error('Forgot password error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}
