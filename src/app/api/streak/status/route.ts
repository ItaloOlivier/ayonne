import { NextResponse } from 'next/server'
import { requireAuth, notFoundResponse, serverErrorResponse } from '@/lib/api-helpers'
import { getStreakStatus, getWeeklyAnalysisCount } from '@/lib/growth/streak'

export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const streakStatus = await getStreakStatus(user.id)
    const weeklyProgress = await getWeeklyAnalysisCount(user.id)

    if (!streakStatus) {
      return notFoundResponse('User')
    }

    return NextResponse.json({
      success: true,
      ...streakStatus,
      weeklyProgress,
    })
  } catch (error) {
    console.error('Error getting streak status:', error)
    return serverErrorResponse('Failed to get streak status')
  }
}
