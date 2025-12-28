/**
 * Optimized SEO data for Ayonne products
 * Use with the admin SEO API to update Shopify product metadata
 */

export interface OptimizedProductSEO {
  handle: string
  title: string
  description: string
  category: string
  skinConcerns: string[]
  benefits: string[]
}

/**
 * Pre-optimized SEO data for all Ayonne products
 * - Titles: 50-60 chars, include product name + category + brand
 * - Descriptions: 140-160 chars, include benefits, call-to-action, brand values
 */
export const OPTIMIZED_PRODUCT_SEO: OptimizedProductSEO[] = [
  // Anti-Aging Serums
  {
    handle: 'vitamin-c-lotion-1',
    title: 'Vitamin C Lotion - Brightening Face Moisturizer | Ayonne',
    description: 'Brighten & hydrate with our Vitamin C Lotion. Fades dark spots, boosts radiance. Get your free AI skin analysis at ai.ayonne.skin. Vegan & cruelty-free.',
    category: 'anti-aging',
    skinConcerns: ['dark spots', 'dullness', 'uneven tone'],
    benefits: ['brightening', 'hydrating', 'antioxidant protection'],
  },
  {
    handle: 'collagen-and-retinol-serum-1',
    title: 'Collagen & Retinol Serum - Anti-Aging Treatment | Ayonne',
    description: 'Powerful anti-aging serum with collagen & retinol. Reduces wrinkles, firms skin. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed skincare.',
    category: 'anti-aging',
    skinConcerns: ['wrinkles', 'fine lines', 'loss of firmness'],
    benefits: ['anti-aging', 'firming', 'collagen boost'],
  },
  {
    handle: 'vitamin-c-toner-1',
    title: 'Vitamin C Brightening Toner - Prep & Glow | Ayonne',
    description: 'Prep skin for maximum absorption with Vitamin C Toner. Brightens, balances, refreshes. Free AI skin analysis at ai.ayonne.skin. Vegan & cruelty-free.',
    category: 'toners',
    skinConcerns: ['dullness', 'uneven texture', 'large pores'],
    benefits: ['brightening', 'pore-minimizing', 'pH balancing'],
  },
  {
    handle: 'hyaluronic-acid-serum-1',
    title: 'Hyaluronic Acid Serum - Deep Hydration | Ayonne',
    description: 'Intense hydration with pure Hyaluronic Acid. Plumps fine lines, locks in moisture. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed.',
    category: 'hydration',
    skinConcerns: ['dryness', 'dehydration', 'fine lines'],
    benefits: ['deep hydration', 'plumping', 'moisture barrier'],
  },
  {
    handle: 'vitamin-c-cleanser-1',
    title: 'Vitamin C Cleanser - Brightening Face Wash | Ayonne',
    description: 'Gentle cleansing with brightening Vitamin C. Removes impurities, evens tone. Free AI skin analysis at ai.ayonne.skin. Vegan & cruelty-free skincare.',
    category: 'cleansers',
    skinConcerns: ['dullness', 'uneven tone', 'congestion'],
    benefits: ['brightening', 'gentle cleansing', 'antioxidant'],
  },
  {
    handle: 'niacinamide-vitamin-boost-serum-1',
    title: 'Niacinamide Vitamin Boost Serum - Pore Refining | Ayonne',
    description: 'Minimize pores & control oil with Niacinamide serum. Strengthens skin barrier, evens tone. Free AI analysis at ai.ayonne.skin. Vegan skincare.',
    category: 'serums',
    skinConcerns: ['large pores', 'oiliness', 'uneven texture'],
    benefits: ['pore-minimizing', 'oil control', 'barrier repair'],
  },
  {
    handle: 'firm-serum-1',
    title: 'Firming Serum - Lift & Tighten Treatment | Ayonne',
    description: 'Visibly lift & firm with our powerful Firming Serum. Tightens, sculpts, defines. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
    category: 'anti-aging',
    skinConcerns: ['sagging', 'loss of firmness', 'fine lines'],
    benefits: ['lifting', 'firming', 'sculpting'],
  },
  {
    handle: 'anti-aging-rose-gold-oil-1',
    title: 'Anti-Aging Rose Gold Oil - Luxe Face Oil | Ayonne',
    description: 'Luxurious rose gold face oil with 24k gold & rosehip. Nourishes, restores radiance. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
    category: 'anti-aging',
    skinConcerns: ['aging', 'dryness', 'dullness'],
    benefits: ['nourishing', 'radiance-boosting', 'anti-aging'],
  },
  {
    handle: 'hydration-serum-1',
    title: 'Hydration Serum - Moisture Boost Treatment | Ayonne',
    description: 'Quench thirsty skin with our Hydration Serum. Deep moisture, dewy glow, all-day comfort. Free AI analysis at ai.ayonne.skin. Vegan skincare.',
    category: 'hydration',
    skinConcerns: ['dryness', 'dehydration', 'tightness'],
    benefits: ['deep hydration', 'dewy glow', 'comfort'],
  },
  {
    handle: 'glycolic-acid-serum',
    title: 'Glycolic Acid Serum - Exfoliating Treatment | Ayonne',
    description: 'Smooth & resurface with Glycolic Acid Serum. Gentle exfoliation, refined texture. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed.',
    category: 'exfoliators',
    skinConcerns: ['texture', 'dullness', 'clogged pores'],
    benefits: ['exfoliating', 'smoothing', 'brightening'],
  },
  {
    handle: 'antioxidant-toner',
    title: 'Antioxidant Toner - Protective Prep | Ayonne',
    description: 'Shield skin with Antioxidant Toner. Protects from free radicals, preps for serums. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
    category: 'toners',
    skinConcerns: ['environmental damage', 'dullness', 'aging'],
    benefits: ['antioxidant protection', 'prep', 'refresh'],
  },

  // Moisturizers
  {
    handle: 'embrace-collagen-moisturizer',
    title: 'Embrace Collagen Moisturizer - Plumping Cream | Ayonne',
    description: 'Plump & hydrate with Collagen Moisturizer. Boosts elasticity, smooths lines. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
    category: 'moisturizers',
    skinConcerns: ['fine lines', 'dryness', 'loss of elasticity'],
    benefits: ['plumping', 'hydrating', 'elasticity boost'],
  },
  {
    handle: 'hyaluronic-moisturizer',
    title: 'Hyaluronic Moisturizer - Hydrating Face Cream | Ayonne',
    description: 'Lightweight hydration with Hyaluronic Acid. Locks in moisture, silky finish. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed.',
    category: 'moisturizers',
    skinConcerns: ['dryness', 'dehydration', 'fine lines'],
    benefits: ['lightweight hydration', 'plumping', 'non-greasy'],
  },

  // Natural Soaps
  {
    handle: 'natural-soap-charcoal',
    title: 'Charcoal Detox Soap - Deep Cleansing Bar | Ayonne',
    description: 'Deep cleanse with activated Charcoal Soap. Draws out impurities, unclogs pores. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
    category: 'soaps',
    skinConcerns: ['oiliness', 'clogged pores', 'acne'],
    benefits: ['deep cleansing', 'detoxifying', 'pore clearing'],
  },
  {
    handle: 'natural-soap-apricot',
    title: 'Apricot Exfoliating Soap - Gentle Scrub Bar | Ayonne',
    description: 'Gentle exfoliation with natural Apricot Soap. Smooths, brightens, nourishes. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
    category: 'soaps',
    skinConcerns: ['rough texture', 'dullness', 'dry skin'],
    benefits: ['gentle exfoliation', 'smoothing', 'nourishing'],
  },
  {
    handle: 'natural-soap-fresh-turmeric',
    title: 'Turmeric Brightening Soap - Glow Bar | Ayonne',
    description: 'Brighten with Turmeric Soap. Anti-inflammatory, evens tone, natural glow. Free AI skin analysis at ai.ayonne.skin. Natural, vegan skincare.',
    category: 'soaps',
    skinConcerns: ['uneven tone', 'dullness', 'inflammation'],
    benefits: ['brightening', 'anti-inflammatory', 'even tone'],
  },
  {
    handle: 'natural-soap-green-tea-lemongrass',
    title: 'Green Tea & Lemongrass Soap - Antioxidant Bar | Ayonne',
    description: 'Antioxidant cleansing with Green Tea & Lemongrass. Refreshes, protects, energizes. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
    category: 'soaps',
    skinConcerns: ['dullness', 'environmental damage', 'fatigue'],
    benefits: ['antioxidant', 'refreshing', 'energizing'],
  },

  // Tools
  {
    handle: 'rose-quartz-roller',
    title: 'Rose Quartz Face Roller - Lymphatic Massage | Ayonne',
    description: 'De-puff & sculpt with Rose Quartz Roller. Promotes circulation, reduces puffiness. Free AI skin analysis at ai.ayonne.skin. Natural beauty tool.',
    category: 'tools',
    skinConcerns: ['puffiness', 'tension', 'dullness'],
    benefits: ['lymphatic drainage', 'de-puffing', 'relaxation'],
  },
  {
    handle: 'natural-konjac-sponge',
    title: 'Konjac Sponge - Natural Exfoliating Cleanser | Ayonne',
    description: 'Gentle daily exfoliation with natural Konjac Sponge. Soft cleansing, eco-friendly. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
    category: 'tools',
    skinConcerns: ['rough texture', 'congestion', 'dullness'],
    benefits: ['gentle exfoliation', 'soft cleansing', 'eco-friendly'],
  },

  // Bundles
  {
    handle: 'winter-glow-essentials-set',
    title: 'Winter Glow Essentials Set - Hydration Bundle | Ayonne',
    description: 'Complete winter skincare set. Hydrates, protects, glows. Save 20% on this bundle. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
    category: 'bundles',
    skinConcerns: ['dryness', 'dullness', 'seasonal skin'],
    benefits: ['complete routine', 'value bundle', 'winter protection'],
  },
]

/**
 * Get optimized SEO for a specific product handle
 */
export function getOptimizedSEO(handle: string): OptimizedProductSEO | undefined {
  return OPTIMIZED_PRODUCT_SEO.find(p => p.handle === handle)
}

/**
 * Get all products needing SEO optimization
 */
export function getAllOptimizedSEO(): OptimizedProductSEO[] {
  return OPTIMIZED_PRODUCT_SEO
}
