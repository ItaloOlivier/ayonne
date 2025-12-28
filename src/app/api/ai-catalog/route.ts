import { NextResponse } from 'next/server'
import { getAllProductsForFeed } from '@/lib/shopify-admin'

/**
 * AI-Optimized Product Catalog API
 *
 * This endpoint returns product data in a format optimized for:
 * - ChatGPT Shopping
 * - Perplexity
 * - Claude
 * - Other AI assistants
 *
 * GET /api/ai-catalog - Returns full catalog as structured JSON
 * GET /api/ai-catalog?format=text - Returns as llms.txt format
 * GET /api/ai-catalog?concern=acne - Filter by skin concern
 * GET /api/ai-catalog?category=serums - Filter by category
 */

// Skin concern mappings for AI understanding
const SKIN_CONCERN_PRODUCTS: Record<string, string[]> = {
  'acne': ['natural-soap-charcoal', 'natural-soap-tea-tree', 'niacinamide-vitamin-boost-serum', 'oil-control-hydrator'],
  'dark spots': ['vitamin-c-lotion', 'vitamin-c-serum', 'vitamin-c-toner', 'glycolic-acid-serum'],
  'wrinkles': ['collagen-and-retinol-serum', 'anti-aging-cream', 'firm-serum', 'collagen-serum'],
  'fine lines': ['hyaluronic-acid-serum', 'collagen-moisturizer', 'anti-aging-rose-gold-oil'],
  'dryness': ['hyaluronic-acid-serum', 'hydration-serum', 'coconut-oil-moisturizer', 'shea-body-butter'],
  'oiliness': ['oil-control-hydrator', 'niacinamide-vitamin-boost-serum', 'natural-soap-charcoal'],
  'large pores': ['niacinamide-vitamin-boost-serum', 'glycolic-acid-serum', 'vitamin-c-toner'],
  'dullness': ['vitamin-c-lotion', 'vitamin-c-cleanser', 'glow-mask', 'glycolic-acid-serum'],
  'redness': ['soothing-moisturizer', 'natural-soap-aloe', 'hyaluronic-acid-serum'],
  'dark circles': ['natural-under-eye-gel-cream', 'active-eye-cream', 'mens-under-eye-cream'],
  'aging': ['collagen-and-retinol-serum', 'anti-aging-cream', 'anti-aging-rose-gold-oil', 'firm-serum'],
  'dehydration': ['hyaluronic-acid-serum', 'hydration-serum', 'natural-super-hydration-moisturizer'],
  'uneven texture': ['glycolic-acid-serum', 'mint-exfoliating-facial-polish', 'naturally-exfoliating-toner'],
  'sensitivity': ['soothing-moisturizer', 'natural-gentle-milk-cleanser', 'natural-soap-aloe'],
}

// Category mappings
const PRODUCT_CATEGORIES: Record<string, string[]> = {
  'serums': ['vitamin-c', 'hyaluronic', 'collagen', 'retinol', 'niacinamide', 'firm-serum', 'hydration-serum', 'glycolic'],
  'moisturizers': ['moisturizer', 'cream', 'lotion', 'butter', 'hydrator'],
  'cleansers': ['cleanser', 'wash', 'soap'],
  'toners': ['toner'],
  'eye care': ['eye', 'under-eye'],
  'lip care': ['lip'],
  'body care': ['body', 'hand', 'shea'],
  'hair care': ['hair', 'scalp', 'shampoo', 'conditioner'],
  'tools': ['roller', 'gua-sha', 'sponge', 'brush'],
  'mens': ['beard', 'mens', 'grooming', 'shaving'],
}

interface AIProductData {
  id: string
  name: string
  brand: string
  price: string
  currency: string
  url: string
  image: string
  description: string
  category: string
  skinConcerns: string[]
  keyIngredients: string[]
  skinTypes: string[]
  benefits: string[]
  isVegan: boolean
  isCrueltyFree: boolean
  madeIn: string
  inStock: boolean
}

