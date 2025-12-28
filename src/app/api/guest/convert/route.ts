import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { convertGuestToCustomer, captureGuestEmail } from '@/lib/growth/guest'
import { setSessionCookie } from '@/lib/auth'

// Capture email only (partial conversion)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('guest_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No guest session found' },
        { status: 400 }
      )
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await captureGuestEmail(sessionToken, email)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      discountCode: result.discountCode,
      discountPercent: result.discountPercent,
      message: result.message,
    })
  } catch (error) {
    console.error('Error capturing guest email:', error)
    return NextResponse.json(
      { error: 'Failed to save email' },
      { status: 500 }
    )
  }
}

// Full conversion to customer account
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('guest_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No guest session found' },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'Email, password, and first name are required' },
        { status: 400 }
      )
    }

    const result = await convertGuestToCustomer(sessionToken, {
      email,
      password,
      firstName,
      lastName,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      )
    }

    // Create auth session for the new user
    const response = NextResponse.json({
      success: true,
      discountCode: result.discountCode,
      discountPercent: result.discountPercent,
      message: result.message,
      user: {
        id: result.customer!.id,
        email: result.customer!.email,
        firstName: result.customer!.firstName,
      },
    })

    // Set auth session cookie
    const sessionCookie = setSessionCookie(result.customer!.id)
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options as Parameters<typeof response.cookies.set>[2])

    // Clear guest session cookie
    response.cookies.delete('guest_session')

    return response
  } catch (error) {
    console.error('Error converting guest to customer:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
