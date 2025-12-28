import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { joinChallenge, canJoinChallenge } from '@/lib/growth/challenge'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { analysisId } = await request.json()

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID required to set baseline' },
        { status: 400 }
      )
    }

    // Check if user can join
    const { canJoin, reason } = await canJoinChallenge(user.id)
    if (!canJoin) {
      return NextResponse.json({ success: false, error: reason }, { status: 400 })
    }

    const result = await joinChallenge(user.id, analysisId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Challenge join error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to join challenge' },
      { status: 500 }
    )
  }
}