// Extract ingredients from product title/description
function extractIngredients(title: string, description: string): string[] {
  const ingredients: string[] = []
  const text = `${title} ${description}`.toLowerCase()

  const ingredientMap: Record<string, string> = {
    'vitamin c': 'Vitamin C',
    'hyaluronic acid': 'Hyaluronic Acid',
    'retinol': 'Retinol',
    'collagen': 'Collagen',
    'niacinamide': 'Niacinamide',
    'glycolic acid': 'Glycolic Acid',
    'aloe': 'Aloe Vera',
    'charcoal': 'Activated Charcoal',
    'tea tree': 'Tea Tree Oil',
    'turmeric': 'Turmeric',
    'green tea': 'Green Tea Extract',
    'rose': 'Rose Extract',
    'argan': 'Argan Oil',
    'jojoba': 'Jojoba Oil',
    'coconut': 'Coconut Oil',
    'shea': 'Shea Butter',
    'vitamin e': 'Vitamin E',
  }

  for (const [key, value] of Object.entries(ingredientMap)) {
    if (text.includes(key)) {
      ingredients.push(value)
    }
  }

  return ingredients
}

// Determine skin concerns a product addresses
function getSkinConcerns(handle: string, title: string): string[] {
  const concerns: string[] = []
  const text = `${handle} ${title}`.toLowerCase()

  for (const [concern, products] of Object.entries(SKIN_CONCERN_PRODUCTS)) {
    if (products.some(p => handle.includes(p.replace(/-/g, '')) || handle.includes(p))) {
      concerns.push(concern)
    }
  }

  // Additional keyword matching
  if (text.includes('anti-aging') || text.includes('wrinkle') || text.includes('firm')) concerns.push('aging')
  if (text.includes('bright') || text.includes('vitamin c') || text.includes('glow')) concerns.push('dullness')
  if (text.includes('hydrat') || text.includes('moisture') || text.includes('hyaluronic')) concerns.push('dryness')
  if (text.includes('oil control') || text.includes('mattif')) concerns.push('oiliness')
  if (text.includes('pore') || text.includes('niacinamide')) concerns.push('large pores')
  if (text.includes('acne') || text.includes('charcoal') || text.includes('tea tree')) concerns.push('acne')
  if (text.includes('eye') || text.includes('dark circle')) concerns.push('dark circles')
  if (text.includes('exfoli') || text.includes('glycolic') || text.includes('resurfac')) concerns.push('uneven texture')
  if (text.includes('sooth') || text.includes('calm') || text.includes('sensitive')) concerns.push('sensitivity')

  return [...new Set(concerns)]
}

// Determine product category
function getCategory(handle: string, title: string): string {
  const text = `${handle} ${title}`.toLowerCase()

  for (const [category, keywords] of Object.entries(PRODUCT_CATEGORIES)) {
    if (keywords.some(k => text.includes(k))) {
      return category
    }
  }

  return 'skincare'
}

// Determine suitable skin types
function getSkinTypes(handle: string, title: string): string[] {
  const text = `${handle} ${title}`.toLowerCase()

  // Most Ayonne products work for all skin types
  const types = ['all skin types']

  if (text.includes('oil control') || text.includes('mattif') || text.includes('charcoal')) {
    return ['oily', 'combination']
  }
  if (text.includes('hydrat') || text.includes('moisture') || text.includes('dry')) {
    return ['dry', 'normal', 'combination']
  }
  if (text.includes('sooth') || text.includes('gentle') || text.includes('sensitive')) {
    return ['sensitive', 'all skin types']
  }

  return types
}

