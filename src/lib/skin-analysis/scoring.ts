/**
 * Dual Scoring System for Skin Analysis
 *
 * 1. Skin Vitality: 0-100 score for aging-related concerns (wrinkles, fine lines, dark spots, etc.)
 * 2. Skin Health: 0-100 score for overall skin condition (acne, oiliness, redness, etc.)
 *
 * Both scores use a consistent 0-100 scale where:
 * - 85-100: Excellent
 * - 70-84: Good
 * - 55-69: Fair
 * - 40-54: Needs Attention
 * - 0-39: Needs Care
 *
 * SKINCARE GOALS (Gamified Weight System):
 * Users choose their skincare ambition, which adjusts how strictly we score:
 * - AGE_NORMALLY: Relaxed scoring (1.5x weights) - Accept natural aging
 * - AGE_GRACEFULLY: Balanced scoring (2.0x weights) - Maintain healthy skin
 * - STAY_YOUNG_FOREVER: Ambitious scoring (2.5x weights) - Fight aging aggressively
 *
 * This system allows for targeted product recommendations:
 * - Anti-aging products for vitality concerns
 * - Treatment products for health concerns
 *
 * NOTE: We also calculate a "skin age" for display purposes, but this is
 * a relative indicator, not an actual biological age. Without knowing the
 * user's real age, we use the vitality score to show "years added" by conditions.
 */

// Skincare goal types - determines scoring strictness
export type SkinGoal = 'AGE_NORMALLY' | 'AGE_GRACEFULLY' | 'STAY_YOUNG_FOREVER'

// Goal multipliers for weight adjustment
// Higher multiplier = more aggressive scoring = lower scores for same conditions
export const SKIN_GOAL_MULTIPLIERS: Record<SkinGoal, number> = {
  AGE_NORMALLY: 1.5,        // Relaxed: "I accept natural aging"
  AGE_GRACEFULLY: 2.0,      // Balanced: "I want to age well"
  STAY_YOUNG_FOREVER: 2.5,  // Ambitious: "I want to fight aging"
}

// Goal display information
export const SKIN_GOAL_INFO: Record<SkinGoal, {
  label: string
  emoji: string
  description: string
  tagline: string
}> = {
  AGE_NORMALLY: {
    label: 'Age Normally',
    emoji: '🌿',
    description: 'Accept natural aging with grace. Gentle scoring that celebrates your skin as it is.',
    tagline: 'Embrace your journey',
  },
  AGE_GRACEFULLY: {
    label: 'Age Gracefully',
    emoji: '✨',
    description: 'Maintain healthy, radiant skin. Balanced scoring that encourages good habits.',
    tagline: 'The sweet spot',
  },
  STAY_YOUNG_FOREVER: {
    label: 'Stay Young Forever',
    emoji: '🚀',
    description: 'Fight aging with everything you\'ve got. Ambitious scoring for maximum results.',
    tagline: 'Go all in',
  },
}

export interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

export interface SkinScores {
  // Skin Vitality (aging concerns) - PRIMARY METRIC
  vitalityScore: number        // 0-100 score (100 = no aging concerns)
  vitalityLabel: string        // "Excellent", "Good", "Fair", etc.
  agingFactors: string[]       // Which conditions are affecting vitality

  // Skin Age (secondary, for visual display)
  skinAge: number              // Relative skin age indicator (base 30 + condition years)
  achievableSkinAge: number    // Potential improvement with skincare
  yearsAdded: number           // How many years conditions are adding

  // Skin Health (non-aging concerns) - PRIMARY METRIC
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

