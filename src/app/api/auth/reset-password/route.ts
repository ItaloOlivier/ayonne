import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'
import { checkRateLimit, getIpFromRequest, RATE_LIMITS, rateLimitHeaders } from '@/lib/rate-limiter'

function hashToken(token: string): string {
  return createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret')
    .update(token)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit password reset attempts
    const ip = getIpFromRequest(request)
    const rateLimitResult = checkRateLimit(`reset-password:${ip}`, RATE_LIMITS.AUTH)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const { token, password } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const hashedToken = hashToken(token)

    // Find the token in database
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashedToken }
    })

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (tokenRecord.usedAt) {
      return NextResponse.json(
        { error: 'This reset link has already been used. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: tokenRecord.id }
      })
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update the customer's password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.customer.update({
        where: { email: tokenRecord.email },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() }
      }),
      // Revoke all existing sessions for this user (security best practice)
      prisma.revokedToken.create({
        data: {
          customerId: (await prisma.customer.findUnique({ where: { email: tokenRecord.email } }))!.id,
          reason: 'password_change',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in.'
    })
  } catch (error) {
    console.error('Reset password error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
}
