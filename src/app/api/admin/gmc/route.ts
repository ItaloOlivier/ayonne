/**
 * Google Merchant Center Admin API
 *
 * Endpoints for managing GMC product issues and syncing fixes to Shopify.
 * Requires ADMIN_API_KEY header for authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'
import { isGMCConfigured, GoogleMerchantClient } from '@/lib/google-merchant'
import {
  isShopifyConfigured,
  excludeFromGoogleShopping,
  updateGoogleProductCategory,
  updateProductType,
  parseShopifyOfferId,
  suggestCategory,
} from '@/lib/shopify-admin'

interface HealthHistory {
  timestamp: string
  date: string
  totalProducts: number
  productsWithIssues: number
  disapprovedProducts: number
  healthPercentage: number
  bySeverity: Record<string, number>
}

// In-memory health history (in production, use a database)
const healthHistory: HealthHistory[] = []

/**
 * Record health snapshot
 */
function recordHealthSnapshot(summary: {
  totalProducts: number
  productsWithIssues: number
  disapprovedProducts: number
  bySeverity: Record<string, number>
}): HealthHistory {
  const total = summary.totalProducts
  const withIssues = summary.productsWithIssues

  const snapshot: HealthHistory = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    totalProducts: total,
    productsWithIssues: withIssues,
    disapprovedProducts: summary.disapprovedProducts,
    healthPercentage: total > 0 ? ((total - withIssues) / total) * 100 : 100,
    bySeverity: summary.bySeverity,
  }

  healthHistory.push(snapshot)

  // Keep last 90 days
  while (healthHistory.length > 90) {
    healthHistory.shift()
  }

  return snapshot
}

/**
 * Get dashboard data from health history
 */
function getDashboardData() {
  if (healthHistory.length === 0) {
    return null
  }

  const recent = healthHistory.slice(-7)
  const latest = recent[recent.length - 1]
  const first = recent[0]

  const healthChange = latest.healthPercentage - first.healthPercentage

  return {
    current: {
      health: Math.round(latest.healthPercentage),
      disapproved: latest.disapprovedProducts,
      status:
        latest.healthPercentage >= 80
          ? 'healthy'
          : latest.healthPercentage >= 60
            ? 'warning'
            : 'critical',
    },
    trend: {
      direction:
        healthChange > 0 ? 'improving' : healthChange < 0 ? 'declining' : 'stable',
      change: Math.round(healthChange * 10) / 10,
      period: `${recent.length} days`,
    },
    chartData: recent.map((h) => ({
      date: h.date,
      health: Math.round(h.healthPercentage),
      disapproved: h.disapprovedProducts,
    })),
  }
}

