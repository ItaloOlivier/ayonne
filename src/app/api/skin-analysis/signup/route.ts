import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/auth'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
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

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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
