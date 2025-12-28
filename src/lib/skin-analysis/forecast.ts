/**
 * Skin Forecast System
 *
 * Generates 30/60/90 day projections based on:
 * - Historical skin analysis trends
 * - Condition reversibility rates WITH proper skincare products
 * - Natural degradation WITHOUT product intervention
 *
 * IMPORTANT: Improvements only happen with proper product usage.
 * Without products, skin naturally ages and conditions worsen.
 */

import { DetectedCondition, SkinScores } from './scoring'

export interface ProductForCondition {
  slug: string
  name: string
  price: number
  imageUrl?: string
  effectiveness: number // 0-1, how effective for this condition
}

export interface ConditionProjection {
  id: string
  name: string
  currentConfidence: number

  // WITHOUT products (natural degradation)
  withoutProducts: {
    projected30: number
    projected60: number
    projected90: number
    message: string
  }

  // WITH Ayonne products
  withProducts: {
    projected30: number
    projected60: number
    projected90: number
    clearByDay: number | null
    improvementRate: 'fast' | 'moderate' | 'slow'
  }

  // Product that helps this condition
  recommendedProduct: ProductForCondition | null
}

export interface SkinForecast {
  // WITHOUT products (what will happen naturally)
  withoutProducts: {
    skinAge30: number
    skinAge60: number
    skinAge90: number
    qualityScore30: number
    qualityScore60: number
    qualityScore90: number
    message: string
  }

  // WITH Ayonne products
  withProducts: {
    skinAge30: number
    skinAge60: number
    skinAge90: number
    achievableSkinAge: number
    qualityScore30: number
    qualityScore60: number
    qualityScore90: number
  }

  currentSkinAge: number
  currentQualityScore: number

  categories: {
    hydration: { current: number; withoutProducts90: number; withProducts90: number }
    clarity: { current: number; withoutProducts90: number; withProducts90: number }
    texture: { current: number; withoutProducts90: number; withProducts90: number }
    radiance: { current: number; withoutProducts90: number; withProducts90: number }
  }

  conditionProjections: ConditionProjection[]
  warnings: ForecastWarning[]

  // Products needed for the "with products" forecast
  recommendedProducts: ProductForCondition[]
  totalProductCost: number

  analysisCount: number
  consistencyScore: number
  confidenceLevel: 'high' | 'medium' | 'low'
}

export interface ForecastWarning {
  type: 'seasonal' | 'product' | 'behavior' | 'degradation'
  title: string
  description: string
  icon: string
}

// Natural degradation rates per day (skin gets worse without intervention)
const NATURAL_DEGRADATION_RATES: Record<string, number> = {
  acne: 0.002,           // Can get slightly worse
  redness: 0.001,        // Stays stable or slightly worse
  dryness: 0.004,        // Gets worse without moisturizer
  oiliness: 0.001,       // Stays relatively stable
  dark_spots: 0.003,     // Gets worse with sun exposure
  fine_lines: 0.005,     // Natural aging
  wrinkles: 0.004,       // Natural aging
  dark_circles: 0.002,   // Can worsen with stress/age
  enlarged_pores: 0.002, // Can worsen
  large_pores: 0.002,
  dullness: 0.006,       // Gets worse without exfoliation
  uneven_texture: 0.003, // Gets worse without care
  dehydration: 0.008,    // Gets worse without hydration
  sun_damage: 0.004,     // Accumulates over time
}

// Improvement rates WITH proper Ayonne products
const PRODUCT_IMPROVEMENT_RATES: Record<string, {
  dailyRate: number
  maxImprovement: number
  clearable: boolean
}> = {
  acne: { dailyRate: 0.015, maxImprovement: 0.85, clearable: true },
  redness: { dailyRate: 0.010, maxImprovement: 0.70, clearable: false },
  dryness: { dailyRate: 0.020, maxImprovement: 0.90, clearable: true },
  oiliness: { dailyRate: 0.008, maxImprovement: 0.50, clearable: false },
  dark_spots: { dailyRate: 0.008, maxImprovement: 0.80, clearable: true },
  fine_lines: { dailyRate: 0.006, maxImprovement: 0.60, clearable: false },
  wrinkles: { dailyRate: 0.004, maxImprovement: 0.40, clearable: false },
  dark_circles: { dailyRate: 0.005, maxImprovement: 0.45, clearable: false },
  enlarged_pores: { dailyRate: 0.006, maxImprovement: 0.55, clearable: false },
  large_pores: { dailyRate: 0.006, maxImprovement: 0.55, clearable: false },
  dullness: { dailyRate: 0.025, maxImprovement: 0.90, clearable: true },
  uneven_texture: { dailyRate: 0.010, maxImprovement: 0.70, clearable: true },
  dehydration: { dailyRate: 0.030, maxImprovement: 0.95, clearable: true },
  sun_damage: { dailyRate: 0.005, maxImprovement: 0.50, clearable: false },
}

