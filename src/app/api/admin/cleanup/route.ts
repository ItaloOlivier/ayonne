import { NextResponse } from 'next/server'
import { cleanupOrphanedData, getOrphanedDataStats } from '@/lib/cleanup'

// Simple admin key check
function isAdminRequest(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_API_KEY
  return !!expectedKey && adminKey === expectedKey
}

/**
 * GET: Get statistics about orphaned data that would be cleaned up
 */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await getOrphanedDataStats()

    return NextResponse.json({
      success: true,
      stats,
      message: `Found ${stats.orphanedGuestSessions} guest sessions and ${stats.orphanedAnalyses} analyses to clean up`,
    })
  } catch (error) {
    console.error('Error getting cleanup stats:', error)
    return NextResponse.json(
      { error: 'Failed to get cleanup stats' },
      { status: 500 }
    )
  }
}

/**
 * POST: Run the cleanup process
 * This should be called by a cron job (e.g., Railway cron, Vercel cron, or external service)
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await cleanupOrphanedData()

    console.log('Cleanup completed:', result)

    return NextResponse.json({
      success: true,
      result,
      message: `Cleaned up ${result.guestSessionsDeleted} guest sessions, ${result.analysesDeleted} analyses, and ${result.imagesDeleted} images`,
    })
  } catch (error) {
    console.error('Error running cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to run cleanup' },
      { status: 500 }
    )
  }
}
