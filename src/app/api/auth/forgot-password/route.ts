import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac, randomBytes } from 'crypto'

// In a production app, you would send an actual email
// For now, we'll generate a reset token and store it

const RESET_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds

// Simple in-memory store for reset tokens (use Redis/DB in production)
const resetTokens = new Map<string, { email: string; expires: number }>()

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

      // Store the token
      resetTokens.set(hashedToken, {
        email: normalizedEmail,
        expires: Date.now() + RESET_TOKEN_EXPIRY
      })

      // In production, send email here with reset link
      // For now, log the token (remove in production)
      console.log(`Password reset requested for ${normalizedEmail}`)
      console.log(`Reset token (dev only): ${token}`)

      // Clean up expired tokens periodically
      for (const [key, value] of resetTokens.entries()) {
        if (value.expires < Date.now()) {
          resetTokens.delete(key)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}

// Export for use in reset-password route
export { resetTokens, hashToken }
