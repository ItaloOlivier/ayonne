import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDiscountTypeLabel } from '@/lib/growth/discount'
import { isAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

// GET: Export discount codes as CSV for manual Shopify import
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status') || 'unsynced' // Export unsynced by default

    const where = status === 'synced'
      ? { shopifySynced: true }
      : status === 'unsynced'
      ? { shopifySynced: false, used: false, expiresAt: { gt: new Date() } }
      : status === 'active'
      ? { used: false, expiresAt: { gt: new Date() } }
      : {}

    const discounts = await prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        count: discounts.length,
        discounts: discounts.map(d => ({
          code: d.code,
          discountPercent: d.discountPercent,
          type: d.type,
          typeLabel: getDiscountTypeLabel(d.type),
          expiresAt: d.expiresAt.toISOString(),
          createdAt: d.createdAt.toISOString(),
        }))
      })
    }

    // CSV format for Shopify bulk import
    // Shopify CSV format: https://help.shopify.com/en/manual/discounts/generating-discount-codes
    const csvHeader = 'Code,Discount Type,Discount Value,Usage Limit,Title,Start Date,End Date'
    const csvRows = discounts.map(d => {
      const startDate = d.createdAt.toISOString().split('T')[0]
      const endDate = d.expiresAt.toISOString().split('T')[0]
      const title = `Growth ${getDiscountTypeLabel(d.type)}`
      return `${d.code},percentage,${d.discountPercent},1,"${title}",${startDate},${endDate}`
    })

    const csvContent = [csvHeader, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ayonne-discounts-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting discounts:', error)
    return NextResponse.json(
      { error: 'Failed to export discounts' },
      { status: 500 }
    )
  }
}
