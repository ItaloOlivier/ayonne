/**
 * Tool Handlers for Anthropic Tool Use
 *
 * These handlers execute the tools defined in tools.ts,
 * querying the database and returning structured responses.
 */

import { prisma } from '@/lib/prisma'
import {
  CONDITION_TO_PRODUCT_TAGS,
  INGREDIENT_INTERACTIONS,
  INGREDIENT_BENEFITS,
} from './tools'

/**
 * Handle a tool call from Claude
 */
export async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  console.log(`[TOOL] Executing: ${toolName}`, toolInput)

  switch (toolName) {
    case 'lookup_products':
      return await handleProductLookup(toolInput as unknown as ProductLookupInput)
    case 'check_ingredient_compatibility':
      return await handleIngredientCompatibility(
        toolInput as unknown as IngredientCompatibilityInput
      )
    case 'build_routine':
      return await handleBuildRoutine(toolInput as unknown as BuildRoutineInput)
    case 'get_ingredient_benefits':
      return await handleIngredientBenefits(toolInput as unknown as IngredientBenefitsInput)
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` })
  }
}

// Tool input types
interface ProductLookupInput {
  conditions: string[]
  skinType: string
  maxResults?: number
}

interface IngredientCompatibilityInput {
  ingredients: string[]
}

interface BuildRoutineInput {
  skinType: string
  conditions: string[]
  priority?: string
}

interface IngredientBenefitsInput {
  ingredient: string
}

/**
 * Look up products for specific conditions
 */
async function handleProductLookup(input: ProductLookupInput): Promise<string> {
  const { conditions, skinType, maxResults = 5 } = input

  // Map conditions to product search terms
  const searchTerms = conditions.flatMap(
    condition => CONDITION_TO_PRODUCT_TAGS[condition] || [condition]
  )

  // Build search query
  const searchPattern = searchTerms.join('|')

  try {
    // Search products by name, description, or tags
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchPattern, mode: 'insensitive' } },
          { description: { contains: searchPattern, mode: 'insensitive' } },
        ],
        inStock: true,
      },
      orderBy: { price: 'asc' },
      take: maxResults * 2, // Get more to filter
      select: {
        id: true,
        name: true,
        slug: true,
        shopifySlug: true,
        price: true,
        salePrice: true,
        description: true,
        images: true,
      },
    })

    // If no products found with specific search, get general products
    let resultProducts = products
    if (products.length === 0) {
      resultProducts = await prisma.product.findMany({
        where: { inStock: true },
        orderBy: { createdAt: 'desc' },
        take: maxResults,
        select: {
          id: true,
          name: true,
          slug: true,
          shopifySlug: true,
          price: true,
          salePrice: true,
          description: true,
          images: true,
        },
      })
    }

    // Limit to requested number
    const finalProducts = resultProducts.slice(0, maxResults)

    return JSON.stringify({
      products: finalProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        salePrice: p.salePrice,
        description: p.description?.substring(0, 150) + '...',
        image: p.images[0] || null,
      })),
      count: finalProducts.length,
      searchCriteria: { conditions, skinType },
      note: `Found ${finalProducts.length} products suitable for ${skinType} skin with ${conditions.join(', ')}`,
    })
  } catch (error) {
    console.error('[TOOL] Product lookup error:', error)
    return JSON.stringify({
      products: [],
      count: 0,
      error: 'Failed to search products',
    })
  }
}

/**
 * Check ingredient compatibility
 */
async function handleIngredientCompatibility(
  input: IngredientCompatibilityInput
): Promise<string> {
  const { ingredients } = input
  const normalizedIngredients = ingredients.map(i => i.toLowerCase().trim())

  const results: Array<{
    pair: [string, string]
    compatible: boolean
    note: string
  }> = []

  // Check each pair of ingredients
  for (let i = 0; i < normalizedIngredients.length; i++) {
    for (let j = i + 1; j < normalizedIngredients.length; j++) {
      const ing1 = normalizedIngredients[i]
      const ing2 = normalizedIngredients[j]

      const ing1Data = INGREDIENT_INTERACTIONS[ing1]
      const ing2Data = INGREDIENT_INTERACTIONS[ing2]

      let compatible = true
      let note = 'Safe to use together'

      // Check for conflicts
      if (ing1Data?.conflicts.some(c => ing2.includes(c) || c.includes(ing2))) {
        compatible = false
        note = 'Not recommended together - may cause irritation or reduce effectiveness'
      } else if (ing2Data?.conflicts.some(c => ing1.includes(c) || c.includes(ing1))) {
        compatible = false
        note = 'Not recommended together - may cause irritation or reduce effectiveness'
      } else if (ing1Data?.enhances.some(e => ing2.includes(e) || e.includes(ing2))) {
        note = 'Great combination - these ingredients enhance each other'
      } else if (ing2Data?.enhances.some(e => ing1.includes(e) || e.includes(ing1))) {
        note = 'Great combination - these ingredients enhance each other'
      }

      results.push({ pair: [ing1, ing2], compatible, note })
    }
  }

  // Check if all are compatible
  const allCompatible = results.every(r => r.compatible)
  const conflictCount = results.filter(r => !r.compatible).length

  return JSON.stringify({
    ingredients: normalizedIngredients,
    interactions: results,
    allCompatible,
    summary: allCompatible
      ? 'All ingredients are compatible and can be used together safely.'
      : `Found ${conflictCount} potential conflict(s). Consider using conflicting ingredients at different times (AM/PM).`,
  })
}

/**
 * Build a personalized skincare routine
 */
async function handleBuildRoutine(input: BuildRoutineInput): Promise<string> {
  const { skinType, conditions, priority } = input

  // Define routine structure based on skin type
  const routine = {
    morning: {
      steps: [] as Array<{ step: number; category: string; purpose: string; optional?: boolean }>,
      notes: [] as string[],
    },
    evening: {
      steps: [] as Array<{ step: number; category: string; purpose: string; optional?: boolean }>,
      notes: [] as string[],
    },
    weeklyTreatments: [] as string[],
    keyIngredients: [] as string[],
  }

  // Morning routine (always starts with cleanse, ends with SPF)
  routine.morning.steps = [
    { step: 1, category: 'Cleanser', purpose: 'Remove overnight buildup gently' },
    { step: 2, category: 'Toner', purpose: 'Balance pH and prep skin', optional: true },
    { step: 3, category: 'Serum', purpose: 'Deliver active ingredients (Vitamin C recommended)' },
    { step: 4, category: 'Moisturizer', purpose: 'Hydrate and protect' },
    { step: 5, category: 'Sunscreen', purpose: 'UV protection (essential, SPF 30+)' },
  ]

  // Evening routine (includes treatment products)
  routine.evening.steps = [
    { step: 1, category: 'Cleanser', purpose: 'Remove makeup and sunscreen' },
    {
      step: 2,
      category: 'Cleanser (optional)',
      purpose: 'Double cleanse if wearing makeup',
      optional: true,
    },
    { step: 3, category: 'Treatment', purpose: 'Active ingredients (retinol, acids)' },
    { step: 4, category: 'Serum', purpose: 'Target specific concerns' },
    { step: 5, category: 'Eye Cream', purpose: 'Delicate eye area care', optional: true },
    { step: 6, category: 'Moisturizer', purpose: 'Repair and hydrate overnight' },
  ]

  // Add skin-type specific notes
  switch (skinType) {
    case 'oily':
      routine.morning.notes.push('Use a gel or foam cleanser')
      routine.morning.notes.push('Opt for oil-free, mattifying products')
      routine.keyIngredients.push('Niacinamide', 'Salicylic Acid', 'Hyaluronic Acid')
      break
    case 'dry':
      routine.morning.notes.push('Use a cream or milk cleanser')
      routine.morning.notes.push('Layer hydrating products')
      routine.keyIngredients.push('Hyaluronic Acid', 'Ceramides', 'Squalane')
      break
    case 'combination':
      routine.morning.notes.push('Use a gentle gel cleanser')
      routine.morning.notes.push('Apply lighter products to T-zone, richer to cheeks')
      routine.keyIngredients.push('Niacinamide', 'Hyaluronic Acid')
      break
    case 'sensitive':
      routine.morning.notes.push('Use fragrance-free, gentle products')
      routine.morning.notes.push('Patch test new products')
      routine.keyIngredients.push('Centella Asiatica', 'Ceramides', 'Aloe Vera')
      break
    case 'normal':
      routine.morning.notes.push('Maintain with balanced products')
      routine.keyIngredients.push('Antioxidants', 'Peptides')
      break
  }

  // Add condition-specific treatments
  if (conditions.includes('acne')) {
    routine.weeklyTreatments.push('Clay mask (1-2x weekly)')
    routine.evening.notes.push('Consider salicylic acid or benzoyl peroxide spot treatment')
  }
  if (conditions.includes('dryness') || conditions.includes('dehydration')) {
    routine.weeklyTreatments.push('Hydrating sheet mask (2-3x weekly)')
  }
  if (conditions.includes('dullness') || conditions.includes('uneven_texture')) {
    routine.weeklyTreatments.push('Chemical exfoliant (1-2x weekly)')
  }
  if (conditions.includes('fine_lines') || conditions.includes('wrinkles')) {
    routine.evening.notes.push('Incorporate retinol 2-3x weekly, building up frequency')
    routine.keyIngredients.push('Retinol', 'Peptides')
  }
  if (conditions.includes('hyperpigmentation')) {
    routine.morning.notes.push('Use Vitamin C serum in the morning')
    routine.keyIngredients.push('Vitamin C', 'Alpha Arbutin', 'Niacinamide')
  }

  return JSON.stringify({
    routine,
    skinType,
    targetedConditions: conditions,
    priority: priority || 'general skin health',
    importantNote:
      'Introduce new products one at a time, waiting 1-2 weeks between additions to identify any reactions.',
  })
}

/**
 * Get ingredient benefits
 */
async function handleIngredientBenefits(
  input: IngredientBenefitsInput
): Promise<string> {
  const ingredient = input.ingredient.toLowerCase().trim()

  // Try to find exact match first
  let data = INGREDIENT_BENEFITS[ingredient]

  // If not found, try partial match
  if (!data) {
    const keys = Object.keys(INGREDIENT_BENEFITS)
    const partialMatch = keys.find(
      k => k.includes(ingredient) || ingredient.includes(k)
    )
    if (partialMatch) {
      data = INGREDIENT_BENEFITS[partialMatch]
    }
  }

  if (!data) {
    return JSON.stringify({
      ingredient,
      found: false,
      message: `Information for "${ingredient}" not in database. Consult a dermatologist for specific advice.`,
      suggestion: 'Try searching for: ' + Object.keys(INGREDIENT_BENEFITS).join(', '),
    })
  }

  // Get interaction info if available
  const interactions = INGREDIENT_INTERACTIONS[ingredient]

  return JSON.stringify({
    ingredient,
    found: true,
    ...data,
    interactions: interactions
      ? {
          conflicts: interactions.conflicts,
          enhances: interactions.enhances,
          notes: interactions.notes,
        }
      : null,
  })
}
