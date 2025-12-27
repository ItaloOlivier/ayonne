import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

// Condition weights for calculating skin health score
const CONDITION_WEIGHTS: Record<string, number> = {
  acne: 15,
  wrinkles: 12,
  dark_spots: 10,
  fine_lines: 8,
  redness: 10,
  dryness: 8,
  oiliness: 6,
  dark_circles: 7,
  enlarged_pores: 6,
  large_pores: 6,
  sun_damage: 10,
  dullness: 5,
  uneven_texture: 6,
  dehydration: 7,
}

function calculateHealthScore(conditions: DetectedCondition[]): number {
  let totalDeduction = 0

  for (const condition of conditions) {
    const weight = CONDITION_WEIGHTS[condition.id] || 5
    totalDeduction += condition.confidence * weight
  }

  return Math.max(0, Math.round(100 - totalDeduction))
}

function getPeriodStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7))
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1))
    case '3months':
      return new Date(now.setMonth(now.getMonth() - 3))
    case 'all':
    default:
      return new Date(0) // Beginning of time
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const period = searchParams.get('period') || 'month'

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const startDate = getPeriodStartDate(period)

    // Get all analyses in the period
    const analyses = await prisma.skinAnalysis.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        createdAt: true,
        skinType: true,
        conditions: true,
      },
    })

    if (analyses.length === 0) {
      return NextResponse.json({
        conditions: {},
        scores: [],
        overallImprovement: 0,
        analysisCount: 0,
      })
    }

    // Build condition trends
    const conditionTrends: Record<string, { dates: string[]; scores: number[]; name: string }> = {}
    const healthScores: { date: string; score: number }[] = []

    for (const analysis of analyses) {
      const conditions = analysis.conditions as DetectedCondition[]
      const dateStr = analysis.createdAt.toISOString().split('T')[0]

      // Calculate health score for this analysis
      const healthScore = calculateHealthScore(conditions)
      healthScores.push({ date: dateStr, score: healthScore })

      // Track each condition
      for (const condition of conditions) {
        if (!conditionTrends[condition.id]) {
          conditionTrends[condition.id] = {
            dates: [],
            scores: [],
            name: condition.name,
          }
        }
        conditionTrends[condition.id].dates.push(dateStr)
        conditionTrends[condition.id].scores.push(Math.round(condition.confidence * 100))
      }
    }

    // Calculate overall improvement (first score vs latest score)
    let overallImprovement = 0
    if (healthScores.length >= 2) {
      const firstScore = healthScores[0].score
      const latestScore = healthScores[healthScores.length - 1].score
      overallImprovement = latestScore - firstScore
    }

    // Get the most recent skin type
    const latestSkinType = analyses[analyses.length - 1].skinType

    return NextResponse.json({
      conditions: conditionTrends,
      scores: healthScores,
      overallImprovement,
      analysisCount: analyses.length,
      latestSkinType,
      period,
    })
  } catch (error) {
    console.error('Trends fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    )
  }
}
