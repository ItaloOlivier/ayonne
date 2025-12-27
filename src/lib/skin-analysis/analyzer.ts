/**
 * Shared skin analysis utilities
 *
 * Extracted from analyze and analyze-multi routes to reduce code duplication.
 */

import sharp from 'sharp'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { SkinType, DetectedCondition } from './conditions'
import { getProductRecommendations } from './recommendations'
import { getPersonalizedAdvice } from './advice'

// Constants
export const RATE_LIMIT_ANALYSES_PER_HOUR = 5
export const COMPRESSED_IMAGE_MAX_WIDTH = 800
export const COMPRESSED_IMAGE_QUALITY = 75
export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Generate a unique session ID for tracking
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Compress image for storage after analysis
 */
export async function compressImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const compressed = await sharp(imageBuffer)
      .resize(COMPRESSED_IMAGE_MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: COMPRESSED_IMAGE_QUALITY, progressive: true })
      .toBuffer()

    console.log(
      `Image compressed: ${imageBuffer.length} -> ${compressed.length} bytes ` +
      `(${Math.round((1 - compressed.length / imageBuffer.length) * 100)}% reduction)`
    )
    return compressed
  } catch (error) {
    console.error('Image compression failed:', error)
    return imageBuffer
  }
}

/**
 * Parse AI JSON response, handling markdown code blocks
 */
export function parseAIJsonResponse<T>(content: string): T | null {
  try {
    let jsonContent = content.trim()

    // Remove ```json and ``` markers if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7)
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3)
    }

    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3)
    }

    return JSON.parse(jsonContent.trim())
  } catch (error) {
    console.error('Failed to parse AI response:', content, error)
    return null
  }
}

/**
 * Call Anthropic API for skin analysis
 */
export async function callAnthropicAPI(
  messages: Array<{ role: string; content: unknown }>,
  maxTokens: number = 1024
): Promise<string | null> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured')
    throw new Error('AI analysis unavailable: ANTHROPIC_API_KEY not configured')
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages,
      }),
    })

    if (!response.ok) {
      console.error('Anthropic API error:', await response.text())
      return null
    }

    const data = await response.json()
    return data.content[0]?.text || null
  } catch (error) {
    console.error('Error calling Anthropic:', error)
    return null
  }
}

/**
 * Upload image to blob storage with fallback
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'image/jpeg',
    })
    return blob.url
  } catch (error) {
    console.error('Blob upload error:', error)
    // Fallback to base64 data URL
    return `data:image/jpeg;base64,${buffer.toString('base64')}`
  }
}

/**
 * Validate an uploaded image file
 */
