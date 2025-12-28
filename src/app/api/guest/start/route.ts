import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createGuestSession } from '@/lib/growth/guest'

export async function POST() {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
               headersList.get('x-real-ip') ||
               'unknown'

    const result = await createGuestSession(ip)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 429 } // Too many requests
      )
    }

    const response = NextResponse.json({
      success: true,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
    })

    // Set session token as cookie for convenience
    response.cookies.set('guest_session', result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error creating guest session:', error)
    return NextResponse.json(
      { error: 'Failed to create guest session' },
      { status: 500 }
    )
  }
}
