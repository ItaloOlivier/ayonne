import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getAllProducts,
  isShopifyConfigured,
} from '@/lib/shopify-admin'
import { SHOPIFY_PRODUCT_MAP } from '@/lib/shopify-products'
import { isAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

/**
 * GET: Get sync status and preview what would be synced
 */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  if (!isShopifyConfigured()) {
    return NextResponse.json(
      { error: 'Shopify API not configured' },
      { status: 400 }
    )
  }

  try {
    // Get products from Shopify
    const shopifyData = await getAllProducts(100)

    // Get products from our database
    const dbProducts = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        shopifySlug: true,
        shopifyVariantId: true,
        shopifyProductId: true,
        inventory: true,
        lastSyncedAt: true,
        price: true,
        name: true,
      },
    })

    // Create lookup maps
    const dbBySlug = new Map(dbProducts.map(p => [p.slug, p]))
    const dbByShopifySlug = new Map(
      dbProducts.filter(p => p.shopifySlug).map(p => [p.shopifySlug!, p])
    )

    // Analyze sync status
    const toSync: Array<{
      shopifyHandle: string
      shopifyTitle: string
      shopifyVariantId: string | null
      shopifyInventory: number
      shopifyPrice: string
      dbSlug: string | null
      dbHasVariantId: boolean
      action: 'update' | 'create' | 'skip'
    }> = []

    for (const shopifyProduct of shopifyData.products) {
      // Try to match by shopifySlug first, then by handle
      const dbProduct =
        dbByShopifySlug.get(shopifyProduct.handle) ||
        dbBySlug.get(shopifyProduct.handle)

      // Also check hardcoded map for variant ID reference
      const hardcodedVariantId = Object.values(SHOPIFY_PRODUCT_MAP).find(
        p => p.handle === shopifyProduct.handle
      )?.variantId

      toSync.push({
        shopifyHandle: shopifyProduct.handle,
        shopifyTitle: shopifyProduct.title,
        shopifyVariantId: shopifyProduct.defaultVariantId,
        shopifyInventory: shopifyProduct.totalInventory,
        shopifyPrice: shopifyProduct.priceRange.min,
        dbSlug: dbProduct?.slug ?? null,
        dbHasVariantId: !!(dbProduct?.shopifyVariantId || hardcodedVariantId),
        action: dbProduct ? 'update' : 'skip', // Only update existing products
      })
    }

    // Stats
    const stats = {
      shopifyProducts: shopifyData.products.length,
      dbProducts: dbProducts.length,
      needsVariantId: toSync.filter(p => !p.dbHasVariantId && p.dbSlug).length,
      needsInventoryUpdate: toSync.filter(p => p.dbSlug).length,
      hasNextPage: shopifyData.hasNextPage,
    }

    return NextResponse.json({
      success: true,
      stats,
      preview: toSync.slice(0, 20), // First 20 for preview
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

/**
 * POST: Sync product data from Shopify to local database
 * Updates: inventory, price, images, variant IDs
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  if (!isShopifyConfigured()) {
    return NextResponse.json(
      { error: 'Shopify API not configured' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { syncInventory = true, syncPrices = true, syncVariantIds = true } = body

    // Get all products from Shopify (paginated)
    let allShopifyProducts: Awaited<ReturnType<typeof getAllProducts>>['products'] = []
    let cursor: string | undefined = undefined
    let hasMore = true

    while (hasMore) {
      const result = await getAllProducts(50, cursor)
      allShopifyProducts = [...allShopifyProducts, ...result.products]
      hasMore = result.hasNextPage
      cursor = result.endCursor ?? undefined
    }

    // Get all DB products
    const dbProducts = await prisma.product.findMany()
    const dbByShopifySlug = new Map(
      dbProducts.filter(p => p.shopifySlug).map(p => [p.shopifySlug!, p])
    )
    const dbBySlug = new Map(dbProducts.map(p => [p.slug, p]))

    // Track results
    const results = {
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Update matching products
    for (const shopifyProduct of allShopifyProducts) {
      const dbProduct =
        dbByShopifySlug.get(shopifyProduct.handle) ||
        dbBySlug.get(shopifyProduct.handle)

      if (!dbProduct) {
        results.skipped++
        continue
      }

      try {
        const updateData: Record<string, unknown> = {
          lastSyncedAt: new Date(),
        }

        if (syncInventory) {
          updateData.inventory = shopifyProduct.totalInventory
          updateData.inStock = shopifyProduct.totalInventory > 0
        }

        if (syncPrices) {
          updateData.price = parseFloat(shopifyProduct.priceRange.min)
        }

        if (syncVariantIds && shopifyProduct.defaultVariantId) {
          updateData.shopifyVariantId = shopifyProduct.defaultVariantId
          updateData.shopifyProductId = shopifyProduct.id
        }

        // Update images if available
        if (shopifyProduct.images.length > 0) {
          updateData.images = shopifyProduct.images
        }

        await prisma.product.update({
          where: { id: dbProduct.id },
          data: updateData,
        })

        results.updated++
      } catch (error) {
        results.errors.push(
          `${shopifyProduct.handle}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.updated} products from Shopify`,
      results,
      totalShopifyProducts: allShopifyProducts.length,
    })
  } catch (error) {
    console.error('Error syncing products:', error)
    return NextResponse.json(
      { error: 'Failed to sync products' },
      { status: 500 }
    )
  }
}