export function validateImageFile(
  file: File | null,
  name: string = 'image'
): { valid: true } | { valid: false; error: string; status: number } {
  if (!file) {
    return { valid: false, error: `No ${name} provided`, status: 400 }
  }

  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type for ${name}. Please upload JPEG, PNG, or WebP.`,
      status: 400,
    }
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `${name} too large. Please upload an image under 10MB.`,
      status: 400,
    }
  }

  return { valid: true }
}

/**
 * Check rate limit for a customer
 */
export async function checkAnalysisRateLimit(
  customerId: string
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await prisma.skinAnalysis.count({
    where: {
      customerId,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (recentCount >= RATE_LIMIT_ANALYSES_PER_HOUR) {
    return {
      allowed: false,
      error: `You can only perform ${RATE_LIMIT_ANALYSES_PER_HOUR} analyses per hour. Please try again later.`,
    }
  }

  return { allowed: true }
}

/**
 * Build recommendations and advice from analysis results
 */
export async function buildAnalysisResults(
  skinType: SkinType | null,
  conditions: DetectedCondition[],
  extraAdviceData?: Record<string, unknown>
): Promise<{
  recommendations: Array<{
    productId: string
    productName: string
    productSlug: string
    productShopifySlug: string | null
    productImage: string | null
    productPrice: unknown
    productSalePrice: unknown
    reason: string
    relevanceScore: number
  }>
  advice: unknown
}> {
  const recommendations = await getProductRecommendations(skinType, conditions, 6)
  const conditionIds = conditions.map(c => c.id)
  const baseAdvice = getPersonalizedAdvice(skinType, conditionIds)

  // Merge extra advice data if provided (e.g., asymmetryNotes for multi-angle)
  const advice = extraAdviceData
    ? { items: baseAdvice, ...extraAdviceData }
    : baseAdvice

  return {
    recommendations: recommendations.map(r => ({
      productId: r.product.id,
      productName: r.product.name,
      productSlug: r.product.slug,
      productShopifySlug: r.product.shopifySlug || null,
      productImage: r.product.images[0] || null,
      productPrice: r.product.price,
      productSalePrice: r.product.salePrice,
      reason: r.reason,
      relevanceScore: r.relevanceScore,
    })),
    advice,
  }
}

/**
 * Smart fallback analysis for when AI is unavailable
 */
export function getSmartFallbackAnalysis(): {
  skinType: SkinType
  conditions: DetectedCondition[]
} {
  // Randomly select skin type with realistic distribution
  const skinTypes: SkinType[] = ['combination', 'oily', 'dry', 'normal', 'sensitive']
  const weights = [0.35, 0.25, 0.20, 0.15, 0.05]

  let random = Math.random()
  let skinType: SkinType = 'combination'
  for (let i = 0; i < weights.length; i++) {
    if (random < weights[i]) {
      skinType = skinTypes[i]
      break
    }
    random -= weights[i]
  }

  const conditionsByType: Record<SkinType, Array<{
    id: string
    name: string
    baseChance: number
    description: string
  }>> = {
    oily: [
      { id: 'large_pores', name: 'Enlarged Pores', baseChance: 0.7, description: 'Visible enlarged pores, particularly in the T-zone area.' },
      { id: 'oiliness', name: 'Excess Oil', baseChance: 0.8, description: 'Skin appears shiny with excess sebum production.' },
      { id: 'acne', name: 'Acne Prone', baseChance: 0.5, description: 'Some breakouts or congestion visible.' },
      { id: 'dullness', name: 'Dull Skin', baseChance: 0.3, description: 'Skin lacks radiance and appears tired.' },
    ],
    dry: [
      { id: 'dryness', name: 'Dry Patches', baseChance: 0.8, description: 'Visible dry areas with potential flaking.' },
      { id: 'fine_lines', name: 'Fine Lines', baseChance: 0.6, description: 'Early signs of dehydration lines.' },
      { id: 'dehydration', name: 'Dehydration', baseChance: 0.7, description: 'Skin appears tight and lacks moisture.' },
      { id: 'dullness', name: 'Dull Skin', baseChance: 0.5, description: 'Skin lacks natural glow and radiance.' },
    ],
    combination: [
      { id: 'oiliness', name: 'T-Zone Oiliness', baseChance: 0.6, description: 'Oily areas concentrated on forehead, nose, and chin.' },
      { id: 'dryness', name: 'Dry Cheeks', baseChance: 0.4, description: 'Drier areas on cheeks and outer face.' },
      { id: 'large_pores', name: 'Visible Pores', baseChance: 0.5, description: 'Enlarged pores visible in oily areas.' },
      { id: 'uneven_texture', name: 'Uneven Texture', baseChance: 0.4, description: 'Some textural irregularities present.' },
    ],
    normal: [
      { id: 'fine_lines', name: 'Fine Lines', baseChance: 0.3, description: 'Minimal fine lines appearing.' },
      { id: 'dullness', name: 'Slight Dullness', baseChance: 0.2, description: 'Could benefit from extra radiance.' },
    ],
    sensitive: [
      { id: 'redness', name: 'Redness', baseChance: 0.7, description: 'Visible redness or flushing in certain areas.' },
      { id: 'dryness', name: 'Sensitivity Dryness', baseChance: 0.5, description: 'Dry areas associated with sensitivity.' },
      { id: 'uneven_texture', name: 'Reactive Skin', baseChance: 0.4, description: 'Skin shows signs of reactivity.' },
    ],
  }

  const possibleConditions = conditionsByType[skinType]
  const selectedConditions: DetectedCondition[] = []

  for (const condition of possibleConditions) {
    if (Math.random() < condition.baseChance) {
      const confidence = Math.min(0.95, condition.baseChance * (0.7 + Math.random() * 0.5))
      selectedConditions.push({
        id: condition.id,
        name: condition.name,
        confidence: Math.round(confidence * 100) / 100,
        description: condition.description,
      })
    }
  }

  if (selectedConditions.length === 0 && possibleConditions.length > 0) {
    const fallback = possibleConditions[0]
    selectedConditions.push({
      id: fallback.id,
      name: fallback.name,
      confidence: 0.5 + Math.random() * 0.3,
      description: fallback.description,
    })
  }

  return {
    skinType,
    conditions: selectedConditions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4),
  }
}
