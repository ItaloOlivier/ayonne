/**
 * Script to apply pre-optimized SEO data to Shopify products
 * Run with: npx ts-node scripts/apply-seo.ts
 */

// Inline the SEO data to avoid import issues
const OPTIMIZED_PRODUCT_SEO = [
  // Anti-Aging Serums
  {
    handle: 'vitamin-c-lotion-1',
    title: 'Vitamin C Lotion - Brightening Face Moisturizer | Ayonne',
    description: 'Brighten & hydrate with our Vitamin C Lotion. Fades dark spots, boosts radiance. Get your free AI skin analysis at ai.ayonne.skin. Vegan & cruelty-free.',
  },
  {
    handle: 'collagen-and-retinol-serum-1',
    title: 'Collagen & Retinol Serum - Anti-Aging Treatment | Ayonne',
    description: 'Powerful anti-aging serum with collagen & retinol. Reduces wrinkles, firms skin. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed skincare.',
  },
  {
    handle: 'vitamin-c-toner-1',
    title: 'Vitamin C Brightening Toner - Prep & Glow | Ayonne',
    description: 'Prep skin for maximum absorption with Vitamin C Toner. Brightens, balances, refreshes. Free AI skin analysis at ai.ayonne.skin. Vegan & cruelty-free.',
  },
  {
    handle: 'hyaluronic-acid-serum-1',
    title: 'Hyaluronic Acid Serum - Deep Hydration | Ayonne',
    description: 'Intense hydration with pure Hyaluronic Acid. Plumps fine lines, locks in moisture. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed.',
  },
  {
    handle: 'vitamin-c-cleanser-1',
    title: 'Vitamin C Cleanser - Brightening Face Wash | Ayonne',
    description: 'Gentle cleansing with brightening Vitamin C. Removes impurities, evens tone. Free AI skin analysis at ai.ayonne.skin. Vegan & cruelty-free skincare.',
  },
  {
    handle: 'niacinamide-vitamin-boost-serum-1',
    title: 'Niacinamide Vitamin Boost Serum - Pore Refining | Ayonne',
    description: 'Minimize pores & control oil with Niacinamide serum. Strengthens skin barrier, evens tone. Free AI analysis at ai.ayonne.skin. Vegan skincare.',
  },
  {
    handle: 'firm-serum-1',
    title: 'Firming Serum - Lift & Tighten Treatment | Ayonne',
    description: 'Visibly lift & firm with our powerful Firming Serum. Tightens, sculpts, defines. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
  },
  {
    handle: 'anti-aging-rose-gold-oil-1',
    title: 'Anti-Aging Rose Gold Oil - Luxe Face Oil | Ayonne',
    description: 'Luxurious rose gold face oil with 24k gold & rosehip. Nourishes, restores radiance. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
  },
  {
    handle: 'hydration-serum-1',
    title: 'Hydration Serum - Moisture Boost Treatment | Ayonne',
    description: 'Quench thirsty skin with our Hydration Serum. Deep moisture, dewy glow, all-day comfort. Free AI analysis at ai.ayonne.skin. Vegan skincare.',
  },
  {
    handle: 'glycolic-acid-serum',
    title: 'Glycolic Acid Serum - Exfoliating Treatment | Ayonne',
    description: 'Smooth & resurface with Glycolic Acid Serum. Gentle exfoliation, refined texture. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed.',
  },
  {
    handle: 'antioxidant-toner',
    title: 'Antioxidant Toner - Protective Prep | Ayonne',
    description: 'Shield skin with Antioxidant Toner. Protects from free radicals, preps for serums. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  // Moisturizers
  {
    handle: 'embrace-collagen-moisturizer',
    title: 'Embrace Collagen Moisturizer - Plumping Cream | Ayonne',
    description: 'Plump & hydrate with Collagen Moisturizer. Boosts elasticity, smooths lines. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
  },
  {
    handle: 'hyaluronic-moisturizer',
    title: 'Hyaluronic Moisturizer - Hydrating Face Cream | Ayonne',
    description: 'Lightweight hydration with Hyaluronic Acid. Locks in moisture, silky finish. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed.',
  },
  // Natural Soaps
  {
    handle: 'natural-soap-charcoal',
    title: 'Charcoal Detox Soap - Deep Cleansing Bar | Ayonne',
    description: 'Deep cleanse with activated Charcoal Soap. Draws out impurities, unclogs pores. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  {
    handle: 'natural-soap-apricot',
    title: 'Apricot Exfoliating Soap - Gentle Scrub Bar | Ayonne',
    description: 'Gentle exfoliation with natural Apricot Soap. Smooths, brightens, nourishes. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  {
    handle: 'natural-soap-fresh-turmeric',
    title: 'Turmeric Brightening Soap - Glow Bar | Ayonne',
    description: 'Brighten with Turmeric Soap. Anti-inflammatory, evens tone, natural glow. Free AI skin analysis at ai.ayonne.skin. Natural, vegan skincare.',
  },
  {
    handle: 'natural-soap-green-tea-lemongrass',
    title: 'Green Tea & Lemongrass Soap - Antioxidant Bar | Ayonne',
    description: 'Antioxidant cleansing with Green Tea & Lemongrass. Refreshes, protects, energizes. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  // Tools
  {
    handle: 'rose-quartz-roller',
    title: 'Rose Quartz Face Roller - Lymphatic Massage | Ayonne',
    description: 'De-puff & sculpt with Rose Quartz Roller. Promotes circulation, reduces puffiness. Free AI skin analysis at ai.ayonne.skin. Natural beauty tool.',
  },
  {
    handle: 'natural-konjac-sponge',
    title: 'Konjac Sponge - Natural Exfoliating Cleanser | Ayonne',
    description: 'Gentle daily exfoliation with natural Konjac Sponge. Soft cleansing, eco-friendly. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  // Bundles
  {
    handle: 'winter-glow-essentials-set',
    title: 'Winter Glow Essentials Set - Hydration Bundle | Ayonne',
    description: 'Complete winter skincare set. Hydrates, protects, glows. Save 20% on this bundle. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
]

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '76fe6e6d9c42457ddd3ba38e5e3b4e9bb3fbd1322ac4e359d0173f6335c5f881'
const API_BASE = process.env.API_BASE || 'https://ai.ayonne.skin'

interface ProductSEOData {
  id: string
  handle: string
  title: string
  seo: {
    title: string | null
    description: string | null
  }
}

async function getProductByHandle(handle: string): Promise<ProductSEOData | null> {
  const response = await fetch(`${API_BASE}/api/admin/seo?handle=${handle}`, {
    headers: { 'x-admin-key': ADMIN_API_KEY },
  })

  if (!response.ok) {
    console.error(`Failed to fetch product ${handle}: ${response.status}`)
    return null
  }

  const data = await response.json()
  return data.product || null
}

async function updateProductSEO(productId: string, title: string, description: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/admin/seo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY,
    },
    body: JSON.stringify({
      action: 'update',
      productId,
      title,
      description,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to update product: ${error}`)
    return false
  }

  const data = await response.json()
  return data.success === true
}

async function main() {
  console.log('🔍 Starting SEO update process...\n')
  console.log(`📊 ${OPTIMIZED_PRODUCT_SEO.length} products with optimized SEO data\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const seoData of OPTIMIZED_PRODUCT_SEO) {
    console.log(`\n📦 Processing: ${seoData.handle}`)

    // Get the product from Shopify
    const product = await getProductByHandle(seoData.handle)

    if (!product) {
      console.log(`   ⏭️  Product not found in Shopify, skipping`)
      skipped++
      continue
    }

    // Check if SEO is already optimized
    const currentTitle = product.seo?.title || ''
    const currentDesc = product.seo?.description || ''

    if (currentTitle === seoData.title && currentDesc === seoData.description) {
      console.log(`   ✅ Already optimized, skipping`)
      skipped++
      continue
    }

    // Update the product SEO
    console.log(`   📝 Updating SEO...`)
    console.log(`   Old title: "${currentTitle || '(none)'}"`)
    console.log(`   New title: "${seoData.title}"`)

    const success = await updateProductSEO(product.id, seoData.title, seoData.description)

    if (success) {
      console.log(`   ✅ Updated successfully!`)
      updated++
    } else {
      console.log(`   ❌ Update failed`)
      failed++
    }

    // Rate limiting - wait 500ms between updates
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 SEO Update Summary')
  console.log('='.repeat(50))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📦 Total: ${OPTIMIZED_PRODUCT_SEO.length}`)
}

main().catch(console.error)
