import { NextRequest, NextResponse } from 'next/server'
import { SHOPIFY_PRODUCT_MAP } from '@/lib/shopify-products'

// Product ingredient mapping based on Ayonne products
const PRODUCT_INGREDIENTS: Record<string, {
  activeIngredients: string[]
  category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'treatment' | 'eye' | 'mask' | 'oil'
  timing: 'am' | 'pm' | 'both'
  isExfoliating?: boolean
}> = {
  'vitamin-c-cleanser': {
    activeIngredients: ['vitamin c'],
    category: 'cleanser',
    timing: 'both',
  },
  'kale-face-cleanser': {
    activeIngredients: ['antioxidants'],
    category: 'cleanser',
    timing: 'both',
  },
  'makeup-remover-solution': {
    activeIngredients: [],
    category: 'cleanser',
    timing: 'pm',
  },
  'vitamin-c-toner': {
    activeIngredients: ['vitamin c', 'hyaluronic acid'],
    category: 'toner',
    timing: 'am',
  },
  'antioxidant-toner': {
    activeIngredients: ['antioxidants', 'niacinamide'],
    category: 'toner',
    timing: 'both',
  },
  'vitamin-c-lotion': {
    activeIngredients: ['vitamin c'],
    category: 'serum',
    timing: 'am',
  },
  'collagen-and-retinol-serum': {
    activeIngredients: ['retinol', 'collagen', 'peptides'],
    category: 'serum',
    timing: 'pm',
  },
  'hyaluronic-acid-serum': {
    activeIngredients: ['hyaluronic acid'],
    category: 'serum',
    timing: 'both',
  },
  'niacinamide-vitamin-boost-serum': {
    activeIngredients: ['niacinamide', 'vitamin c', 'vitamin b5'],
    category: 'serum',
    timing: 'both',
  },
  'firm-serum': {
    activeIngredients: ['peptides', 'dmae'],
    category: 'serum',
    timing: 'both',
  },
  'firming-serum': {
    activeIngredients: ['peptides', 'dmae'],
    category: 'serum',
    timing: 'both',
  },
  'hydration-serum': {
    activeIngredients: ['hyaluronic acid', 'aloe'],
    category: 'serum',
    timing: 'both',
  },
  'glycolic-acid-serum': {
    activeIngredients: ['glycolic acid', 'aha'],
    category: 'serum',
    timing: 'pm',
    isExfoliating: true,
  },
  'embrace-collagen-moisturizer': {
    activeIngredients: ['collagen', 'peptides'],
    category: 'moisturizer',
    timing: 'both',
  },
  'hyaluronic-moisturizer': {
    activeIngredients: ['hyaluronic acid'],
    category: 'moisturizer',
    timing: 'both',
  },
  'soothing-moisturizer': {
    activeIngredients: ['aloe', 'ceramides'],
    category: 'moisturizer',
    timing: 'both',
  },
  'oil-control-hydrator': {
    activeIngredients: ['niacinamide', 'salicylic acid'],
    category: 'moisturizer',
    timing: 'both',
  },
  'active-eye-cream': {
    activeIngredients: ['caffeine', 'peptides', 'retinol'],
    category: 'eye',
    timing: 'both',
  },
  'mens-under-eye-cream': {
    activeIngredients: ['caffeine', 'peptides'],
    category: 'eye',
    timing: 'both',
  },
  'anti-aging-rose-gold-oil': {
    activeIngredients: ['rosehip oil', 'vitamin e'],
    category: 'oil',
    timing: 'pm',
  },
  'glow-mask': {
    activeIngredients: ['kaolin', 'charcoal'],
    category: 'mask',
    timing: 'pm',
  },
  'mint-exfoliating-facial-polish': {
    activeIngredients: ['walnut shell'],
    category: 'treatment',
    timing: 'pm',
    isExfoliating: true,
  },
}

