import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { recordChallengeAnalysis } from '@/lib/growth/challenge'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { analysisId } = await request.json()

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID required' },
        { status: 400 }
      )
    }

    const result = await recordChallengeAnalysis(user.id, analysisId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Challenge record error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record analysis' },
      { status: 500 }
    )
  }
}
