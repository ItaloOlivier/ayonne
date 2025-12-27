import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerIdFromCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Security: Get customer ID from authenticated session, not query param
    const customerId = await getCustomerIdFromCookie()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get total count of completed analyses
    const totalCount = await prisma.skinAnalysis.count({
      where: {
        customerId,
        status: 'COMPLETED',
      },
    })

    // Get paginated analyses
    const analyses = await prisma.skinAnalysis.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const hasMore = page * limit < totalCount

    return NextResponse.json({
      analyses,
      totalCount,
      page,
      limit,
      hasMore,
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis history' },
      { status: 500 }
    )
  }
}