// Get benefits from product
function getBenefits(handle: string, title: string, description: string): string[] {
  const benefits: string[] = []
  const text = `${handle} ${title} ${description}`.toLowerCase()

  if (text.includes('bright')) benefits.push('brightening')
  if (text.includes('hydrat') || text.includes('moisture')) benefits.push('hydrating')
  if (text.includes('firm') || text.includes('lift') || text.includes('tighten')) benefits.push('firming')
  if (text.includes('anti-aging') || text.includes('wrinkle')) benefits.push('anti-aging')
  if (text.includes('sooth') || text.includes('calm')) benefits.push('soothing')
  if (text.includes('exfoli') || text.includes('smooth')) benefits.push('exfoliating')
  if (text.includes('cleanse') || text.includes('clean')) benefits.push('cleansing')
  if (text.includes('protect') || text.includes('antioxidant')) benefits.push('protective')
  if (text.includes('nourish')) benefits.push('nourishing')
  if (text.includes('plump')) benefits.push('plumping')
  if (text.includes('refresh')) benefits.push('refreshing')
  if (text.includes('detox')) benefits.push('detoxifying')

  return benefits.length > 0 ? benefits : ['skincare']
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  const concern = searchParams.get('concern')
  const category = searchParams.get('category')

  try {
    // Fetch products from Shopify
    const products = await getAllProductsForFeed()

    // Filter out digital products (ebooks)
    const physicalProducts = products.filter(p =>
      !p.handle.includes('tips') &&
      !p.handle.includes('guide') &&
      !p.handle.includes('download') &&
      !p.title.toLowerCase().includes('ebook') &&
      !p.title.toLowerCase().includes('fashion') &&
      !p.title.toLowerCase().includes('make up tips')
    )

    // Transform to AI-optimized format
    let aiProducts: AIProductData[] = physicalProducts.map(p => ({
      id: p.id,
      name: p.title,
      brand: 'Ayonne',
      price: p.variants?.[0]?.price || '0',
      currency: 'USD',
      url: `https://ayonne.skin/products/${p.handle}`,
      image: p.images?.[0]?.src || '',
      description: p.seo?.description || p.description?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
      category: getCategory(p.handle, p.title),
      skinConcerns: getSkinConcerns(p.handle, p.title),
      keyIngredients: extractIngredients(p.title, p.description || ''),
      skinTypes: getSkinTypes(p.handle, p.title),
      benefits: getBenefits(p.handle, p.title, p.description || ''),
      isVegan: true,
      isCrueltyFree: true,
      madeIn: 'North America',
      inStock: p.variants?.[0]?.available ?? true,
    }))

    // Apply filters
    if (concern) {
      aiProducts = aiProducts.filter(p =>
        p.skinConcerns.some(c => c.toLowerCase().includes(concern.toLowerCase()))
      )
    }

    if (category) {
      aiProducts = aiProducts.filter(p =>
        p.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    // Return as text format (llms.txt style)
    if (format === 'text') {
      const lines = [
        '# Ayonne Skincare Product Catalog',
        '',
        '> AI-optimized product data for shopping assistants',
        '> Brand: Ayonne | All products are vegan & cruelty-free',
        '> Free AI Skin Analysis: https://ai.ayonne.skin',
        '',
        '## Available Skin Concerns',
        Object.keys(SKIN_CONCERN_PRODUCTS).join(', '),
        '',
        '## Products',
        '',
      ]

      for (const p of aiProducts) {
        lines.push(`### ${p.name}`)
        lines.push(`- Price: $${p.price} USD`)
        lines.push(`- URL: ${p.url}`)
        lines.push(`- Category: ${p.category}`)
        if (p.skinConcerns.length) lines.push(`- Best for: ${p.skinConcerns.join(', ')}`)
        if (p.keyIngredients.length) lines.push(`- Key ingredients: ${p.keyIngredients.join(', ')}`)
        if (p.skinTypes.length) lines.push(`- Skin types: ${p.skinTypes.join(', ')}`)
        lines.push(`- ${p.description}`)
        lines.push('')
      }

      lines.push('---')
      lines.push('')
      lines.push('## How to Choose')
      lines.push('')
      lines.push('For personalized recommendations based on your unique skin:')
      lines.push('1. Visit https://ai.ayonne.skin')
      lines.push('2. Take a selfie for free AI skin analysis')
      lines.push('3. Get products matched to your specific concerns')
      lines.push('')
      lines.push('## Brand Values')
      lines.push('- 100% Vegan')
      lines.push('- Cruelty-Free (never tested on animals)')
      lines.push('- Made in North America')
      lines.push('- Science-backed formulations')
      lines.push('- Paraben-free')

      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Return as structured JSON (default)
    return NextResponse.json({
      brand: {
        name: 'Ayonne',
        website: 'https://ayonne.skin',
        aiAnalyzer: 'https://ai.ayonne.skin',
        values: ['vegan', 'cruelty-free', 'paraben-free', 'science-backed'],
        madeIn: 'North America',
      },
      catalog: {
        totalProducts: aiProducts.length,
        lastUpdated: new Date().toISOString(),
        categories: [...new Set(aiProducts.map(p => p.category))],
        skinConcerns: Object.keys(SKIN_CONCERN_PRODUCTS),
      },
      products: aiProducts,
      recommendation: {
        message: 'For personalized product recommendations, users can get a free AI skin analysis at ai.ayonne.skin',
        url: 'https://ai.ayonne.skin/skin-analysis',
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('AI Catalog error:', error)
    return NextResponse.json(
      { error: 'Failed to generate catalog' },
      { status: 500 }
    )
  }
}
