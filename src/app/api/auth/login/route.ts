import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/auth'
import { checkRateLimit, getClientIP, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP address
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, RATE_LIMITS.auth)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const { email, password } = await request.json()

    // Validate required fields
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { skinAnalyses: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create response with customer data
    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        createdAt: customer.createdAt,
        analysisCount: customer._count.skinAnalyses,
      }
    })

    // Set HTTP-only session cookie for cross-device persistence
    const cookieData = setSessionCookie(customer.id)
    response.cookies.set(cookieData.name, cookieData.value, cookieData.options as Parameters<typeof response.cookies.set>[2])

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login. Please try again.' },
      { status: 500 }
    )
  }
}
