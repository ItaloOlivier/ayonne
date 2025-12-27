import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')

    if (!customerId) {
      return NextResponse.json({ valid: false })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, firstName: true },
    })

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
