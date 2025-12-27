// Product recommendation engine

import { prisma } from '@/lib/prisma'
import { Product } from '@/types'
import { DetectedCondition, SkinType, SKIN_CONDITIONS, SkinConditionType } from './conditions'

interface ProductRecommendation {
  product: Product
  relevanceScore: number
  reason: string
}

// Keywords to match against product descriptions and categories
const CONDITION_KEYWORDS: Record<SkinConditionType, string[]> = {
  acne: ['acne', 'blemish', 'breakout', 'salicylic', 'clarifying', 'pore', 'tea tree', 'benzoyl'],
  wrinkles: ['anti-aging', 'anti aging', 'wrinkle', 'retinol', 'retinoid', 'collagen', 'firming', 'peptide', 'lift'],
  fine_lines: ['anti-aging', 'fine line', 'retinol', 'peptide', 'collagen', 'prevent', 'youthful'],
  dark_spots: ['brightening', 'bright', 'vitamin c', 'niacinamide', 'dark spot', 'hyperpigmentation', 'even tone', 'radiance', 'glow'],
  redness: ['calming', 'soothing', 'sensitive', 'redness', 'rosacea', 'centella', 'cica', 'gentle', 'anti-inflammatory'],
  dryness: ['hydrating', 'hydration', 'moisturizing', 'moisture', 'hyaluronic', 'ceramide', 'nourishing', 'barrier'],
  oiliness: ['oil control', 'oil-free', 'mattifying', 'lightweight', 'balancing', 'sebum', 'pore'],
  dark_circles: ['eye', 'caffeine', 'under eye', 'brighten', 'de-puff', 'vitamin k'],
  enlarged_pores: ['pore', 'minimizing', 'niacinamide', 'salicylic', 'refining', 'tightening'],
  sun_damage: ['antioxidant', 'vitamin c', 'repair', 'protect', 'brightening', 'restorative'],
  dullness: ['brightening', 'glow', 'radiance', 'vitamin c', 'exfoliat', 'aha', 'glycolic', 'lactic'],
  uneven_texture: ['exfoliat', 'smoothing', 'resurfacing', 'aha', 'bha', 'glycolic', 'retinol', 'peel'],
}

const SKIN_TYPE_KEYWORDS: Record<SkinType, string[]> = {
  oily: ['oil-free', 'lightweight', 'mattifying', 'balancing', 'gel', 'foam'],
  dry: ['hydrating', 'nourishing', 'cream', 'rich', 'moisturizing', 'oil', 'barrier'],
  combination: ['balancing', 'lightweight', 'hydrating', 'gel-cream'],
  normal: ['gentle', 'balanced', 'daily', 'everyday'],
  sensitive: ['gentle', 'calming', 'fragrance-free', 'sensitive', 'soothing', 'hypoallergenic'],
}

// Collection priority mapping - which collections are most relevant for conditions
const COLLECTION_PRIORITY: Record<string, SkinConditionType[]> = {
  'anti-aging-serums': ['wrinkles', 'fine_lines', 'dark_spots', 'sun_damage', 'dullness'],
  'moisturizers': ['dryness', 'wrinkles', 'redness'],
  'cleansers': ['acne', 'oiliness', 'enlarged_pores', 'dullness'],
  'serums': ['dark_spots', 'dullness', 'fine_lines', 'sun_damage'],
}

function calculateRelevanceScore(
  product: { name: string; description: string; category: string; collection: string; benefits?: string | null },
  skinType: SkinType | null,
  conditions: DetectedCondition[]
): number {
  let score = 0
  const searchText = `${product.name} ${product.description} ${product.category} ${product.benefits || ''}`.toLowerCase()

  // Score based on skin type match
  if (skinType) {
    const typeKeywords = SKIN_TYPE_KEYWORDS[skinType]
    for (const keyword of typeKeywords) {
      if (searchText.includes(keyword)) {
        score += 5
      }
    }
  }

  // Score based on condition matches
  for (const condition of conditions) {
    const conditionKeywords = CONDITION_KEYWORDS[condition.id as SkinConditionType]
    if (!conditionKeywords) continue

    for (const keyword of conditionKeywords) {
      if (searchText.includes(keyword)) {
        // Higher confidence conditions get weighted higher
        score += 10 * condition.confidence
      }
    }

    // Bonus for collection match
    const collectionConditions = COLLECTION_PRIORITY[product.collection]
    if (collectionConditions?.includes(condition.id as SkinConditionType)) {
      score += 15 * condition.confidence
    }
  }

  return score
}

function generateRecommendationReason(
  product: { name: string; description: string; category: string; benefits?: string | null },
  skinType: SkinType | null,
  conditions: DetectedCondition[]
): string {
  const matchedConditions: string[] = []
  const searchText = `${product.name} ${product.description} ${product.category} ${product.benefits || ''}`.toLowerCase()

  // Find which conditions this product addresses
  for (const condition of conditions) {
    const conditionKeywords = CONDITION_KEYWORDS[condition.id as SkinConditionType]
    if (!conditionKeywords) continue

    for (const keyword of conditionKeywords) {
      if (searchText.includes(keyword)) {
        matchedConditions.push(condition.name)
        break
      }
    }
  }

  if (matchedConditions.length === 0) {
    if (skinType) {
      return `Great for ${skinType} skin types`
    }
    return 'Recommended for your skincare routine'
  }

  if (matchedConditions.length === 1) {
    return `Helps address ${matchedConditions[0].toLowerCase()}`
  }

  const last = matchedConditions.pop()
  return `Helps address ${matchedConditions.join(', ')} and ${last?.toLowerCase()}`
}

export async function getProductRecommendations(
  skinType: SkinType | null,
  conditions: DetectedCondition[],
  limit: number = 6
): Promise<ProductRecommendation[]> {
  try {
    // Fetch all in-stock products
    const products = await prisma.product.findMany({
      where: { inStock: true },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Score and rank products
    const scoredProducts = products.map(product => ({
      product: {
        ...product,
        price: Number(product.price),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
      } as Product,
      relevanceScore: calculateRelevanceScore(product, skinType, conditions),
      reason: generateRecommendationReason(product, skinType, conditions),
    }))

    // Sort by relevance score (descending) and take top N
    const topRecommendations = scoredProducts
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    // If we don't have enough relevant products, add featured products
    if (topRecommendations.length < limit) {
      const featuredProducts = scoredProducts
        .filter(p => p.relevanceScore === 0 && p.product.featured)
        .slice(0, limit - topRecommendations.length)
        .map(p => ({
          ...p,
          reason: 'Popular choice for skincare routines',
        }))

      topRecommendations.push(...featuredProducts)
    }

    return topRecommendations
  } catch (error) {
    console.error('Error fetching product recommendations:', error)
    return []
  }
}

// Get collection-based recommendations when AI analysis is unavailable
export async function getFallbackRecommendations(limit: number = 6): Promise<ProductRecommendation[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        inStock: true,
        featured: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return products.map(product => ({
      product: {
        ...product,
        price: Number(product.price),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
      } as Product,
      relevanceScore: 50,
      reason: 'Popular choice for skincare routines',
    }))
  } catch (error) {
    console.error('Error fetching fallback recommendations:', error)
    return []
  }
}
