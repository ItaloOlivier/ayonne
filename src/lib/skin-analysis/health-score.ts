// Calculate overall skin health score from detected conditions

import { DetectedCondition, SkinConditionType } from './conditions'

// Weight each condition by severity impact on skin health
const CONDITION_WEIGHTS: Record<SkinConditionType, number> = {
  acne: 15,
  wrinkles: 12,
  fine_lines: 8,
  dark_spots: 10,
  redness: 10,
  dryness: 8,
  oiliness: 6,
  dark_circles: 7,
  enlarged_pores: 6,
  sun_damage: 14,
  dullness: 5,
  uneven_texture: 7,
}

/**
 * Calculate skin health score from detected conditions
 * Returns a score from 0-100 where higher is better
 */
export function calculateHealthScore(conditions: DetectedCondition[]): number {
  if (!conditions || conditions.length === 0) {
    return 85 // Base score when no conditions detected
  }

  // Start with perfect score
  let score = 100

  // Deduct points for each condition based on weight and confidence
  for (const condition of conditions) {
    const weight = CONDITION_WEIGHTS[condition.id as SkinConditionType] || 5
    const deduction = weight * condition.confidence
    score -= deduction
  }

  // Ensure score stays in valid range
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Get score rating label
 */
export function getScoreRating(score: number): {
  label: string
  color: string
  description: string
} {
  if (score >= 90) {
    return {
      label: 'Excellent',
      color: 'text-green-600',
      description: 'Your skin is in excellent condition!',
    }
  }
  if (score >= 75) {
    return {
      label: 'Good',
      color: 'text-blue-600',
      description: 'Your skin is healthy with minor concerns.',
    }
  }
  if (score >= 60) {
    return {
      label: 'Fair',
      color: 'text-yellow-600',
      description: 'Some areas could use attention.',
    }
  }
  if (score >= 40) {
    return {
      label: 'Needs Attention',
      color: 'text-orange-600',
      description: 'Several areas need improvement.',
    }
  }
  return {
    label: 'Critical',
    color: 'text-red-600',
    description: 'Your skin needs significant care.',
  }
}

/**
 * Get score color for visual displays
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // green-500
  if (score >= 60) return '#3b82f6' // blue-500
  if (score >= 40) return '#eab308' // yellow-500
  if (score >= 20) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

/**
 * Calculate improvement suggestions based on score
 */
export function getImprovementTips(score: number, conditions: DetectedCondition[]): string[] {
  const tips: string[] = []

  if (score < 80) {
    tips.push('Track your skin daily to monitor improvements')
  }

  if (score < 60) {
    tips.push('Consider a consistent skincare routine')
  }

  // Condition-specific tips
  const hasAcne = conditions.some(c => c.id === 'acne')
  const hasDryness = conditions.some(c => c.id === 'dryness')
  const hasWrinkles = conditions.some(c => c.id === 'wrinkles' || c.id === 'fine_lines')

  if (hasAcne) {
    tips.push('Use gentle, non-comedogenic products')
  }

  if (hasDryness) {
    tips.push('Hydration is key - use a good moisturizer')
  }

  if (hasWrinkles) {
    tips.push('Consider adding retinol or anti-aging products')
  }

  return tips.slice(0, 3) // Return max 3 tips
}
