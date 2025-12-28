import { NextResponse } from 'next/server'
import { validateDiscountCode } from '@/lib/growth/discount'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const result = await validateDiscountCode(code)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      discountPercent: result.discountPercent,
      type: result.type,
    })
  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    )
  }
}
