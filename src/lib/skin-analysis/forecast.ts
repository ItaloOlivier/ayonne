/**
 * Skin Forecast System
 *
 * Generates 30/60/90 day projections based on:
 * - Historical skin analysis trends
 * - Condition reversibility rates
 * - User's analysis consistency
 */

import { DetectedCondition, SkinScores } from './scoring'

export interface ConditionProjection {
  id: string
  name: string
  currentConfidence: number
  projectedConfidence30: number
  projectedConfidence60: number
  projectedConfidence90: number
  clearByDay: number | null
  improvementRate: 'fast' | 'moderate' | 'slow' | 'stagnant'
}

export interface SkinForecast {
  currentSkinAge: number
  projectedSkinAge30: number
  projectedSkinAge60: number
  projectedSkinAge90: number
  achievableSkinAge: number

  currentQualityScore: number
  projectedQualityScore30: number
  projectedQualityScore60: number
  projectedQualityScore90: number

  categories: {
    hydration: { current: number; projected90: number }
    clarity: { current: number; projected90: number }
    texture: { current: number; projected90: number }
    radiance: { current: number; projected90: number }
  }

  conditionProjections: ConditionProjection[]
  warnings: ForecastWarning[]
  recommendations: ForecastRecommendation[]

  analysisCount: number
  consistencyScore: number
  confidenceLevel: 'high' | 'medium' | 'low'
}

export interface ForecastWarning {
  type: 'seasonal' | 'product' | 'behavior' | 'plateau'
  title: string
  description: string
  icon: string
}

export interface ForecastRecommendation {
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  productSuggestion?: string
}

const CONDITION_IMPROVEMENT_RATES: Record<string, {
  dailyRate: number
  maxImprovement: number
  clearable: boolean
}> = {
  acne: { dailyRate: 0.012, maxImprovement: 0.85, clearable: true },
  redness: { dailyRate: 0.008, maxImprovement: 0.70, clearable: false },
  dryness: { dailyRate: 0.015, maxImprovement: 0.90, clearable: true },
  oiliness: { dailyRate: 0.006, maxImprovement: 0.50, clearable: false },
  dark_spots: { dailyRate: 0.007, maxImprovement: 0.80, clearable: true },
  fine_lines: { dailyRate: 0.005, maxImprovement: 0.60, clearable: false },
  wrinkles: { dailyRate: 0.003, maxImprovement: 0.40, clearable: false },
  dark_circles: { dailyRate: 0.004, maxImprovement: 0.45, clearable: false },
  enlarged_pores: { dailyRate: 0.005, maxImprovement: 0.55, clearable: false },
  large_pores: { dailyRate: 0.005, maxImprovement: 0.55, clearable: false },
  dullness: { dailyRate: 0.020, maxImprovement: 0.90, clearable: true },
  uneven_texture: { dailyRate: 0.008, maxImprovement: 0.70, clearable: true },
  dehydration: { dailyRate: 0.025, maxImprovement: 0.95, clearable: true },
  sun_damage: { dailyRate: 0.004, maxImprovement: 0.50, clearable: false },
}

const AGING_IMPACT: Record<string, number> = {
  fine_lines: 3,
  wrinkles: 6,
  dark_spots: 4,
  dullness: 3,
  uneven_texture: 2,
  dehydration: 2,
  dark_circles: 2,
  sun_damage: 4,
}

const QUALITY_IMPACT: Record<string, number> = {
  acne: 18,
  redness: 12,
  oiliness: 8,
  dryness: 10,
  large_pores: 8,
  enlarged_pores: 8,
  dehydration: 10,
  uneven_texture: 8,
  dullness: 6,
}

export interface AnalysisHistoryItem {
  id: string
  createdAt: Date
  conditions: DetectedCondition[]
  skinType: string | null
}

function calculateConsistencyScore(analyses: AnalysisHistoryItem[]): number {
  if (analyses.length < 2) return 0

  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  let totalGap = 0
  for (let i = 1; i < sortedAnalyses.length; i++) {
    const gap = new Date(sortedAnalyses[i].createdAt).getTime() -
                new Date(sortedAnalyses[i - 1].createdAt).getTime()
    totalGap += gap
  }
  const avgGapDays = (totalGap / (sortedAnalyses.length - 1)) / (1000 * 60 * 60 * 24)

  if (avgGapDays <= 7) return 100
  if (avgGapDays <= 14) return 85
  if (avgGapDays <= 21) return 70
  if (avgGapDays <= 30) return 55
  if (avgGapDays <= 60) return 40
  return 25
}

