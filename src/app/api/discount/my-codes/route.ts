import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { getAvailableDiscounts, getBestDiscount, getDiscountTypeLabel } from '@/lib/growth/discount'

export async function GET() {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discounts = await getAvailableDiscounts(user.id)
    const bestDiscount = await getBestDiscount(user.id)

    return NextResponse.json({
      success: true,
      discounts: discounts.map((d) => ({
        code: d.code,
        discountPercent: d.discountPercent,
        type: d.type,
        typeLabel: getDiscountTypeLabel(d.type),
        expiresAt: d.expiresAt,
        expiresIn: Math.max(0, Math.floor((d.expiresAt.getTime() - Date.now()) / 1000 / 60 / 60)), // hours
      })),
      bestDiscount: bestDiscount
        ? {
            code: bestDiscount.code,
            discountPercent: bestDiscount.discountPercent,
            type: bestDiscount.type,
            typeLabel: getDiscountTypeLabel(bestDiscount.type),
          }
        : null,
      totalAvailable: discounts.length,
    })
  } catch (error) {
    console.error('Error getting discount codes:', error)
    return NextResponse.json(
      { error: 'Failed to get discount codes' },
      { status: 500 }
    )
  }
}
