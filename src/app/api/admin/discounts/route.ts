import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncDiscountToShopify, isShopifyConfigured, batchSyncDiscountsToShopify } from '@/lib/shopify-admin'
import { getDiscountTypeLabel } from '@/lib/growth/discount'
import { isAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

// GET: List all discount codes with sync status
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'synced', 'unsynced', 'all'
    const limit = parseInt(searchParams.get('limit') || '100')

    const where = status === 'synced'
      ? { shopifySynced: true }
      : status === 'unsynced'
      ? { shopifySynced: false }
      : {}

    const discounts = await prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        customer: {
          select: { email: true, firstName: true }
        }
      }
    })

    // Fetch all stats in parallel to avoid N+1 queries
    const now = new Date()
    const [total, synced, unsynced, used, expired] = await Promise.all([
      prisma.discountCode.count(),
      prisma.discountCode.count({ where: { shopifySynced: true } }),
      prisma.discountCode.count({ where: { shopifySynced: false } }),
      prisma.discountCode.count({ where: { used: true } }),
      prisma.discountCode.count({ where: { expiresAt: { lt: now } } }),
    ])

    const stats = { total, synced, unsynced, used, expired }

    return NextResponse.json({
      success: true,
      shopifyConfigured: isShopifyConfigured(),
      stats,
      discounts: discounts.map(d => ({
        id: d.id,
        code: d.code,
        discountPercent: d.discountPercent,
        type: d.type,
        typeLabel: getDiscountTypeLabel(d.type),
        used: d.used,
        usedAt: d.usedAt,
        expiresAt: d.expiresAt,
        expired: d.expiresAt < new Date(),
        shopifySynced: d.shopifySynced,
        shopifyPriceRuleId: d.shopifyPriceRuleId,
        shopifyDiscountCodeId: d.shopifyDiscountCodeId,
        customer: d.customer ? {
          email: d.customer.email,
          firstName: d.customer.firstName
        } : null,
        createdAt: d.createdAt,
      }))
    })
  } catch (error) {
    console.error('Error listing discounts:', error)
    return NextResponse.json(
      { error: 'Failed to list discounts' },
      { status: 500 }
    )
  }
}

// POST: Sync unsynced discount codes to Shopify
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  if (!isShopifyConfigured()) {
    return NextResponse.json(
      { error: 'Shopify API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN.' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { codeId, syncAll = false } = body

    // Sync a specific code
    if (codeId) {
      const discount = await prisma.discountCode.findUnique({ where: { id: codeId } })
      if (!discount) {
        return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
      }

      if (discount.shopifySynced) {
        return NextResponse.json({
          success: true,
          message: 'Already synced',
          discount: { code: discount.code, shopifySynced: true }
        })
      }

      const result = await syncDiscountToShopify({
        code: discount.code,
        discountPercent: discount.discountPercent,
        expiresAt: discount.expiresAt,
        usageLimit: 1,
        oncePerCustomer: true,
        title: `Growth ${getDiscountTypeLabel(discount.type)}: ${discount.code}`,
      })

      if (result.success) {
        await prisma.discountCode.update({
          where: { id: discount.id },
          data: {
            shopifySynced: true,
            shopifyDiscountCodeId: result.discountId,
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Discount synced to Shopify',
          discount: {
            code: discount.code,
            shopifySynced: true,
            discountId: result.discountId,
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 })
      }
    }

    // Sync all unsynced codes
    if (syncAll) {
      const unsyncedDiscounts = await prisma.discountCode.findMany({
        where: {
          shopifySynced: false,
          used: false,
          expiresAt: { gt: new Date() } // Only sync non-expired codes
        }
      })

      if (unsyncedDiscounts.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No unsynced discount codes to sync',
          synced: 0,
          failed: 0
        })
      }

      const toSync = unsyncedDiscounts.map(d => ({
        code: d.code,
        discountPercent: d.discountPercent,
        expiresAt: d.expiresAt,
        usageLimit: 1,
        oncePerCustomer: true,
        title: `Growth ${getDiscountTypeLabel(d.type)}: ${d.code}`,
      }))

      const results = await batchSyncDiscountsToShopify(toSync)

      // Update synced status in database using batch update (avoid N+1)
      const successfulCodes = unsyncedDiscounts
        .filter(d => !results.errors.some(e => e.startsWith(d.code)))
        .map(d => d.id)

      if (successfulCodes.length > 0) {
        await prisma.discountCode.updateMany({
          where: { id: { in: successfulCodes } },
          data: { shopifySynced: true }
        })
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${results.synced} of ${unsyncedDiscounts.length} discount codes`,
        synced: results.synced,
        failed: results.failed,
        errors: results.errors.slice(0, 10) // Limit error output
      })
    }

    return NextResponse.json(
      { error: 'Provide codeId or syncAll: true' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error syncing discounts:', error)
    return NextResponse.json(
      { error: 'Failed to sync discounts' },
      { status: 500 }
    )
  }
}