function calculateHistoricalTrend(
  conditionId: string,
  analyses: AnalysisHistoryItem[]
): number {
  if (analyses.length < 2) return 0

  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  let firstConfidence: number | null = null
  let lastConfidence: number | null = null
  let firstDate: Date | null = null
  let lastDate: Date | null = null

  for (const analysis of sortedAnalyses) {
    const condition = analysis.conditions.find(c => c.id === conditionId)
    if (condition) {
      if (firstConfidence === null) {
        firstConfidence = condition.confidence
        firstDate = new Date(analysis.createdAt)
      }
      lastConfidence = condition.confidence
      lastDate = new Date(analysis.createdAt)
    }
  }

  if (firstConfidence === null || lastConfidence === null || !firstDate || !lastDate) {
    return 0
  }

  const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysDiff < 1) return 0

  return (lastConfidence - firstConfidence) / daysDiff
}

function projectConditionConfidence(
  conditionId: string,
  currentConfidence: number,
  historicalRate: number,
  consistencyScore: number,
  days: number
): number {
  const baseRate = CONDITION_IMPROVEMENT_RATES[conditionId] || {
    dailyRate: 0.005,
    maxImprovement: 0.5,
    clearable: false,
  }

  const consistencyWeight = consistencyScore / 100
  let blendedRate: number

  if (historicalRate < 0) {
    blendedRate = (historicalRate * consistencyWeight * 0.6) +
                  (-baseRate.dailyRate * (1 - consistencyWeight * 0.4))
  } else {
    blendedRate = (-baseRate.dailyRate * 0.5) * (consistencyScore / 100)
  }

  let projectedConfidence = currentConfidence + (blendedRate * days)

  const minConfidence = currentConfidence * (1 - baseRate.maxImprovement)
  projectedConfidence = Math.max(projectedConfidence, baseRate.clearable ? 0 : minConfidence)

  return Math.max(0, Math.min(1, projectedConfidence))
}

function calculateClearDay(
  conditionId: string,
  currentConfidence: number,
  historicalRate: number,
  consistencyScore: number
): number | null {
  const baseRate = CONDITION_IMPROVEMENT_RATES[conditionId]
  if (!baseRate?.clearable) return null
  if (currentConfidence < 0.15) return 0

  for (let day = 1; day <= 180; day += 5) {
    const projected = projectConditionConfidence(
      conditionId, currentConfidence, historicalRate, consistencyScore, day
    )
    if (projected < 0.15) {
      for (let d = day - 4; d <= day; d++) {
        const refined = projectConditionConfidence(
          conditionId, currentConfidence, historicalRate, consistencyScore, d
        )
        if (refined < 0.15) return d
      }
      return day
    }
  }

  return null
}

function calculateProjectedSkinAge(
  conditions: ConditionProjection[],
  baseAge: number,
  day: 30 | 60 | 90
): number {
  let totalYearsAdded = 0

  for (const condition of conditions) {
    const agingImpact = AGING_IMPACT[condition.id]
    if (agingImpact) {
      const projectedConfidence = day === 30
        ? condition.projectedConfidence30
        : day === 60
        ? condition.projectedConfidence60
        : condition.projectedConfidence90
      totalYearsAdded += agingImpact * projectedConfidence
    }
  }

  return Math.round(baseAge + totalYearsAdded)
}

function calculateProjectedQualityScore(
  conditions: ConditionProjection[],
  day: 30 | 60 | 90
): number {
  let totalDeduction = 0

  for (const condition of conditions) {
    const qualityImpact = QUALITY_IMPACT[condition.id]
    if (qualityImpact) {
      const projectedConfidence = day === 30
        ? condition.projectedConfidence30
        : day === 60
        ? condition.projectedConfidence60
        : condition.projectedConfidence90
      totalDeduction += qualityImpact * projectedConfidence
    }
  }

  return Math.max(0, Math.round(100 - totalDeduction))
}

