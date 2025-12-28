import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { applyReferral } from '@/lib/growth/referral'

export async function POST(request: Request) {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    const result = await applyReferral(code, user.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      discountCode: result.discountCode?.code,
      discountPercent: result.discountPercent,
      message: `You got ${result.discountPercent}% off your first order!`,
    })
  } catch (error) {
    console.error('Error applying referral:', error)
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    )
  }
}
