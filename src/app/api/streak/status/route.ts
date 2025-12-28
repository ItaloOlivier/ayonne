import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { getStreakStatus, getWeeklyAnalysisCount } from '@/lib/growth/streak'

export async function GET() {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const streakStatus = await getStreakStatus(user.id)
    const weeklyProgress = await getWeeklyAnalysisCount(user.id)

    if (!streakStatus) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      ...streakStatus,
      weeklyProgress,
    })
  } catch (error) {
    console.error('Error getting streak status:', error)
    return NextResponse.json(
      { error: 'Failed to get streak status' },
      { status: 500 }
    )
  }
}
