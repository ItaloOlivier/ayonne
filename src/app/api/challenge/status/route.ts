import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { getChallengeStatus, canJoinChallenge } from '@/lib/growth/challenge'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getChallengeStatus(user.id)

    if (!status) {
      const { canJoin } = await canJoinChallenge(user.id)
      return NextResponse.json({
        success: true,
        enrolled: false,
        canJoin,
      })
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      ...status,
    })
  } catch (error) {
    console.error('Challenge status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get challenge status' },
      { status: 500 }
    )
  }
}
