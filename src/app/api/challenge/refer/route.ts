import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { referFriendToChallenge } from '@/lib/growth/challenge'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await referFriendToChallenge(user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Challenge refer error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process referral' },
      { status: 500 }
    )
  }
}
