import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { spin, SPIN_SEGMENTS } from '@/lib/growth/spin'

export async function POST(request: Request) {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { analysisId } = await request.json()
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    const result = await spin(user.id, analysisId)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          existingReward: result.existingReward
            ? {
                discountPercent: result.existingReward.discountPercent,
                code: result.existingReward.discountCode,
                expiresAt: result.existingReward.expiresAt,
              }
            : null,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      prize: result.prize,
      segmentIndex: result.segmentIndex,
      segments: SPIN_SEGMENTS, // Send segments for animation
    })
  } catch (error) {
    console.error('Error spinning wheel:', error)
    return NextResponse.json(
      { error: 'Failed to spin wheel' },
      { status: 500 }
    )
  }
}
