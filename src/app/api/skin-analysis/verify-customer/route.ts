import { NextResponse } from 'next/server'
import { getCustomerIdFromCookie, getCurrentCustomer } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// This endpoint verifies the current authenticated user from session cookie
// No longer accepts arbitrary customer IDs from query params (security fix)
export async function GET() {
  try {
    // Get authenticated customer from session cookie
    const customerId = await getCustomerIdFromCookie()

    if (!customerId) {
      return NextResponse.json({ valid: false })
    }

    const customer = await getCurrentCustomer()

    if (!customer) {
      return NextResponse.json({ valid: false })
    }

    // Check if customer has already used the analyzer today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayAnalysis = await prisma.skinAnalysis.findFirst({
      where: {
        customerId: customerId,
        createdAt: { gte: today },
        status: { in: ['PROCESSING', 'COMPLETED'] },
      },
    })

    return NextResponse.json({
      valid: true,
      firstName: customer.firstName,
      hasUsedToday: !!todayAnalysis,
    })
  } catch (error) {
    console.error('Verify customer error:', error)
    return NextResponse.json({ valid: false })
  }
}
