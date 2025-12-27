import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the session cookie
    const cookieData = clearSessionCookie()
    response.cookies.set(cookieData.name, cookieData.value, cookieData.options as Parameters<typeof response.cookies.set>[2])

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