/**
 * GET /api/admin/gmc
 *
 * Query params:
 * - action: 'summary' | 'issues' | 'disapproved' | 'fixes' | 'dashboard' | 'health-check'
 * - limit: number (default 100)
 * - issueType: filter by issue type
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'summary'
  const limit = parseInt(searchParams.get('limit') || '100', 10)
  const issueType = searchParams.get('issueType')

  try {
    // Check if GMC is configured
    if (!isGMCConfigured()) {
      return NextResponse.json({
        success: true,
        data: null,
        message:
          'GMC integration requires GOOGLE_MERCHANT_ID and GOOGLE_SERVICE_ACCOUNT_KEY environment variables.',
      })
    }

    const client = new GoogleMerchantClient()

    // Dashboard view - returns health history and trends
    if (action === 'dashboard') {
      const dashboard = getDashboardData()

      if (!dashboard) {
        return NextResponse.json({
          success: true,
          data: null,
          message:
            'No health history available. Run a health check to start tracking.',
        })
      }

      return NextResponse.json({
        success: true,
        data: dashboard,
      })
    }

    // Health check - runs the full GMC analysis
    if (action === 'health-check') {
      const summary = await client.getIssuesSummary()

      // Record snapshot
      recordHealthSnapshot(summary)

      const dashboard = getDashboardData()

      return NextResponse.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          summary: {
            totalProducts: summary.totalProducts,
            productsWithIssues: summary.productsWithIssues,
            disapprovedProducts: summary.disapprovedProducts,
            priorityProductsTotal: summary.priorityProductsTotal,
            priorityProductsWithIssues: summary.priorityProductsWithIssues,
            bySeverity: summary.bySeverity,
            feedHealthPercent:
              summary.totalProducts > 0
                ? Math.round(
                    ((summary.totalProducts - summary.productsWithIssues) /
                      summary.totalProducts) *
                      100
                  )
                : 100,
          },
          commonIssues: summary.commonIssues,
          priorityIssues: summary.priorityIssues.slice(0, 10),
          dashboard,
        },
      })
    }

    // Summary - returns current status
    if (action === 'summary') {
      const summary = await client.getIssuesSummary()

      return NextResponse.json({
        success: true,
        data: {
          totalProducts: summary.totalProducts,
          productsWithIssues: summary.productsWithIssues,
          disapprovedProducts: summary.disapprovedProducts,
          priorityProductsTotal: summary.priorityProductsTotal,
          priorityProductsWithIssues: summary.priorityProductsWithIssues,
          feedHealthPercent:
            summary.totalProducts > 0
              ? Math.round(
                  ((summary.totalProducts - summary.productsWithIssues) /
                    summary.totalProducts) *
                    100
                )
              : 100,
          bySeverity: summary.bySeverity,
          commonIssues: summary.commonIssues,
        },
      })
    }

    // Issues - returns all issues
    if (action === 'issues') {
      const summary = await client.getIssuesSummary()
      let issues = summary.issues

      // Filter by issue type if specified
      if (issueType) {
        issues = issues.filter((i) =>
          i.description.toLowerCase().includes(issueType.toLowerCase())
        )
      }

      return NextResponse.json({
        success: true,
        data: issues.slice(0, limit),
        total: issues.length,
        limit,
        issueType,
      })
    }

    // Disapproved - returns disapproved products
    if (action === 'disapproved') {
      const disapproved = await client.getDisapprovedProducts()

      return NextResponse.json({
        success: true,
        data: disapproved.slice(0, limit),
        total: disapproved.length,
        limit,
      })
    }

    // Fixes - returns fix suggestions
    if (action === 'fixes') {
      const summary = await client.getIssuesSummary()

      // Generate fix suggestions based on common issues
      const fixes = Object.entries(summary.commonIssues).map(
        ([description, data]) => ({
          issue: description,
          count: data.count,
          severity: data.severity,
          resolution: data.resolution || 'Review and fix manually in Shopify',
          shopifyAction:
            description.toLowerCase().includes('brand')
              ? 'set_vendor'
              : description.toLowerCase().includes('gtin')
                ? 'add_barcode'
                : description.toLowerCase().includes('description')
                  ? 'update_description'
                  : 'manual',
        })
      )

      return NextResponse.json({
        success: true,
        data: fixes,
        total: fixes.length,
      })
    }

    return NextResponse.json(
      {
        error:
          'Invalid action. Use: summary, issues, disapproved, fixes, dashboard, or health-check',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('GMC API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch GMC data',
        details: String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/gmc
 *
 * Body:
 * - action: 'run_health_check' | 'exclude_products' | 'fix_category' | 'fix_product_type' | 'analyze_fixes'
 * - offerIds: string[] (GMC offer IDs to fix)
 * - category: string (for fix_category)
 * - productType: string (for fix_product_type)
 * - dryRun: boolean
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { action, offerIds, category, productType, dryRun = false } = body

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    // Run health check (doesn't require Shopify)
    if (action === 'run_health_check') {
      if (!isGMCConfigured()) {
        return NextResponse.json({
          success: false,
          error: 'GMC integration requires GOOGLE_MERCHANT_ID and GOOGLE_SERVICE_ACCOUNT_KEY.',
        })
      }

      const client = new GoogleMerchantClient()
      const summary = await client.getIssuesSummary()
      recordHealthSnapshot(summary)

      return NextResponse.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          summary: {
            totalProducts: summary.totalProducts,
            productsWithIssues: summary.productsWithIssues,
            disapprovedProducts: summary.disapprovedProducts,
            feedHealthPercent:
              summary.totalProducts > 0
                ? Math.round(
                    ((summary.totalProducts - summary.productsWithIssues) /
                      summary.totalProducts) *
                      100
                  )
                : 100,
            bySeverity: summary.bySeverity,
          },
        },
        message: 'Health check completed',
      })
    }

    // Analyze what fixes are needed
    if (action === 'analyze_fixes') {
      if (!isGMCConfigured()) {
        return NextResponse.json({
          success: false,
          error: 'GMC not configured',
        })
      }

      const client = new GoogleMerchantClient()
      const summary = await client.getIssuesSummary()

      // Categorize fixes needed
      const fixPlan = {
        excludeFromFeed: [] as Array<{ offerId: string; title: string; reason: string }>,
        updateCategory: [] as Array<{ offerId: string; title: string; suggestedCategory: string }>,
        shippingIssues: [] as Array<{ offerId: string; title: string; countries: string[] }>,
        imageIssues: [] as Array<{ offerId: string; title: string; issue: string }>,
        other: [] as Array<{ offerId: string; title: string; issue: string }>,
      }

      for (const issue of summary.issues) {
        const desc = issue.description.toLowerCase()

        if (desc.includes('digital books')) {
          fixPlan.excludeFromFeed.push({
            offerId: issue.offerId,
            title: issue.title,
            reason: 'Digital product - cannot be advertised',
          })
        } else if (
          desc.includes('pet pharmaceuticals') ||
          desc.includes('prescription') ||
          desc.includes('dangerous products') ||
          desc.includes('healthcare and medicines') ||
          desc.includes('over-the-counter') ||
          desc.includes('prohibited pharmaceuticals')
        ) {
          fixPlan.updateCategory.push({
            offerId: issue.offerId,
            title: issue.title,
            suggestedCategory: suggestCategory(issue.title),
          })
        } else if (desc.includes('missing shipping')) {
          fixPlan.shippingIssues.push({
            offerId: issue.offerId,
            title: issue.title,
            countries: issue.applicableCountries || [],
          })
        } else if (desc.includes('image')) {
          fixPlan.imageIssues.push({
            offerId: issue.offerId,
            title: issue.title,
            issue: issue.description,
          })
        } else {
          fixPlan.other.push({
            offerId: issue.offerId,
            title: issue.title,
            issue: issue.description,
          })
        }
      }

      // Deduplicate by offerId
      const dedupe = <T extends { offerId: string }>(arr: T[]): T[] => {
        const seen = new Set<string>()
        return arr.filter((item) => {
          if (seen.has(item.offerId)) return false
          seen.add(item.offerId)
          return true
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          excludeFromFeed: dedupe(fixPlan.excludeFromFeed),
          updateCategory: dedupe(fixPlan.updateCategory),
          shippingIssues: dedupe(fixPlan.shippingIssues),
          imageIssues: dedupe(fixPlan.imageIssues),
          other: dedupe(fixPlan.other),
          summary: {
            totalIssues: summary.issues.length,
            toExclude: dedupe(fixPlan.excludeFromFeed).length,
            toCategorize: dedupe(fixPlan.updateCategory).length,
            shippingNeeded: dedupe(fixPlan.shippingIssues).length,
            imageNeeded: dedupe(fixPlan.imageIssues).length,
            otherIssues: dedupe(fixPlan.other).length,
          },
        },
      })
    }

    // All other actions require Shopify
    if (!isShopifyConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN.',
      })
    }

    // Exclude products from Google Shopping feed
    if (action === 'exclude_products') {
      if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
        return NextResponse.json({ error: 'offerIds array is required' }, { status: 400 })
      }

      if (dryRun) {
        return NextResponse.json({
          success: true,
          dryRun: true,
          message: `Would exclude ${offerIds.length} products from Google Shopping`,
          offerIds,
        })
      }

      const results = []
      for (const offerId of offerIds) {
        const parsed = parseShopifyOfferId(offerId)
        if (!parsed) {
          results.push({ offerId, success: false, error: 'Invalid offer ID format' })
          continue
        }

        const result = await excludeFromGoogleShopping(parsed.productId)
        results.push({ offerId, ...result })

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 600))
      }

      return NextResponse.json({
        success: true,
        data: {
          total: offerIds.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        },
      })
    }

    // Fix product category
    if (action === 'fix_category') {
      if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
        return NextResponse.json({ error: 'offerIds array is required' }, { status: 400 })
      }

      if (dryRun) {
        return NextResponse.json({
          success: true,
          dryRun: true,
          message: `Would update category for ${offerIds.length} products`,
          category: category || 'auto-suggested',
          offerIds,
        })
      }

      const results = []
      for (const offerId of offerIds) {
        const parsed = parseShopifyOfferId(offerId)
        if (!parsed) {
          results.push({ offerId, success: false, error: 'Invalid offer ID format' })
          continue
        }

        // Use provided category or auto-suggest
        const categoryToUse = category || suggestCategory(offerId)
        const result = await updateGoogleProductCategory(parsed.productId, categoryToUse)
        results.push({ offerId, category: categoryToUse, ...result })

        await new Promise((resolve) => setTimeout(resolve, 600))
      }

      return NextResponse.json({
        success: true,
        data: {
          total: offerIds.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        },
      })
    }

    // Fix product type
    if (action === 'fix_product_type') {
      if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
        return NextResponse.json({ error: 'offerIds array is required' }, { status: 400 })
      }

      if (!productType) {
        return NextResponse.json({ error: 'productType is required' }, { status: 400 })
      }

      if (dryRun) {
        return NextResponse.json({
          success: true,
          dryRun: true,
          message: `Would update product type to "${productType}" for ${offerIds.length} products`,
          offerIds,
        })
      }

      const results = []
      for (const offerId of offerIds) {
        const parsed = parseShopifyOfferId(offerId)
        if (!parsed) {
          results.push({ offerId, success: false, error: 'Invalid offer ID format' })
          continue
        }

        const result = await updateProductType(parsed.productId, productType)
        results.push({ offerId, productType, ...result })

        await new Promise((resolve) => setTimeout(resolve, 600))
      }

      return NextResponse.json({
        success: true,
        data: {
          total: offerIds.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        },
      })
    }

    return NextResponse.json(
      {
        error:
          'Invalid action. Use: run_health_check, analyze_fixes, exclude_products, fix_category, or fix_product_type',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('GMC API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process GMC request',
        details: String(error),
      },
      { status: 500 }
    )
  }
}
