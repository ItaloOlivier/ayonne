import { NextRequest, NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { SkinGoal } from '@prisma/client'

const VALID_GOALS: SkinGoal[] = ['AGE_NORMALLY', 'AGE_GRACEFULLY', 'STAY_YOUNG_FOREVER']

// GET - Retrieve current skin goal
export async function GET() {
  try {
    const customer = await getCurrentCustomer()

    if (!customer) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      skinGoal: customer.skinGoal || 'AGE_GRACEFULLY',
    })
  } catch (error) {
    console.error('Get skin goal error:', error)
    return NextResponse.json(
      { error: 'Failed to get skin goal' },
      { status: 500 }
    )
  }
}

// PATCH - Update skin goal
export async function PATCH(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer()

    if (!customer) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { skinGoal } = body

    if (!skinGoal || !VALID_GOALS.includes(skinGoal)) {
      return NextResponse.json(
        { error: 'Invalid skin goal. Must be AGE_NORMALLY, AGE_GRACEFULLY, or STAY_YOUNG_FOREVER' },
        { status: 400 }
      )
    }

    // Update the customer's skin goal
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: { skinGoal },
      select: { skinGoal: true },
    })

    return NextResponse.json({
      success: true,
      skinGoal: updatedCustomer.skinGoal,
    })
  } catch (error) {
    console.error('Update skin goal error:', error)
    return NextResponse.json(
      { error: 'Failed to update skin goal' },
      { status: 500 }
    )
  }
}
