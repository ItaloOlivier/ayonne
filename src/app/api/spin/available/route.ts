import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { hasPendingSpin, getAvailableSpinRewards, SPIN_SEGMENTS } from '@/lib/growth/spin'

export async function GET() {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingSpin = await hasPendingSpin(user.id)
    const availableRewards = await getAvailableSpinRewards(user.id)

    return NextResponse.json({
      success: true,
      canSpin: pendingSpin.hasPending,
      analysisId: pendingSpin.analysisId,
      pendingRewards: availableRewards.map((r) => ({
        code: r.discountCode,
        discountPercent: r.discountPercent,
        expiresAt: r.expiresAt,
        expiresIn: Math.max(0, Math.floor((r.expiresAt.getTime() - Date.now()) / 1000 / 60)), // minutes
      })),
      segments: SPIN_SEGMENTS,
    })
  } catch (error) {
    console.error('Error checking spin availability:', error)
    return NextResponse.json(
      { error: 'Failed to check spin availability' },
      { status: 500 }
    )
  }
}