function generateWarnings(
  conditions: DetectedCondition[],
  consistencyScore: number
): ForecastWarning[] {
  const warnings: ForecastWarning[] = []
  const now = new Date()
  const month = now.getMonth()

  if (month >= 10 || month <= 2) {
    const hasDryness = conditions.some(c => c.id === 'dryness' || c.id === 'dehydration')
    if (hasDryness) {
      warnings.push({
        type: 'seasonal',
        title: 'Winter dryness incoming',
        description: 'Oct-Feb is harsh on dry skin. Increase moisturizer and consider a humidifier.',
        icon: '❄️',
      })
    }
  }

  if (month >= 5 && month <= 8) {
    const hasOiliness = conditions.some(c => c.id === 'oiliness')
    if (hasOiliness) {
      warnings.push({
        type: 'seasonal',
        title: 'Summer oil production peak',
        description: 'Heat increases sebum production. Use lightweight, non-comedogenic products.',
        icon: '☀️',
      })
    }
  }

  const hasSensitivity = conditions.some(c => c.id === 'redness' && c.confidence > 0.5)
  if (hasSensitivity) {
    warnings.push({
      type: 'product',
      title: 'Sensitive to over-exfoliation',
      description: 'Your skin shows signs of sensitivity. Limit exfoliating products to 2x/week max.',
      icon: '⚠️',
    })
  }

  const hasAging = conditions.some(c => ['fine_lines', 'wrinkles', 'dark_spots'].includes(c.id))
  const hasAcne = conditions.some(c => c.id === 'acne')
  if (hasAging && hasAcne) {
    warnings.push({
      type: 'product',
      title: 'Retinol purge expected',
      description: 'If starting retinol for anti-aging, expect a purge period around days 14-21.',
      icon: '💊',
    })
  }

  if (consistencyScore < 50) {
    warnings.push({
      type: 'behavior',
      title: 'Irregular tracking',
      description: 'Weekly skin checks help us give better forecasts. Try to analyze at least once a week.',
      icon: '📅',
    })
  }

  const stubbornConditions = conditions.filter(c => c.confidence > 0.6)
  if (stubbornConditions.length >= 3) {
    warnings.push({
      type: 'plateau',
      title: 'Consider professional help',
      description: 'Multiple persistent concerns may benefit from a dermatologist consultation.',
      icon: '👩‍⚕️',
    })
  }

  return warnings
}

