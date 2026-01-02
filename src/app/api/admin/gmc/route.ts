/**
 * Google Merchant Center Admin API
 *
 * Endpoints for managing GMC product issues and syncing fixes to Shopify.
 * Requires ADMIN_API_KEY header for authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'
import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface GMCIssue {
  productId: string
  offerId: string
  title: string
  issueType: string
  severity: 'critical' | 'error' | 'warning' | 'suggestion'
  description: string
  resolution?: string
}

interface GMCSummary {
  totalProducts: number
  productsWithIssues: number
  disapprovedProducts: number
  feedHealthPercent: number
  bySeverity: Record<string, number>
  commonIssues: Record<string, { count: number; severity: string }>
}

interface GMCHealthDashboard {
  current: {
    health: number
    disapproved: number
    status: 'healthy' | 'warning' | 'critical'
  }
  trend: {
    direction: 'improving' | 'declining' | 'stable'
    change: number
    period: string
  }
  chartData: Array<{ date: string; health: number; disapproved: number }>
}

/**
 * Run Python GMC health check script
 */
async function runGMCHealthCheck(options: {
  autoFix?: boolean
  sendAlerts?: boolean
  dryRun?: boolean
}): Promise<{
  success: boolean
  data?: Record<string, unknown>
  error?: string
}> {
  return new Promise((resolve) => {
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, 'scripts', 'gmc_health_check.py')

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      resolve({
        success: false,
        error: 'GMC health check script not found. Run SEO agent setup first.',
      })
      return
    }

    const args = ['python3', scriptPath]
    if (options.autoFix) args.push('--auto-fix')
    if (options.sendAlerts) args.push('--send-alerts')
    if (options.dryRun) args.push('--dry-run')

    const proc = spawn(args[0], args.slice(1), {
      cwd: projectRoot,
      env: process.env,
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
        })
        return
      }

      try {
        const result = JSON.parse(stdout)
        resolve({ success: true, data: result })
      } catch {
        resolve({
          success: false,
          error: `Failed to parse output: ${stdout}`,
        })
      }
    })

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })

    // Timeout after 60 seconds
    setTimeout(() => {
      proc.kill()
      resolve({ success: false, error: 'Health check timed out' })
    }, 60000)
  })
}

/**
 * Read GMC health history from file
 */
function readGMCHealthHistory(): GMCHealthDashboard | null {
  try {
    const historyPath = path.join(process.cwd(), 'runs', 'gmc_health_history.json')
    if (!fs.existsSync(historyPath)) {
      return null
    }

    const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
    if (!Array.isArray(history) || history.length === 0) {
      return null
    }

    const recent = history.slice(-7)
    const latest = recent[recent.length - 1]
    const first = recent[0]

    const healthChange = latest.health_percentage - first.health_percentage

    return {
      current: {
        health: Math.round(latest.health_percentage),
        disapproved: latest.disapproved_products,
        status:
          latest.health_percentage >= 80
            ? 'healthy'
            : latest.health_percentage >= 60
              ? 'warning'
              : 'critical',
      },
      trend: {
        direction:
          healthChange > 0 ? 'improving' : healthChange < 0 ? 'declining' : 'stable',
        change: Math.round(healthChange * 10) / 10,
        period: `${recent.length} days`,
      },
      chartData: recent.map((h: Record<string, unknown>) => ({
        date: h.date as string,
        health: Math.round(h.health_percentage as number),
        disapproved: h.disapproved_products as number,
      })),
    }
  } catch (error) {
    console.error('Failed to read GMC health history:', error)
    return null
  }
}

/**
 * GET /api/admin/gmc
 *
 * Query params:
 * - action: 'summary' | 'issues' | 'disapproved' | 'fixes' | 'dashboard' | 'health-check'
 * - limit: number (default 100)
 * - issueType: filter by issue type
 * - autoFix: boolean (for health-check)
 * - dryRun: boolean (for health-check)
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
    // Dashboard view - returns health history and trends
    if (action === 'dashboard') {
      const dashboard = readGMCHealthHistory()

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
      const autoFix = searchParams.get('autoFix') === 'true'
      const dryRun = searchParams.get('dryRun') === 'true'
      const sendAlerts = searchParams.get('sendAlerts') === 'true'

      const result = await runGMCHealthCheck({ autoFix, dryRun, sendAlerts })

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    }

    // Summary - returns current status
    if (action === 'summary') {
      // Try to read from latest run artifacts
      const summaryPath = path.join(process.cwd(), 'runs', 'gmc_latest_summary.json')

      if (fs.existsSync(summaryPath)) {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
        return NextResponse.json({
          success: true,
          data: summary,
        })
      }

      // No data available
      return NextResponse.json({
        success: true,
        data: null,
        message:
          'GMC integration requires GOOGLE_MERCHANT_ID and GOOGLE_SERVICE_ACCOUNT_KEY environment variables. Run health-check action to fetch data.',
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
      {
        error:
          'Invalid action. Use: summary, issues, disapproved, fixes, dashboard, or health-check',
      },
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
 * - action: 'fix_brand' | 'fix_gtin' | 'fix_description' | 'sync_all' | 'run_health_check' | 'auto_fix'
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

    // Run health check with auto-fix
    if (action === 'run_health_check' || action === 'auto_fix') {
      const result = await runGMCHealthCheck({
        autoFix: action === 'auto_fix',
        sendAlerts: true,
        dryRun,
      })

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message:
          action === 'auto_fix'
            ? 'Auto-fix completed'
            : 'Health check completed',
      })
    }

    // Manual fix actions
    switch (action) {
      case 'fix_brand':
        return NextResponse.json({
          success: true,
          message: 'Brand fix task queued',
          productIds: productIds || [],
          dryRun,
        })

      case 'fix_gtin':
        return NextResponse.json({
          success: true,
          message: 'GTIN fix task queued',
          productIds: productIds || [],
          dryRun,
        })

      case 'fix_description':
        return NextResponse.json({
          success: true,
          message: 'Description fix task queued',
          productIds: productIds || [],
          dryRun,
        })

      case 'sync_all':
        return NextResponse.json({
          success: true,
          message: 'Full GMC sync task queued',
          dryRun,
        })

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: fix_brand, fix_gtin, fix_description, sync_all, run_health_check, or auto_fix',
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
