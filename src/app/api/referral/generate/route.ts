import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { getOrCreateReferralCode, getReferralStats } from '@/lib/growth/referral'

export async function POST() {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const referralCode = await getOrCreateReferralCode(user.id)

    return NextResponse.json({
      success: true,
      code: referralCode.code,
      shareUrl: `https://ai.ayonne.skin?ref=${referralCode.code}`,
    })
  } catch (error) {
    console.error('Error generating referral code:', error)
    return NextResponse.json(
      { error: 'Failed to generate referral code' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getReferralStats(user.id)
    if (!stats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      ...stats,
      shareUrl: `https://ai.ayonne.skin?ref=${stats.code}`,
    })
  } catch (error) {
    console.error('Error getting referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to get referral stats' },
      { status: 500 }
    )
  }
}