function generateRecommendations(
  conditions: DetectedCondition[],
  currentScores: SkinScores
): ForecastRecommendation[] {
  const recommendations: ForecastRecommendation[] = []

  if (currentScores.categories.hydration < 70) {
    recommendations.push({
      priority: 'high',
      title: 'Add hyaluronic acid serum',
      description: 'Apply before moisturizer on damp skin for deep hydration.',
      productSuggestion: 'hyaluronic-acid-serum',
    })
  }

  const hasTextureIssues = conditions.some(c =>
    ['uneven_texture', 'enlarged_pores', 'dullness'].includes(c.id) && c.confidence > 0.4
  )
  const hasSensitivity = conditions.some(c => c.id === 'redness' && c.confidence > 0.4)

  if (hasTextureIssues && hasSensitivity) {
    recommendations.push({
      priority: 'medium',
      title: 'Gentle exfoliation only',
      description: 'Reduce exfoliation to 1-2x/week with a mild AHA (lactic acid).',
      productSuggestion: 'gentle-exfoliating-toner',
    })
  } else if (hasTextureIssues) {
    recommendations.push({
      priority: 'medium',
      title: 'Regular exfoliation',
      description: 'Exfoliate 2-3x/week with BHA for pores or AHA for texture.',
      productSuggestion: 'aha-bha-exfoliant',
    })
  }

  const hasDarkSpots = conditions.some(c => c.id === 'dark_spots' && c.confidence > 0.3)
  const hasSunDamage = conditions.some(c => c.id === 'sun_damage')
  if (hasDarkSpots || hasSunDamage) {
    recommendations.push({
      priority: 'high',
      title: 'Upgrade to SPF 50',
      description: 'SPF 30 may not be enough. Use SPF 50+ and reapply every 2 hours outdoors.',
      productSuggestion: 'spf-50-sunscreen',
    })
  }

  if (currentScores.skinAge > currentScores.achievableSkinAge + 3) {
    recommendations.push({
      priority: 'medium',
      title: 'Start retinol routine',
      description: 'Begin with 0.25% retinol 2x/week, gradually increasing to nightly.',
      productSuggestion: 'retinol-serum',
    })
  }

  if (currentScores.categories.radiance < 60) {
    recommendations.push({
      priority: 'medium',
      title: 'Add Vitamin C',
      description: 'Morning Vitamin C serum boosts radiance and fights dark spots.',
      productSuggestion: 'vitamin-c-serum',
    })
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations.slice(0, 4)
}

function calculateCategoryProjections(
  conditionProjections: ConditionProjection[]
): SkinForecast['categories'] {
  const categoryMappings: Record<string, string[]> = {
    hydration: ['dryness', 'dehydration'],
    clarity: ['acne', 'dark_spots', 'redness'],
    texture: ['large_pores', 'enlarged_pores', 'uneven_texture', 'acne'],
    radiance: ['dullness', 'dark_circles', 'dehydration'],
  }

  const categories: SkinForecast['categories'] = {
    hydration: { current: 100, projected90: 100 },
    clarity: { current: 100, projected90: 100 },
    texture: { current: 100, projected90: 100 },
    radiance: { current: 100, projected90: 100 },
  }

  for (const [category, conditionIds] of Object.entries(categoryMappings)) {
    let currentDeduction = 0
    let projected90Deduction = 0

    for (const conditionId of conditionIds) {
      const projection = conditionProjections.find(p => p.id === conditionId)
      if (projection) {
        currentDeduction += projection.currentConfidence * 25
        projected90Deduction += projection.projectedConfidence90 * 25
      }
    }

    categories[category as keyof typeof categories] = {
      current: Math.max(0, Math.round(100 - currentDeduction)),
      projected90: Math.max(0, Math.round(100 - projected90Deduction)),
    }
  }

  return categories
}

export function generateSkinForecast(
  analyses: AnalysisHistoryItem[],
  currentScores: SkinScores,
  userAge: number = 30
): SkinForecast {
  if (analyses.length === 0) {
    throw new Error('At least one analysis is required to generate a forecast')
  }

  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const latestAnalysis = sortedAnalyses[0]
  const currentConditions = latestAnalysis.conditions

  const consistencyScore = calculateConsistencyScore(analyses)

  const conditionProjections: ConditionProjection[] = currentConditions.map(condition => {
    const historicalRate = calculateHistoricalTrend(condition.id, analyses)
    const clearByDay = calculateClearDay(condition.id, condition.confidence, historicalRate, consistencyScore)

    const projected30 = projectConditionConfidence(condition.id, condition.confidence, historicalRate, consistencyScore, 30)
    const projected60 = projectConditionConfidence(condition.id, condition.confidence, historicalRate, consistencyScore, 60)
    const projected90 = projectConditionConfidence(condition.id, condition.confidence, historicalRate, consistencyScore, 90)

    const improvement30 = condition.confidence - projected30
    let improvementRate: ConditionProjection['improvementRate']
    if (improvement30 >= 0.20) improvementRate = 'fast'
    else if (improvement30 >= 0.10) improvementRate = 'moderate'
    else if (improvement30 >= 0.03) improvementRate = 'slow'
    else improvementRate = 'stagnant'

    return {
      id: condition.id,
      name: condition.name,
      currentConfidence: condition.confidence,
      projectedConfidence30: projected30,
      projectedConfidence60: projected60,
      projectedConfidence90: projected90,
      clearByDay,
      improvementRate,
    }
  })

  const currentSkinAge = currentScores.skinAge
  const projectedSkinAge30 = calculateProjectedSkinAge(conditionProjections, userAge, 30)
  const projectedSkinAge60 = calculateProjectedSkinAge(conditionProjections, userAge, 60)
  const projectedSkinAge90 = calculateProjectedSkinAge(conditionProjections, userAge, 90)

  const currentQualityScore = currentScores.qualityScore
  const projectedQualityScore30 = calculateProjectedQualityScore(conditionProjections, 30)
  const projectedQualityScore60 = calculateProjectedQualityScore(conditionProjections, 60)
  const projectedQualityScore90 = calculateProjectedQualityScore(conditionProjections, 90)

  const categories = calculateCategoryProjections(conditionProjections)

  const warnings = generateWarnings(currentConditions, consistencyScore)
  const recommendations = generateRecommendations(currentConditions, currentScores)

  let confidenceLevel: SkinForecast['confidenceLevel']
  if (analyses.length >= 5 && consistencyScore >= 70) confidenceLevel = 'high'
  else if (analyses.length >= 3 && consistencyScore >= 50) confidenceLevel = 'medium'
  else confidenceLevel = 'low'

  return {
    currentSkinAge,
    projectedSkinAge30,
    projectedSkinAge60,
    projectedSkinAge90,
    achievableSkinAge: currentScores.achievableSkinAge,

    currentQualityScore,
    projectedQualityScore30,
    projectedQualityScore60,
    projectedQualityScore90,

    categories,
    conditionProjections,

    warnings,
    recommendations,

    analysisCount: analyses.length,
    consistencyScore,
    confidenceLevel,
  }
}
