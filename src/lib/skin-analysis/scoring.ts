/**
 * Dual Scoring System for Skin Analysis
 *
 * 1. Skin Age: Estimated biological skin age based on aging indicators
 * 2. Skin Quality: Overall skin health/condition score (0-100)
 *
 * This system allows for targeted product recommendations:
 * - Anti-aging products for skin age concerns
 * - Treatment products for skin quality concerns
 */

export interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

export interface SkinScores {
  // Skin Age
  skinAge: number              // Estimated biological skin age
  achievableSkinAge: number    // Potential age with consistent skincare (5-8 years younger)
  agingFactors: string[]       // Which conditions are contributing to skin age

  // Skin Quality
  qualityScore: number         // 0-100 score for overall skin health
  qualityLabel: string         // "Excellent", "Good", "Fair", etc.
  qualityFactors: string[]     // Which conditions are affecting quality

  // Categories for detailed breakdown
  categories: {
    hydration: number          // 0-100
    clarity: number            // 0-100 (acne, spots)
    texture: number            // 0-100 (pores, smoothness)
    radiance: number           // 0-100 (dullness, glow)
  }
}

// Aging-related conditions (contribute to skin age)
const AGING_CONDITIONS: Record<string, { yearsAdded: number; reversible: number }> = {
  fine_lines: { yearsAdded: 3, reversible: 0.7 },      // Highly reversible with hydration/retinol
  wrinkles: { yearsAdded: 6, reversible: 0.4 },        // Moderately reversible
  dark_spots: { yearsAdded: 4, reversible: 0.8 },      // Very reversible with Vitamin C
  dullness: { yearsAdded: 3, reversible: 0.9 },        // Easily reversible
  uneven_texture: { yearsAdded: 2, reversible: 0.7 },  // Reversible with exfoliation
  dehydration: { yearsAdded: 2, reversible: 0.95 },    // Almost fully reversible
  dark_circles: { yearsAdded: 2, reversible: 0.5 },    // Partially reversible
}

// Quality-related conditions (don't age skin but affect health/appearance)
const QUALITY_WEIGHTS: Record<string, number> = {
  acne: 18,
  redness: 12,
  oiliness: 8,
  dryness: 10,
  large_pores: 8,
  enlarged_pores: 8,
  dehydration: 10,
  uneven_texture: 8,
}

// Category mappings for breakdown
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  hydration: ['dryness', 'dehydration'],
  clarity: ['acne', 'dark_spots', 'redness'],
  texture: ['large_pores', 'enlarged_pores', 'uneven_texture', 'acne'],
  radiance: ['dullness', 'dark_circles', 'dehydration'],
}

/**
 * Calculate skin age based on aging-related conditions
 *
 * @param conditions - Detected skin conditions from AI analysis
 * @param baseAge - User's chronological age (optional, defaults to 30)
 * @returns Estimated skin age and achievable age with skincare
 */
export function calculateSkinAge(
  conditions: DetectedCondition[],
  baseAge: number = 30
): { skinAge: number; achievableSkinAge: number; factors: string[] } {
  let totalYearsAdded = 0
  let totalReversibleYears = 0
  const factors: string[] = []

  for (const condition of conditions) {
    const agingData = AGING_CONDITIONS[condition.id]
    if (agingData) {
      // Years added based on confidence
      const yearsFromCondition = agingData.yearsAdded * condition.confidence
      totalYearsAdded += yearsFromCondition

      // How many of those years are reversible
      totalReversibleYears += yearsFromCondition * agingData.reversible

      factors.push(condition.name)
    }
  }

  // Calculate skin age (add aging years to base age)
  const skinAge = Math.round(baseAge + totalYearsAdded)

  // Calculate achievable age (5-8 years improvement potential, capped by reversibility)
  // The improvement is limited by what's actually reversible
  const maxImprovement = Math.min(totalReversibleYears, 8) // Cap at 8 years
  const minImprovement = Math.min(totalReversibleYears * 0.6, 5) // At least 60% of reversible, min 5 years

  // Achievable age is current skin age minus the reversible years
  const improvement = Math.max(minImprovement, maxImprovement * 0.8)
  const achievableSkinAge = Math.round(skinAge - improvement)

  // Ensure achievable age is reasonable
  const finalAchievableAge = Math.max(
    achievableSkinAge,
    baseAge - 5, // Can't go more than 5 years below chronological age
    18 // Minimum age of 18
  )

  return {
    skinAge: Math.max(skinAge, baseAge), // Skin age at least as old as chronological
    achievableSkinAge: finalAchievableAge,
    factors,
  }
}

