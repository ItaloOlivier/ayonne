import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'

export async function GET() {
  try {
    const customer = await getCurrentCustomer()

    if (!customer) {
      return NextResponse.json(
        { authenticated: false, customer: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        createdAt: customer.createdAt,
        analysisCount: customer.analysisCount,
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { authenticated: false, customer: null, error: 'Failed to check authentication' },
      { status: 500 }
    )
  }
}