// Products that address each condition
const CONDITION_PRODUCTS: Record<string, ProductForCondition> = {
  acne: {
    slug: 'salicylic-acid-cleanser',
    name: 'Salicylic Acid Cleanser',
    price: 24.99,
    effectiveness: 0.85,
  },
  redness: {
    slug: 'calming-serum',
    name: 'Calming Centella Serum',
    price: 34.99,
    effectiveness: 0.70,
  },
  dryness: {
    slug: 'hyaluronic-acid-moisturizer',
    name: 'Hyaluronic Acid Moisturizer',
    price: 32.99,
    effectiveness: 0.90,
  },
  oiliness: {
    slug: 'niacinamide-serum',
    name: 'Niacinamide Oil Control Serum',
    price: 28.99,
    effectiveness: 0.65,
  },
  dark_spots: {
    slug: 'vitamin-c-serum',
    name: 'Vitamin C Brightening Serum',
    price: 38.99,
    effectiveness: 0.80,
  },
  fine_lines: {
    slug: 'retinol-serum',
    name: 'Retinol Anti-Aging Serum',
    price: 44.99,
    effectiveness: 0.70,
  },
  wrinkles: {
    slug: 'retinol-serum',
    name: 'Retinol Anti-Aging Serum',
    price: 44.99,
    effectiveness: 0.55,
  },
  dark_circles: {
    slug: 'eye-cream',
    name: 'Brightening Eye Cream',
    price: 36.99,
    effectiveness: 0.60,
  },
  enlarged_pores: {
    slug: 'pore-minimizing-toner',
    name: 'Pore Minimizing Toner',
    price: 26.99,
    effectiveness: 0.65,
  },
  large_pores: {
    slug: 'pore-minimizing-toner',
    name: 'Pore Minimizing Toner',
    price: 26.99,
    effectiveness: 0.65,
  },
  dullness: {
    slug: 'vitamin-c-serum',
    name: 'Vitamin C Brightening Serum',
    price: 38.99,
    effectiveness: 0.85,
  },
  uneven_texture: {
    slug: 'aha-bha-exfoliant',
    name: 'AHA/BHA Exfoliating Solution',
    price: 29.99,
    effectiveness: 0.75,
  },
  dehydration: {
    slug: 'hyaluronic-acid-serum',
    name: 'Hyaluronic Acid Serum',
    price: 34.99,
    effectiveness: 0.90,
  },
  sun_damage: {
    slug: 'spf-50-sunscreen',
    name: 'SPF 50 Daily Sunscreen',
    price: 28.99,
    effectiveness: 0.60,
  },
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

function projectWithoutProducts(
  conditionId: string,
  currentConfidence: number,
  days: number
): number {
  const degradationRate = NATURAL_DEGRADATION_RATES[conditionId] || 0.002
  const projected = currentConfidence + (degradationRate * days)
  return Math.min(1, projected) // Cap at 100%
}

function projectWithProducts(
  conditionId: string,
  currentConfidence: number,
  consistencyScore: number,
  days: number
): number {
  const rates = PRODUCT_IMPROVEMENT_RATES[conditionId] || {
    dailyRate: 0.005,
    maxImprovement: 0.5,
    clearable: false,
  }

  // Effectiveness scales with tracking consistency
  const effectivenessMultiplier = 0.5 + (consistencyScore / 100) * 0.5

  const dailyImprovement = rates.dailyRate * effectivenessMultiplier
  let projected = currentConfidence - (dailyImprovement * days)

  const minConfidence = currentConfidence * (1 - rates.maxImprovement)
  projected = Math.max(projected, rates.clearable ? 0 : minConfidence)

  return Math.max(0, projected)
}

function calculateClearDay(
  conditionId: string,
  currentConfidence: number,
  consistencyScore: number
): number | null {
  const rates = PRODUCT_IMPROVEMENT_RATES[conditionId]
  if (!rates?.clearable) return null
  if (currentConfidence < 0.15) return 0 // Already clear

  for (let day = 1; day <= 180; day += 5) {
    const projected = projectWithProducts(conditionId, currentConfidence, consistencyScore, day)
    if (projected < 0.15) {
      // Refine to exact day
      for (let d = day - 4; d <= day; d++) {
        const refined = projectWithProducts(conditionId, currentConfidence, consistencyScore, d)
        if (refined < 0.15) return d
      }
      return day
    }
  }

  return null
}

function getDegradationMessage(conditionId: string): string {
  const messages: Record<string, string> = {
    acne: 'Breakouts may spread without treatment',
    redness: 'Irritation can become chronic',
    dryness: 'Skin barrier will weaken over time',
    oiliness: 'May lead to enlarged pores and breakouts',
    dark_spots: 'Sun exposure will darken existing spots',
    fine_lines: 'Natural aging will deepen lines',
    wrinkles: 'Wrinkles will become more pronounced',
    dark_circles: 'May worsen with stress and fatigue',
    enlarged_pores: 'Pores will appear larger over time',
    large_pores: 'Pores will appear larger over time',
    dullness: 'Skin will lose radiance without exfoliation',
    uneven_texture: 'Texture will become rougher',
    dehydration: 'Skin will become more parched',
    sun_damage: 'UV damage accumulates daily',
  }
  return messages[conditionId] || 'Condition may worsen without care'
}

function calculateSkinAgeFromConditions(
  conditions: ConditionProjection[],
  baseAge: number,
  scenario: 'withoutProducts' | 'withProducts',
  day: 30 | 60 | 90
): number {
  let totalYearsAdded = 0

  for (const condition of conditions) {
    const agingImpact = AGING_IMPACT[condition.id]
    if (agingImpact) {
      const confidence = scenario === 'withoutProducts'
        ? condition.withoutProducts[`projected${day}` as keyof typeof condition.withoutProducts]
        : condition.withProducts[`projected${day}` as keyof typeof condition.withProducts]

      if (typeof confidence === 'number') {
        totalYearsAdded += agingImpact * confidence
      }
    }
  }

  return Math.round(baseAge + totalYearsAdded)
}

function calculateQualityScoreFromConditions(
  conditions: ConditionProjection[],
  scenario: 'withoutProducts' | 'withProducts',
  day: 30 | 60 | 90
): number {
  let totalDeduction = 0

  for (const condition of conditions) {
    const qualityImpact = QUALITY_IMPACT[condition.id]
    if (qualityImpact) {
      const confidence = scenario === 'withoutProducts'
        ? condition.withoutProducts[`projected${day}` as keyof typeof condition.withoutProducts]
        : condition.withProducts[`projected${day}` as keyof typeof condition.withProducts]

      if (typeof confidence === 'number') {
        totalDeduction += qualityImpact * confidence
      }
    }
  }

  return Math.max(0, Math.round(100 - totalDeduction))
}

function generateWarnings(
  conditions: DetectedCondition[],
  consistencyScore: number
): ForecastWarning[] {
  const warnings: ForecastWarning[] = []

  // Always warn about natural degradation
  warnings.push({
    type: 'degradation',
    title: 'Skin ages without proper care',
    description: 'Without targeted skincare, skin naturally loses collagen and elasticity. The "Without Products" forecast shows what happens without intervention.',
    icon: '⚠️',
  })

  const now = new Date()
  const month = now.getMonth()

  // Seasonal warnings
  if (month >= 10 || month <= 2) {
    const hasDryness = conditions.some(c => c.id === 'dryness' || c.id === 'dehydration')
    if (hasDryness) {
      warnings.push({
        type: 'seasonal',
        title: 'Winter dryness incoming',
        description: 'Oct-Feb is harsh on dry skin. Our Hyaluronic Acid Moisturizer provides 72-hour hydration.',
        icon: '❄️',
      })
    }
  }

  if (month >= 5 && month <= 8) {
    warnings.push({
      type: 'seasonal',
      title: 'Summer sun damage risk',
      description: 'UV exposure accelerates aging and dark spots. Daily SPF is essential.',
      icon: '☀️',
    })
  }

  if (consistencyScore < 50) {
    warnings.push({
      type: 'behavior',
      title: 'Track more consistently',
      description: 'Weekly skin checks help us give better forecasts and track your product results.',
      icon: '📅',
    })
  }

  return warnings
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
    hydration: { current: 100, withoutProducts90: 100, withProducts90: 100 },
    clarity: { current: 100, withoutProducts90: 100, withProducts90: 100 },
    texture: { current: 100, withoutProducts90: 100, withProducts90: 100 },
    radiance: { current: 100, withoutProducts90: 100, withProducts90: 100 },
  }

  for (const [category, conditionIds] of Object.entries(categoryMappings)) {
    let currentDeduction = 0
    let withoutProducts90Deduction = 0
    let withProducts90Deduction = 0

    for (const conditionId of conditionIds) {
      const projection = conditionProjections.find(p => p.id === conditionId)
      if (projection) {
        currentDeduction += projection.currentConfidence * 25
        withoutProducts90Deduction += projection.withoutProducts.projected90 * 25
        withProducts90Deduction += projection.withProducts.projected90 * 25
      }
    }

    categories[category as keyof typeof categories] = {
      current: Math.max(0, Math.round(100 - currentDeduction)),
      withoutProducts90: Math.max(0, Math.round(100 - withoutProducts90Deduction)),
      withProducts90: Math.max(0, Math.round(100 - withProducts90Deduction)),
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

  // Generate projections for each condition
  const conditionProjections: ConditionProjection[] = currentConditions.map(condition => {
    const withoutProducts = {
      projected30: projectWithoutProducts(condition.id, condition.confidence, 30),
      projected60: projectWithoutProducts(condition.id, condition.confidence, 60),
      projected90: projectWithoutProducts(condition.id, condition.confidence, 90),
      message: getDegradationMessage(condition.id),
    }

    const withProducts = {
      projected30: projectWithProducts(condition.id, condition.confidence, consistencyScore, 30),
      projected60: projectWithProducts(condition.id, condition.confidence, consistencyScore, 60),
      projected90: projectWithProducts(condition.id, condition.confidence, consistencyScore, 90),
      clearByDay: calculateClearDay(condition.id, condition.confidence, consistencyScore),
      improvementRate: (() => {
        const improvement30 = condition.confidence - projectWithProducts(condition.id, condition.confidence, consistencyScore, 30)
        if (improvement30 >= 0.20) return 'fast' as const
        if (improvement30 >= 0.10) return 'moderate' as const
        return 'slow' as const
      })(),
    }

    return {
      id: condition.id,
      name: condition.name,
      currentConfidence: condition.confidence,
      withoutProducts,
      withProducts,
      recommendedProduct: CONDITION_PRODUCTS[condition.id] || null,
    }
  })

  // Calculate overall scores for both scenarios
  const currentSkinAge = currentScores.skinAge
  const currentQualityScore = currentScores.qualityScore

  const withoutProductsScores = {
    skinAge30: calculateSkinAgeFromConditions(conditionProjections, userAge, 'withoutProducts', 30),
    skinAge60: calculateSkinAgeFromConditions(conditionProjections, userAge, 'withoutProducts', 60),
    skinAge90: calculateSkinAgeFromConditions(conditionProjections, userAge, 'withoutProducts', 90),
    qualityScore30: calculateQualityScoreFromConditions(conditionProjections, 'withoutProducts', 30),
    qualityScore60: calculateQualityScoreFromConditions(conditionProjections, 'withoutProducts', 60),
    qualityScore90: calculateQualityScoreFromConditions(conditionProjections, 'withoutProducts', 90),
    message: 'Without proper skincare, natural aging and environmental damage will worsen your skin.',
  }

  const withProductsScores = {
    skinAge30: calculateSkinAgeFromConditions(conditionProjections, userAge, 'withProducts', 30),
    skinAge60: calculateSkinAgeFromConditions(conditionProjections, userAge, 'withProducts', 60),
    skinAge90: calculateSkinAgeFromConditions(conditionProjections, userAge, 'withProducts', 90),
    achievableSkinAge: currentScores.achievableSkinAge,
    qualityScore30: calculateQualityScoreFromConditions(conditionProjections, 'withProducts', 30),
    qualityScore60: calculateQualityScoreFromConditions(conditionProjections, 'withProducts', 60),
    qualityScore90: calculateQualityScoreFromConditions(conditionProjections, 'withProducts', 90),
  }

  const categories = calculateCategoryProjections(conditionProjections)
  const warnings = generateWarnings(currentConditions, consistencyScore)

  // Get unique recommended products
  const productMap = new Map<string, ProductForCondition>()
  for (const projection of conditionProjections) {
    if (projection.recommendedProduct) {
      productMap.set(projection.recommendedProduct.slug, projection.recommendedProduct)
    }
  }
  const recommendedProducts = Array.from(productMap.values())
  const totalProductCost = recommendedProducts.reduce((sum, p) => sum + p.price, 0)

  let confidenceLevel: SkinForecast['confidenceLevel']
  if (analyses.length >= 5 && consistencyScore >= 70) confidenceLevel = 'high'
  else if (analyses.length >= 3 && consistencyScore >= 50) confidenceLevel = 'medium'
  else confidenceLevel = 'low'

  return {
    withoutProducts: withoutProductsScores,
    withProducts: withProductsScores,

    currentSkinAge,
    currentQualityScore,

    categories,
    conditionProjections,

    warnings,

    recommendedProducts,
    totalProductCost,

    analysisCount: analyses.length,
    consistencyScore,
    confidenceLevel,
  }
}