// Ingredient conflict rules
const INGREDIENT_CONFLICTS: Array<{
  ingredients: [string, string]
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  solution: string
}> = [
  {
    ingredients: ['vitamin c', 'retinol'],
    severity: 'high',
    title: 'Vitamin C + Retinol Conflict',
    description: 'These ingredients can destabilize each other and cause irritation when used together.',
    solution: 'Use Vitamin C in the morning and Retinol at night.',
  },
  {
    ingredients: ['retinol', 'aha'],
    severity: 'high',
    title: 'Retinol + AHA Over-Exfoliation Risk',
    description: 'Using both can cause excessive exfoliation, leading to irritation and sensitivity.',
    solution: 'Alternate nights between retinol and AHA, or use AHA only 1-2x per week.',
  },
  {
    ingredients: ['retinol', 'glycolic acid'],
    severity: 'high',
    title: 'Retinol + Glycolic Acid Conflict',
    description: 'Both are potent exfoliants that can damage the skin barrier when combined.',
    solution: 'Use on alternate nights, not together.',
  },
  {
    ingredients: ['retinol', 'salicylic acid'],
    severity: 'medium',
    title: 'Retinol + Salicylic Acid Caution',
    description: 'Can increase dryness and irritation, especially for sensitive skin.',
    solution: 'Use salicylic acid in the morning, retinol at night.',
  },
  {
    ingredients: ['vitamin c', 'aha'],
    severity: 'medium',
    title: 'Vitamin C + AHA pH Conflict',
    description: 'Both work at low pH levels and may reduce each other\'s effectiveness.',
    solution: 'Wait 30 minutes between applications, or use at different times of day.',
  },
  {
    ingredients: ['vitamin c', 'glycolic acid'],
    severity: 'medium',
    title: 'Vitamin C + Glycolic Acid',
    description: 'Similar pH requirements may cause instability and irritation.',
    solution: 'Use Vitamin C in AM, Glycolic Acid in PM.',
  },
  {
    ingredients: ['niacinamide', 'vitamin c'],
    severity: 'low',
    title: 'Niacinamide + Vitamin C',
    description: 'Old research suggested conflicts, but modern formulations work well together.',
    solution: 'Safe to use together. Wait a few minutes between layers if sensitive.',
  },
]