/**
 * Calculate skin quality score (0-100) based on non-aging conditions
 */
export function calculateQualityScore(
  conditions: DetectedCondition[]
): { score: number; label: string; factors: string[] } {
  let totalDeduction = 0
  const factors: string[] = []

  for (const condition of conditions) {
    const weight = QUALITY_WEIGHTS[condition.id]
    if (weight) {
      totalDeduction += weight * condition.confidence
      factors.push(condition.name)
    }
  }

  const score = Math.max(0, Math.round(100 - totalDeduction))

  return {
    score,
    label: getQualityLabel(score),
    factors,
  }
}

/**
 * Calculate category breakdown scores
 */
export function calculateCategoryScores(
  conditions: DetectedCondition[]
): SkinScores['categories'] {
  const categories: SkinScores['categories'] = {
    hydration: 100,
    clarity: 100,
    texture: 100,
    radiance: 100,
  }

  // Create a map of condition confidence for quick lookup
  const conditionMap = new Map(conditions.map(c => [c.id, c.confidence]))

  // Calculate each category
  for (const [category, conditionIds] of Object.entries(CATEGORY_MAPPINGS)) {
    let deduction = 0
    let conditionCount = 0

    for (const conditionId of conditionIds) {
      const confidence = conditionMap.get(conditionId)
      if (confidence !== undefined) {
        deduction += confidence * 25 // Each condition can deduct up to 25 points
        conditionCount++
      }
    }

    // Apply diminishing returns for multiple conditions
    if (conditionCount > 1) {
      deduction = deduction * (0.8 + 0.2 / conditionCount)
    }

    categories[category as keyof SkinScores['categories']] =
      Math.max(0, Math.round(100 - deduction))
  }

  return categories
}

/**
 * Calculate complete skin scores
 */
export function calculateSkinScores(
  conditions: DetectedCondition[],
  userAge?: number
): SkinScores {
  const baseAge = userAge || 30

  const { skinAge, achievableSkinAge, factors: agingFactors } =
    calculateSkinAge(conditions, baseAge)

  const { score: qualityScore, label: qualityLabel, factors: qualityFactors } =
    calculateQualityScore(conditions)

  const categories = calculateCategoryScores(conditions)

  return {
    skinAge,
    achievableSkinAge,
    agingFactors,
    qualityScore,
    qualityLabel,
    qualityFactors,
    categories,
  }
}

/**
 * Get quality label from score
 */
export function getQualityLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 40) return 'Needs Attention'
  return 'Needs Care'
}

/**
 * Luxury color palette for quality score
 * Uses warm, sophisticated tones instead of traffic light colors
 */
export function getQualityColor(score: number): string {
  if (score >= 85) return '#1C4444' // Brand teal - excellent
  if (score >= 70) return '#2D5A5A' // Lighter teal - good
  if (score >= 55) return '#8B7355' // Warm bronze - fair
  if (score >= 40) return '#A67C52' // Copper - needs attention
  return '#996B4A'                  // Terracotta - needs care
}

/**
 * Luxury color palette for skin vitality
 * Uses brand-aligned sophisticated tones
 */
export function getSkinAgeColor(skinAge: number, chronologicalAge: number): string {
  const difference = skinAge - chronologicalAge
  if (difference <= 0) return '#1C4444'   // Brand teal - radiant
  if (difference <= 3) return '#2D5A5A'   // Lighter teal - balanced
  if (difference <= 6) return '#6B8E8E'   // Sage - room to improve
  if (difference <= 10) return '#8B7355'  // Warm bronze - attention needed
  return '#A67C52'                        // Copper - care recommended
}

/**
 * Format skin age display text
 */
export function formatSkinAgeDisplay(skinAge: number, achievableAge: number): {
  current: string
  achievable: string
  improvement: string
} {
  const improvement = skinAge - achievableAge

  return {
    current: `${skinAge}`,
    achievable: `${achievableAge}`,
    improvement: improvement > 0 ? `-${improvement} years` : 'Optimal',
  }
}
