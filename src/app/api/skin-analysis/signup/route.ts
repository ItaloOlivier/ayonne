import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/auth'
import { checkRateLimit, getClientIP, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit'
import { createShopifyCustomer, isShopifyConfigured } from '@/lib/shopify-admin'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP address to prevent spam accounts
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(`signup:${clientIP}`, RATE_LIMITS.signup)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const { firstName, lastName, email, phone, password } = await request.json()

    // Validate required fields
    if (!firstName?.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // NIST recommends minimum 8 characters for passwords
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingCustomer) {
      // Check if this existing customer has done an analysis today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayAnalysis = await prisma.skinAnalysis.findFirst({
        where: {
          customerId: existingCustomer.id,
          createdAt: { gte: today },
        },
      })

      if (todayAnalysis) {
        return NextResponse.json(
          { error: 'Daily limit reached' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        phone: phone?.trim() || null,
      },
    })

    // Sync customer to Shopify (async, don't block signup)
    if (isShopifyConfigured()) {
      createShopifyCustomer({
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName || undefined,
        phone: customer.phone || undefined,
        tags: ['ai-skin-analyzer', 'new-signup'],
        note: 'Created from AI Skin Analyzer signup',
      }).then(async (result) => {
        if (result.success && result.customerId) {
          // Update local customer with Shopify ID
          await prisma.customer.update({
            where: { id: customer.id },
            data: {
              shopifyCustomerId: result.customerId,
              shopifySyncedAt: new Date(),
            },
          })
          console.log(`✅ Synced customer ${customer.email} to Shopify`)
        }
      }).catch((error) => {
        console.error('Failed to sync customer to Shopify:', error)
      })
    }

    const response = NextResponse.json({
      success: true,
      customerId: customer.id,
    })

    // Set HTTP-only session cookie for cross-device persistence
    const cookieData = setSessionCookie(customer.id)
    response.cookies.set(cookieData.name, cookieData.value, cookieData.options as Parameters<typeof response.cookies.set>[2])

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
