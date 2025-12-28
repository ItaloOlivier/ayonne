import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerIdFromCookie } from '@/lib/auth'
import { generateSkinForecast, AnalysisHistoryItem } from '@/lib/skin-analysis/forecast'
import { calculateSkinScores, DetectedCondition } from '@/lib/skin-analysis/scoring'

export async function GET() {
  try {
    const customerId = await getCustomerIdFromCookie()

    if (!customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get last 3 months of analyses for forecasting
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const analyses = await prisma.skinAnalysis.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
        createdAt: { gte: threeMonthsAgo },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        skinType: true,
        conditions: true,
        originalImage: true,
        frontImage: true,
      },
    })

    if (analyses.length === 0) {
      return NextResponse.json({
        error: 'No analyses found',
        message: 'Complete at least one skin analysis to see your forecast',
      }, { status: 404 })
    }

    // Convert to the format expected by the forecast generator
    const analysisHistory: AnalysisHistoryItem[] = analyses.map(a => ({
      id: a.id,
      createdAt: a.createdAt,
      conditions: (a.conditions as unknown as DetectedCondition[]) || [],
      skinType: a.skinType,
    }))

    // Get the latest analysis conditions for current scores
    const latestConditions = analysisHistory[0].conditions

    // Calculate current scores
    const currentScores = calculateSkinScores(latestConditions)

    // Generate the forecast
    const forecast = generateSkinForecast(analysisHistory, currentScores)

    // Get the user's latest photo (prefer frontImage over originalImage)
    const latestPhoto = analyses[0].frontImage || analyses[0].originalImage

    return NextResponse.json({
      success: true,
      forecast,
      latestAnalysisDate: analyses[0].createdAt,
      skinType: analyses[0].skinType,
      latestPhoto,
    })
  } catch (error) {
    console.error('Forecast generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}
