import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { shareTransformation } from '@/lib/growth/challenge'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentCustomer()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await shareTransformation(user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Challenge share error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to share transformation' },
      { status: 500 }
    )
  }
}
