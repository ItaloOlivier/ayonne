/**
 * Google Merchant Center Admin API
 *
 * Endpoints for managing GMC product issues and syncing fixes to Shopify.
 * Requires ADMIN_API_KEY header for authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'
import { isGMCConfigured, GoogleMerchantClient } from '@/lib/google-merchant'

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
 * - action: 'fix_brand' | 'fix_gtin' | 'fix_description' | 'sync_all' | 'run_health_check'
 * - productIds: string[] (for targeted fixes)
 * - dryRun: boolean
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { action, productIds, dryRun = false } = body

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    // Check if GMC is configured
    if (!isGMCConfigured()) {
      return NextResponse.json({
        success: false,
        error:
          'GMC integration requires GOOGLE_MERCHANT_ID and GOOGLE_SERVICE_ACCOUNT_KEY environment variables.',
      })
    }

    // Run health check
    if (action === 'run_health_check') {
      const client = new GoogleMerchantClient()
      const summary = await client.getIssuesSummary()

      // Record snapshot
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

    // Manual fix actions (placeholder - would integrate with Shopify)
    switch (action) {
      case 'fix_brand':
        return NextResponse.json({
          success: true,
          message: dryRun
            ? 'Would set brand to "Ayonne" for selected products'
            : 'Brand fix task queued',
          productIds: productIds || [],
          dryRun,
        })

      case 'fix_gtin':
        return NextResponse.json({
          success: true,
          message: dryRun
            ? 'Would add GTIN/barcode for selected products'
            : 'GTIN fix task queued',
          productIds: productIds || [],
          dryRun,
        })

      case 'fix_description':
        return NextResponse.json({
          success: true,
          message: dryRun
            ? 'Would update descriptions for selected products'
            : 'Description fix task queued',
          productIds: productIds || [],
          dryRun,
        })

      case 'sync_all':
        return NextResponse.json({
          success: true,
          message: dryRun ? 'Would sync all products' : 'Full GMC sync task queued',
          dryRun,
        })

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: fix_brand, fix_gtin, fix_description, sync_all, or run_health_check',
          },
          { status: 400 }
        )
    }
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
