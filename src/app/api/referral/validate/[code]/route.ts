import { NextResponse } from 'next/server'
import { validateReferralCode } from '@/lib/growth/referral'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const result = await validateReferralCode(code)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      referrerName: result.referrerName,
      discountPercent: result.discountPercent,
    })
  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    )
  }
}