  // Skincare goal context (optional, for display)
  skinGoal?: SkinGoal          // User's chosen skincare goal
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

// Vitality score weights - how much each condition deducts from the 0-100 vitality score
const VITALITY_WEIGHTS: Record<string, number> = {
  fine_lines: 12,       // Mild aging sign
  wrinkles: 20,         // Significant aging sign
  dark_spots: 15,       // Age spots
  dullness: 10,         // Lack of radiance
  uneven_texture: 8,    // Surface irregularity
  dehydration: 8,       // Affects skin plumpness
  dark_circles: 10,     // Under-eye aging
}

/**
 * Calculate skin vitality score (0-100) based on aging-related conditions
 *
 * @param conditions - Detected skin conditions from AI analysis
 * @param skinGoal - User's skincare goal (affects weight multiplier)
 * @returns Vitality score, label, and contributing factors
 *
 * Example with wrinkles (0.7) + fine_lines (0.5):
 * - AGE_NORMALLY (1.5x):       100 - (20×0.7 + 12×0.5)×1.5 = 100 - 30 = 70 (Good)
 * - AGE_GRACEFULLY (2.0x):     100 - (20×0.7 + 12×0.5)×2.0 = 100 - 40 = 60 (Fair)
 * - STAY_YOUNG_FOREVER (2.5x): 100 - (20×0.7 + 12×0.5)×2.5 = 100 - 50 = 50 (Needs Attention)
 */
export function calculateVitalityScore(
  conditions: DetectedCondition[],
  skinGoal: SkinGoal = 'AGE_GRACEFULLY'
): { score: number; label: string; factors: string[] } {
  let totalDeduction = 0
  const factors: string[] = []

  const multiplier = SKIN_GOAL_MULTIPLIERS[skinGoal]

  for (const condition of conditions) {
    const weight = VITALITY_WEIGHTS[condition.id]
    if (weight) {
      totalDeduction += weight * condition.confidence * multiplier
      factors.push(condition.name)
    }
  }

  const score = Math.max(0, Math.round(100 - totalDeduction))

  return {
    score,
    label: getQualityLabel(score), // Use same label thresholds
    factors,
  }
}

/**
 * Calculate skin age indicator based on aging-related conditions
 *
 * NOTE: This is a RELATIVE indicator, not an actual biological age.
 * Without knowing the user's real age, we use a base of 30 and show
 * how many "years" conditions are adding. This is useful for:
 * - Visual representation in the UI
 * - Showing improvement potential
 * - Marketing/engagement purposes
 *
 * The PRIMARY metric should be vitalityScore (0-100), not skin age.
 *
 * @param conditions - Detected skin conditions from AI analysis
 * @param baseAge - Base age for calculation (default 30, arbitrary)
 * @returns Skin age indicator, achievable age, years added, and factors
 */
export function calculateSkinAge(
  conditions: DetectedCondition[],
  baseAge: number = 30
): { skinAge: number; achievableSkinAge: number; yearsAdded: number; factors: string[] } {
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

  // Calculate achievable age (improvement potential capped by reversibility)
  const maxImprovement = Math.min(totalReversibleYears, 8) // Cap at 8 years
  const minImprovement = Math.min(totalReversibleYears * 0.6, 5) // At least 60% of reversible, min 5 years

  // Achievable age is current skin age minus the reversible years
  const improvement = Math.max(minImprovement, maxImprovement * 0.8)
  const achievableSkinAge = Math.round(skinAge - improvement)

  // Ensure achievable age is reasonable
  const finalAchievableAge = Math.max(
    achievableSkinAge,
    baseAge - 5, // Can't go more than 5 years below base
    18 // Minimum age of 18
  )

  return {
    skinAge: Math.max(skinAge, baseAge),
    achievableSkinAge: finalAchievableAge,
    yearsAdded: Math.round(totalYearsAdded),
    factors,
  }
}

/**
 * Calculate skin quality score (0-100) based on non-aging conditions
 *
 * @param conditions - Detected skin conditions from AI analysis
 * @param skinGoal - User's skincare goal (affects weight multiplier)
 * @returns Quality score, label, and contributing factors
 */
export function calculateQualityScore(
  conditions: DetectedCondition[],
  skinGoal: SkinGoal = 'AGE_GRACEFULLY'
): { score: number; label: string; factors: string[] } {
  let totalDeduction = 0
  const factors: string[] = []

  const multiplier = SKIN_GOAL_MULTIPLIERS[skinGoal]

  for (const condition of conditions) {
    const weight = QUALITY_WEIGHTS[condition.id]
    if (weight) {
      totalDeduction += weight * condition.confidence * multiplier
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
 *
 * @param conditions - Detected skin conditions from AI analysis
 * @param skinGoal - User's skincare goal (affects weight multiplier)
 */
export function calculateCategoryScores(
  conditions: DetectedCondition[],
  skinGoal: SkinGoal = 'AGE_GRACEFULLY'
): SkinScores['categories'] {
  const categories: SkinScores['categories'] = {
    hydration: 100,
    clarity: 100,
    texture: 100,
    radiance: 100,
  }

  const multiplier = SKIN_GOAL_MULTIPLIERS[skinGoal]

  // Create a map of condition confidence for quick lookup
  const conditionMap = new Map(conditions.map(c => [c.id, c.confidence]))

  // Calculate each category
  for (const [category, conditionIds] of Object.entries(CATEGORY_MAPPINGS)) {
    let deduction = 0
    let conditionCount = 0

    for (const conditionId of conditionIds) {
      const confidence = conditionMap.get(conditionId)
      if (confidence !== undefined) {
        deduction += confidence * 25 * multiplier // Each condition deduction scaled by goal
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
 *
 * Returns both the new 0-100 vitality score AND the legacy skin age indicator
 * for backwards compatibility and visual display purposes.
 *
 * @param conditions - Detected skin conditions from AI analysis
 * @param userAge - Optional user age for skin age calculation
 * @param skinGoal - User's skincare goal (affects all score calculations)
 */
export function calculateSkinScores(
  conditions: DetectedCondition[],
  userAge?: number,
  skinGoal: SkinGoal = 'AGE_GRACEFULLY'
): SkinScores {
  const baseAge = userAge || 30

  // Primary vitality metric (0-100)
  const { score: vitalityScore, label: vitalityLabel, factors: vitalityFactors } =
    calculateVitalityScore(conditions, skinGoal)

  // Secondary skin age indicator (for visual display)
  const { skinAge, achievableSkinAge, yearsAdded, factors: agingFactors } =
    calculateSkinAge(conditions, baseAge)

  // Health score (0-100)
  const { score: qualityScore, label: qualityLabel, factors: qualityFactors } =
    calculateQualityScore(conditions, skinGoal)

  // Category breakdown
  const categories = calculateCategoryScores(conditions, skinGoal)

  return {
    // Primary vitality metric
    vitalityScore,
    vitalityLabel,
    agingFactors: vitalityFactors.length > 0 ? vitalityFactors : agingFactors,

    // Secondary skin age (for display)
    skinAge,
    achievableSkinAge,
    yearsAdded,

    // Health score
    qualityScore,
    qualityLabel,
    qualityFactors,

    // Categories
    categories,

    // Goal context
    skinGoal,
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
 * Luxury color palette for vitality score (0-100)
 * Uses same scale as quality score for consistency
 */
export function getVitalityColor(score: number): string {
  if (score >= 85) return '#1C4444' // Brand teal - excellent
  if (score >= 70) return '#2D5A5A' // Lighter teal - good
  if (score >= 55) return '#8B7355' // Warm bronze - fair
  if (score >= 40) return '#A67C52' // Copper - needs attention
  return '#996B4A'                  // Terracotta - needs care
}

/**
 * @deprecated Use getVitalityColor instead for the 0-100 vitality score
 * Luxury color palette for skin age indicator
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

/**
 * Get accessible text description for quality score (for screen readers)
 */
export function getQualityAccessibleLabel(score: number): string {
  const label = getQualityLabel(score)
  if (score >= 85) return `${label} skin health (${score}/100) - Your skin is in excellent condition`
  if (score >= 70) return `${label} skin health (${score}/100) - Your skin is healthy with minor areas to improve`
  if (score >= 55) return `${label} skin health (${score}/100) - Your skin has some concerns that can be addressed`
  if (score >= 40) return `${label} skin health (${score}/100) - Your skin needs attention in several areas`
  return `${label} (${score}/100) - Your skin would benefit from a dedicated skincare routine`
}

/**
 * Get accessible text description for vitality score (for screen readers)
 */
export function getVitalityAccessibleLabel(score: number): string {
  const label = getQualityLabel(score)
  if (score >= 85) return `${label} skin vitality (${score}/100) - Minimal signs of aging, your skin looks youthful and radiant`
  if (score >= 70) return `${label} skin vitality (${score}/100) - Your skin shows early signs of aging that are easily addressed`
  if (score >= 55) return `${label} skin vitality (${score}/100) - Some visible aging signs that can be improved with proper care`
  if (score >= 40) return `${label} skin vitality (${score}/100) - Notable aging concerns that would benefit from targeted treatment`
  return `${label} skin vitality (${score}/100) - Your skin would benefit from an anti-aging skincare routine`
}

/**
 * @deprecated Use getVitalityAccessibleLabel instead
 * Get accessible text description for skin age indicator (for screen readers)
 */
export function getSkinAgeAccessibleLabel(skinAge: number, chronologicalAge: number): string {
  const difference = skinAge - chronologicalAge
  if (difference <= 0) return `Skin age indicator: ${skinAge} - Radiant, your skin appears younger than your chronological age`
  if (difference <= 3) return `Skin age indicator: ${skinAge} - Balanced, your skin is close to your chronological age`
  if (difference <= 6) return `Skin age indicator: ${skinAge} - Room to improve, slight signs of premature aging`
  if (difference <= 10) return `Skin age indicator: ${skinAge} - Needs attention, visible signs of premature aging`
  return `Skin age indicator: ${skinAge} - Care recommended, significant signs of premature aging`
}

/**
 * Get accessible text description for category score (for screen readers)
 */
export function getCategoryAccessibleLabel(category: string, score: number): string {
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
  if (score >= 85) return `${categoryName}: Excellent (${score}/100)`
  if (score >= 70) return `${categoryName}: Good (${score}/100)`
  if (score >= 55) return `${categoryName}: Fair (${score}/100)`
  if (score >= 40) return `${categoryName}: Needs attention (${score}/100)`
  return `${categoryName}: Needs care (${score}/100)`
}
