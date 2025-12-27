import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'

// Simple in-memory store for reset tokens (shared with forgot-password)
// In production, use Redis or database
const resetTokens = new Map<string, { email: string; expires: number }>()

function hashToken(token: string): string {
  return createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret')
    .update(token)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
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
    const tokenData = resetTokens.get(hashedToken)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    if (tokenData.expires < Date.now()) {
      resetTokens.delete(hashedToken)
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update the customer's password
    await prisma.customer.update({
      where: { email: tokenData.email },
      data: { password: hashedPassword }
    })

    // Remove the used token
    resetTokens.delete(hashedToken)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
}
