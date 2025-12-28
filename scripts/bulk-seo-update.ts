/**
 * Bulk SEO update script for all Ayonne products
 * Run with: npx ts-node scripts/bulk-seo-update.ts
 */

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '76fe6e6d9c42457ddd3ba38e5e3b4e9bb3fbd1322ac4e359d0173f6335c5f881'
const API_BASE = process.env.API_BASE || 'https://ai.ayonne.skin'

// Comprehensive SEO data for ALL products
const PRODUCT_SEO_MAP: Record<string, { title: string; description: string }> = {
  // === SERUMS ===
  'collagen-serum-1oz': {
    title: 'Collagen Serum 1oz - Anti-Aging Face Serum | Ayonne',
    description: 'Boost collagen & reduce fine lines with our potent Collagen Serum. Firms, plumps, rejuvenates. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'natural-anti-aging-serum-1oz': {
    title: 'Natural Anti-Aging Serum - Wrinkle Treatment | Ayonne',
    description: 'Turn back time with our Natural Anti-Aging Serum. Reduces wrinkles, restores youthful glow. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
  },
  'glycolic-acid-anti-aging-exfoliator-serum-1oz': {
    title: 'Glycolic Acid Anti-Aging Serum - Exfoliator | Ayonne',
    description: 'Resurface & renew with Glycolic Acid Serum. Gentle exfoliation, anti-aging benefits. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'hyaluronic-acid-serum-1oz': {
    title: 'Hyaluronic Acid Serum 1oz - Intense Hydration | Ayonne',
    description: 'Deep hydration with pure Hyaluronic Acid. Plumps, smooths, locks in moisture. Free AI skin analysis at ai.ayonne.skin. Vegan, science-backed.',
  },
  'resurfacing-detox-serum-1oz': {
    title: 'Resurfacing Detox Serum - Skin Renewal | Ayonne',
    description: 'Detox & resurface with our powerful serum. Clears pores, refines texture, renews skin. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'natural-vitamin-boost-serum-1oz': {
    title: 'Natural Vitamin Boost Serum - Radiance | Ayonne',
    description: 'Vitamin-packed serum for radiant skin. Brightens, nourishes, protects. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
  },
  'natural-hydro-burst-serum-1oz': {
    title: 'Hydro Burst Serum - Moisture Surge | Ayonne',
    description: 'Instant hydration burst for thirsty skin. Quenches, plumps, refreshes. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },

  // === MOISTURIZERS ===
  'coconut-oil-face-body-moisturizer-4oz': {
    title: 'Coconut Oil Moisturizer - Face & Body | Ayonne',
    description: 'Nourish skin with natural Coconut Oil. Deep moisture, soft skin, tropical scent. Free AI skin analysis at ai.ayonne.skin. Vegan, natural.',
  },
  'argan-oil-face-body-moisturizer-4oz': {
    title: 'Argan Oil Moisturizer - Face & Body | Ayonne',
    description: 'Luxurious Argan Oil for face & body. Hydrates, softens, restores radiance. Free AI skin analysis at ai.ayonne.skin. Vegan, natural.',
  },
  'jojoba-oil-face-body-moisturizer-4oz': {
    title: 'Jojoba Oil Moisturizer - Face & Body | Ayonne',
    description: 'Balance skin with natural Jojoba Oil. Mimics skin oils, non-greasy hydration. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'natural-super-hydration-face-moisturizer-1-7oz': {
    title: 'Super Hydration Face Moisturizer | Ayonne',
    description: 'Intense hydration for dry skin. Plumps, softens, locks in moisture all day. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free.',
  },
  'anti-aging-cream-1-7oz': {
    title: 'Anti-Aging Cream - Wrinkle Repair | Ayonne',
    description: 'Fight signs of aging with our Anti-Aging Cream. Reduces wrinkles, firms, rejuvenates. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'natural-daily-moisturizer-1-7oz': {
    title: 'Natural Daily Moisturizer - Everyday Care | Ayonne',
    description: 'Lightweight daily hydration for all skin types. Absorbs fast, never greasy. Free AI skin analysis at ai.ayonne.skin. Vegan, natural.',
  },
  'vitamin-e-oil-face-body-moisturizer-4oz': {
    title: 'Vitamin E Oil Moisturizer - Face & Body | Ayonne',
    description: 'Antioxidant-rich Vitamin E for skin health. Heals, protects, nourishes deeply. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'sweet-almond-oil-face-body-moisturizer-4oz': {
    title: 'Sweet Almond Oil - Face & Body Moisturizer | Ayonne',
    description: 'Gentle Sweet Almond Oil for sensitive skin. Soothes, softens, nourishes. Free AI skin analysis at ai.ayonne.skin. Vegan, natural.',
  },
  'honeysuckle-face-body-oil-4oz': {
    title: 'Honeysuckle Face & Body Oil - Floral Luxury | Ayonne',
    description: 'Luxurious Honeysuckle Oil for silky skin. Hydrates, softens, delicate floral scent. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'oil-control-hydrator': {
    title: 'Oil Control Hydrator - Mattifying Moisturizer | Ayonne',
    description: 'Balance oily skin with our Oil Control Hydrator. Mattifies, hydrates, controls shine. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'shea-body-butter': {
    title: 'Shea Body Butter - Rich Body Moisturizer | Ayonne',
    description: 'Ultra-rich Shea Butter for dry skin. Deep nourishment, silky smooth skin. Free AI skin analysis at ai.ayonne.skin. Vegan, natural.',
  },

  // === CLEANSERS ===
  'naturally-foaming-facial-cleanser-5oz': {
    title: 'Foaming Facial Cleanser - Gentle Clean | Ayonne',
    description: 'Gentle foaming cleanser removes impurities without stripping. Soft, clean skin. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'natural-gentle-milk-cleanser-5oz': {
    title: 'Gentle Milk Cleanser - Soothing Face Wash | Ayonne',
    description: 'Creamy milk cleanser for sensitive skin. Soothes, cleanses, never irritates. Free AI skin analysis at ai.ayonne.skin. Vegan, gentle.',
  },
  'mint-exfoliating-facial-polish': {
    title: 'Mint Exfoliating Polish - Face Scrub | Ayonne',
    description: 'Refreshing mint scrub polishes & exfoliates. Smooth, bright, invigorated skin. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },

  // === TONERS ===
  'naturally-exfoliating-toner-8oz': {
    title: 'Exfoliating Toner - Skin Renewal | Ayonne',
    description: 'Gentle exfoliating toner refines pores & texture. Preps skin for maximum absorption. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === EYE CARE ===
  'natural-under-eye-gel-cream-treatment-0-5oz': {
    title: 'Under Eye Gel Cream - Dark Circle Treatment | Ayonne',
    description: 'Target dark circles & puffiness with our Eye Gel. Brightens, de-puffs, refreshes. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === NATURAL SOAPS ===
  'natural-soothing-soap-aloe': {
    title: 'Aloe Vera Soap - Soothing Natural Bar | Ayonne',
    description: 'Soothing Aloe Vera soap calms & hydrates. Gentle cleansing for sensitive skin. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  'natural-soap-tea-tree': {
    title: 'Tea Tree Soap - Antibacterial Bar | Ayonne',
    description: 'Purifying Tea Tree soap fights bacteria & clears skin. Deep clean, fresh feel. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  'natural-soap-rose-honey': {
    title: 'Rose & Honey Soap - Luxury Natural Bar | Ayonne',
    description: 'Luxurious Rose & Honey soap nourishes & softens. Gentle cleanse, floral scent. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },

  // === LIP CARE ===
  'lip-plumping-oil': {
    title: 'Lip Plumping Oil - Fuller Lips | Ayonne',
    description: 'Volumize lips with our Plumping Oil. Hydrates, smooths, creates fuller pout. Free AI skin analysis at ai.ayonne.skin. Vegan beauty.',
  },
  'lip-gloss-clear': {
    title: 'Crystal Veil Lip Gloss - Clear Shine | Ayonne',
    description: 'Pure clarity lip gloss for brilliant shine. Hydrating, non-sticky, glass finish. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'vegan-lip-balm': {
    title: 'Vegan Lip Balm - Nourishing Lip Care | Ayonne',
    description: 'Hydrate & protect lips with our Vegan Lip Balm. Soft, smooth, nourished lips. Free AI skin analysis at ai.ayonne.skin. Cruelty-free.',
  },
  'lip-scrub': {
    title: 'Lip Scrub - Exfoliating Lip Treatment | Ayonne',
    description: 'Smooth & exfoliate lips with our Lip Scrub. Removes dry skin, soft kissable lips. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'lip-kit-red-apple': {
    title: 'Red Apple Lip Kit - Complete Lip Set | Ayonne',
    description: 'Complete lip care kit in Red Apple. Scrub, balm, and gloss for perfect lips. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === BODY CARE ===
  'all-in-one-body-wash': {
    title: 'All-in-One Body Wash - Clean & Fresh | Ayonne',
    description: 'One wash for hair, face & body. Clean, fresh, convenient. Free AI skin analysis at ai.ayonne.skin. Vegan, natural ingredients.',
  },
  'nourish-hand-cream': {
    title: 'Nourish Hand Cream - Soft Hands | Ayonne',
    description: 'Rich hand cream for soft, nourished hands. Absorbs quickly, never greasy. Free AI skin analysis at ai.ayonne.skin. Vegan skincare.',
  },
  'shaving-gel': {
    title: 'Shaving Gel - Smooth Shave | Ayonne',
    description: 'Smooth, irritation-free shave with our Shaving Gel. Hydrates, protects, glides. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === HAIR CARE ===
  'nourish-scalp-and-hair-oil': {
    title: 'Scalp & Hair Oil - Nourishing Treatment | Ayonne',
    description: 'Nourish scalp & hair with our treatment oil. Strengthens, adds shine, promotes growth. Vegan, natural formula.',
  },
  'sea-spray': {
    title: 'Sea Spray - Beach Wave Texture | Ayonne',
    description: 'Effortless beach waves with our Sea Spray. Adds texture, volume, beachy vibes. Vegan hair styling.',
  },
  'luxe-leave-in-conditioner': {
    title: 'Luxe Leave-In Conditioner - Silky Hair | Ayonne',
    description: 'Silky, manageable hair with our Leave-In Conditioner. Detangles, smooths, protects. Vegan hair care.',
  },
  'volumizing-hair-spray': {
    title: 'Volumizing Hair Spray - Lift & Hold | Ayonne',
    description: 'Boost volume & hold with our Hair Spray. Lightweight, flexible, long-lasting. Vegan hair styling.',
  },
  'daily-repair-shampoo': {
    title: 'Daily Repair Shampoo - Strengthening | Ayonne',
    description: 'Repair & strengthen hair daily with our shampoo. Gentle, effective, healthy hair. Vegan, sulfate-free.',
  },
  'grooming-kit': {
    title: 'Grooming Kit - Complete Men\'s Set | Ayonne',
    description: 'Complete grooming essentials in one kit. Everything for well-groomed skin & hair. Vegan, cruelty-free.',
  },

  // === GIFT CARDS ===
  'ecosmetics-gift-cards': {
    title: 'Ayonne Gift Card - Give the Gift of Skincare',
    description: 'Give the gift of healthy skin with Ayonne Gift Cards. Perfect for any skincare lover. Free AI skin analysis at ai.ayonne.skin.',
  },
}

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
  console.log('🚀 Starting bulk SEO update...\n')

  const handles = Object.keys(PRODUCT_SEO_MAP)
  console.log(`📊 ${handles.length} products to optimize\n`)

  let updated = 0
  let skipped = 0
  let failed = 0
  let notFound = 0

  for (const handle of handles) {
    const seoData = PRODUCT_SEO_MAP[handle]
    console.log(`\n📦 Processing: ${handle}`)

    const product = await getProductByHandle(handle)

    if (!product) {
      console.log(`   ⏭️  Not found in Shopify, skipping`)
      notFound++
      continue
    }

    // Check if already optimized
    const currentTitle = product.seo?.title || ''
    if (currentTitle === seoData.title) {
      console.log(`   ✅ Already optimized`)
      skipped++
      continue
    }

    console.log(`   📝 Updating: "${seoData.title.slice(0, 50)}..."`)

    const success = await updateProductSEO(product.id, seoData.title, seoData.description)

    if (success) {
      console.log(`   ✅ Updated!`)
      updated++
    } else {
      console.log(`   ❌ Failed`)
      failed++
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Bulk SEO Update Summary')
  console.log('='.repeat(50))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped (already done): ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`🔍 Not found: ${notFound}`)
  console.log(`📦 Total processed: ${handles.length}`)
}

main().catch(console.error)