// Synergistic combinations
const SYNERGIES: Array<{
  ingredients: [string, string]
  title: string
  description: string
}> = [
  {
    ingredients: ['hyaluronic acid', 'vitamin c'],
    title: 'Hydration + Brightening Boost',
    description: 'Hyaluronic acid helps vitamin C penetrate better and reduces potential irritation.',
  },
  {
    ingredients: ['niacinamide', 'hyaluronic acid'],
    title: 'Barrier Strengthening Duo',
    description: 'Together they enhance hydration and strengthen the skin barrier.',
  },
  {
    ingredients: ['retinol', 'hyaluronic acid'],
    title: 'Anti-Aging + Hydration',
    description: 'Hyaluronic acid counteracts potential dryness from retinol.',
  },
  {
    ingredients: ['peptides', 'hyaluronic acid'],
    title: 'Firming + Plumping',
    description: 'Excellent combination for anti-aging and hydration.',
  },
  {
    ingredients: ['niacinamide', 'retinol'],
    title: 'Enhanced Retinol Tolerance',
    description: 'Niacinamide helps reduce retinol irritation while boosting benefits.',
  },
]

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json()

    if (!products || !Array.isArray(products) || products.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 products required' },
        { status: 400 }
      )
    }

    // Get product details
    const productDetails = products
      .map((slug: string) => ({
        slug,
        shopify: SHOPIFY_PRODUCT_MAP[slug],
        info: PRODUCT_INGREDIENTS[slug],
      }))
      .filter(p => p.shopify)

    // Collect all active ingredients
    const allIngredients = new Set<string>()
    productDetails.forEach(p => {
      p.info?.activeIngredients.forEach(ing => allIngredients.add(ing.toLowerCase()))
    })

    // Check for conflicts
    const issues: Array<{
      type: 'conflict' | 'warning' | 'timing' | 'missing'
      severity: 'high' | 'medium' | 'low'
      title: string
      description: string
      products?: string[]
    }> = []

    const suggestions: Array<{
      type: 'timing' | 'order' | 'add' | 'remove'
      title: string
      description: string
      productSlug?: string
    }> = []

    // Check ingredient conflicts
    for (const conflict of INGREDIENT_CONFLICTS) {
      const [ing1, ing2] = conflict.ingredients
      const hasIng1 = allIngredients.has(ing1)
      const hasIng2 = allIngredients.has(ing2)

      if (hasIng1 && hasIng2) {
        // Find which products contain these
        const productsWithConflict = productDetails
          .filter(p => {
            const ings = p.info?.activeIngredients.map(i => i.toLowerCase()) || []
            return ings.includes(ing1) || ings.includes(ing2)
          })
          .map(p => p.shopify?.title || p.slug)

        issues.push({
          type: 'conflict',
          severity: conflict.severity,
          title: conflict.title,
          description: conflict.description,
          products: productsWithConflict,
        })

        suggestions.push({
          type: 'timing',
          title: 'Solution',
          description: conflict.solution,
        })
      }
    }

    // Check for over-exfoliation
    const exfoliatingProducts = productDetails.filter(p => p.info?.isExfoliating)
    if (exfoliatingProducts.length > 1) {
      issues.push({
        type: 'warning',
        severity: 'high',
        title: 'Over-Exfoliation Risk',
        description: 'You have multiple exfoliating products which can damage your skin barrier.',
        products: exfoliatingProducts.map(p => p.shopify?.title || p.slug),
      })

      suggestions.push({
        type: 'timing',
        title: 'Limit Exfoliation',
        description: 'Use only one exfoliating product, 2-3 times per week maximum.',
      })
    }

    // Check for missing routine steps
    const categories = new Set(productDetails.map(p => p.info?.category).filter(Boolean))

    if (!categories.has('cleanser')) {
      issues.push({
        type: 'missing',
        severity: 'medium',
        title: 'Missing Cleanser',
        description: 'A cleanser is essential for removing dirt and preparing skin for other products.',
      })
      suggestions.push({
        type: 'add',
        title: 'Add a Cleanser',
        description: 'Start your routine with a gentle cleanser.',
        productSlug: 'vitamin-c-cleanser',
      })
    }

    if (!categories.has('moisturizer')) {
      issues.push({
        type: 'missing',
        severity: 'medium',
        title: 'Missing Moisturizer',
        description: 'Moisturizer seals in hydration and protects your skin barrier.',
      })
      suggestions.push({
        type: 'add',
        title: 'Add a Moisturizer',
        description: 'Finish your routine with a moisturizer.',
        productSlug: 'hyaluronic-moisturizer',
      })
    }

    // Check for synergies (for positive feedback)
    const synergiesFound: string[] = []
    for (const synergy of SYNERGIES) {
      const [ing1, ing2] = synergy.ingredients
      if (allIngredients.has(ing1) && allIngredients.has(ing2)) {
        synergiesFound.push(synergy.title)
      }
    }

    if (synergiesFound.length > 0) {
      suggestions.push({
        type: 'order',
        title: 'Great Combinations Found!',
        description: `Your routine includes: ${synergiesFound.join(', ')}`,
      })
    }

    // Build recommended routine order
    const morningProducts: string[] = []
    const eveningProducts: string[] = []

    // Sort by category order
    const categoryOrder: Record<string, number> = {
      cleanser: 1,
      toner: 2,
      serum: 3,
      eye: 4,
      moisturizer: 5,
      oil: 6,
      treatment: 7,
      mask: 8,
    }

    const sortedProducts = [...productDetails].sort((a, b) => {
      const orderA = categoryOrder[a.info?.category || 'treatment'] || 99
      const orderB = categoryOrder[b.info?.category || 'treatment'] || 99
      return orderA - orderB
    })

    for (const product of sortedProducts) {
      const name = product.shopify?.title || product.slug
      const timing = product.info?.timing || 'both'

      if (timing === 'am' || timing === 'both') {
        // Skip retinol and strong actives in AM
        if (!product.info?.activeIngredients.some(i =>
          ['retinol', 'glycolic acid', 'aha'].includes(i.toLowerCase())
        )) {
          morningProducts.push(name)
        }
      }

      if (timing === 'pm' || timing === 'both') {
        eveningProducts.push(name)
      }
    }

    // Add SPF reminder for morning
    if (morningProducts.length > 0) {
      morningProducts.push('SPF 30+ Sunscreen (Essential!)')
    }

    // Calculate score
    let score = 10

    // Deduct for issues
    for (const issue of issues) {
      if (issue.severity === 'high') score -= 2
      else if (issue.severity === 'medium') score -= 1
      else score -= 0.5
    }

    // Bonus for synergies
    score += Math.min(synergiesFound.length * 0.5, 1)

    // Ensure score is between 1 and 10
    score = Math.max(1, Math.min(10, Math.round(score)))

    return NextResponse.json({
      score,
      issues,
      suggestions,
      routine: {
        morning: morningProducts.length > 0 ? morningProducts : ['Add morning products'],
        evening: eveningProducts.length > 0 ? eveningProducts : ['Add evening products'],
      },
      synergies: synergiesFound,
    })
  } catch (error) {
    console.error('Routine analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
