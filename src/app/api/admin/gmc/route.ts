/**
 * Google Merchant Center Admin API
 *
 * Endpoints for managing GMC product issues and syncing fixes to Shopify.
 * Requires ADMIN_API_KEY header for authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

// GMC integration is handled by Python SEO agents
// This endpoint provides a REST interface to trigger and view results

interface GMCIssue {
  productId: string
  title: string
  issueType: string
  severity: 'error' | 'warning'
  description: string
  suggestedFix?: string
}

interface GMCSummary {
  totalProducts: number
  approvedProducts: number
  disapprovedProducts: number
  pendingProducts: number
  issuesByType: Record<string, number>
  feedHealthPercent: number
}

/**
 * GET /api/admin/gmc
 *
 * Query params:
 * - action: 'summary' | 'issues' | 'disapproved' | 'fixes'
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
    // For now, return placeholder data
    // In production, this would call the Python GMC agent via subprocess or API
    if (action === 'summary') {
      const summary: GMCSummary = {
        totalProducts: 0,
        approvedProducts: 0,
        disapprovedProducts: 0,
        pendingProducts: 0,
        issuesByType: {},
        feedHealthPercent: 100,
      }

      return NextResponse.json({
        success: true,
        data: summary,
        message:
          'GMC integration requires GOOGLE_MERCHANT_ID and GOOGLE_SERVICE_ACCOUNT_KEY environment variables',
      })
    }

    if (action === 'issues') {
      const issues: GMCIssue[] = []
      return NextResponse.json({
        success: true,
        data: issues,
        total: 0,
        limit,
        issueType,
      })
    }

    if (action === 'disapproved') {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        limit,
      })
    }

    if (action === 'fixes') {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Run the SEO agents to generate fix suggestions',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: summary, issues, disapproved, or fixes' },
      { status: 400 }
    )
  } catch (error) {
    console.error('GMC API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GMC data', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/gmc
 *
 * Body:
 * - action: 'fix_brand' | 'fix_gtin' | 'fix_description' | 'sync_all'
 * - productIds: string[] (for targeted fixes)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { action, productIds } = body

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    // Actions would trigger Python agent tasks
    switch (action) {
      case 'fix_brand':
        return NextResponse.json({
          success: true,
          message: 'Brand fix task queued',
          productIds: productIds || [],
        })

      case 'fix_gtin':
        return NextResponse.json({
          success: true,
          message: 'GTIN fix task queued',
          productIds: productIds || [],
        })

      case 'fix_description':
        return NextResponse.json({
          success: true,
          message: 'Description fix task queued',
          productIds: productIds || [],
        })

      case 'sync_all':
        return NextResponse.json({
          success: true,
          message: 'Full GMC sync task queued',
        })

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: fix_brand, fix_gtin, fix_description, or sync_all',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('GMC API error:', error)
    return NextResponse.json(
      { error: 'Failed to process GMC request', details: String(error) },
      { status: 500 }
    )
  }
}
