/**
 * Bulk SEO update - Part 2: Remaining products
 * Run with: npx ts-node scripts/bulk-seo-update-2.ts
 */

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '76fe6e6d9c42457ddd3ba38e5e3b4e9bb3fbd1322ac4e359d0173f6335c5f881'
const API_BASE = process.env.API_BASE || 'https://ai.ayonne.skin'

// More products to optimize
const PRODUCT_SEO_MAP: Record<string, { title: string; description: string }> = {
  // === MORE LIP CARE ===
  'lip-kit-life-s-a-peach': {
    title: 'Life\'s A Peach Lip Kit - Complete Set | Ayonne',
    description: 'Complete peach lip care set. Scrub, balm, and gloss for perfect lips. Free AI skin analysis at ai.ayonne.skin. Vegan beauty.',
  },
  'plumping-lip-gloss': {
    title: 'Plumping Lip Gloss - Fuller Lips | Ayonne',
    description: 'Volumizing lip gloss for a fuller pout. Hydrates, shines, plumps. Free AI skin analysis at ai.ayonne.skin. Vegan lip care.',
  },
  'lip-kit-pretty-in-pink': {
    title: 'Pretty In Pink Lip Kit - Complete Set | Ayonne',
    description: 'Complete pink lip care set. Scrub, balm, and gloss for pretty lips. Free AI skin analysis at ai.ayonne.skin. Vegan beauty.',
  },
  'smoothing-lip-balm': {
    title: 'Smoothing Lip Balm - Soft Hydration | Ayonne',
    description: 'Smooth & hydrate lips with our balm. Softens, protects, nourishes. Free AI skin analysis at ai.ayonne.skin. Vegan lip care.',
  },
  'lip-kit-mauve-wife': {
    title: 'Mauve Wife Lip Kit - Complete Set | Ayonne',
    description: 'Complete mauve lip care set. Scrub, balm, and gloss for sophisticated lips. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'lip-and-eye-makeup-remover': {
    title: 'Lip & Eye Makeup Remover - Gentle Cleanser | Ayonne',
    description: 'Gentle formula removes makeup without irritation. Safe for sensitive eyes. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === MORE SERUMS (without -1 suffix) ===
  'anti-aging-rose-gold-oil': {
    title: 'Anti-Aging Rose Gold Oil - Luxury Face Oil | Ayonne',
    description: 'Luxurious rose gold oil with 24k gold. Nourishes, restores radiance, fights aging. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'niacinamide-vitamin-boost-serum': {
    title: 'Niacinamide Serum - Pore Refining Treatment | Ayonne',
    description: 'Minimize pores & control oil with Niacinamide. Strengthens skin barrier. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'vitamin-c-toner': {
    title: 'Vitamin C Brightening Toner - Prep & Glow | Ayonne',
    description: 'Prep skin with Vitamin C Toner. Brightens, balances, refreshes. Free AI skin analysis at ai.ayonne.skin. Vegan & cruelty-free.',
  },
  'vitamin-c-cleanser': {
    title: 'Vitamin C Cleanser - Brightening Face Wash | Ayonne',
    description: 'Gentle cleansing with brightening Vitamin C. Removes impurities, evens tone. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'hyaluronic-acid-serum': {
    title: 'Hyaluronic Acid Serum - Deep Hydration | Ayonne',
    description: 'Intense hydration with Hyaluronic Acid. Plumps fine lines, locks in moisture. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'hydration-serum': {
    title: 'Hydration Serum - Moisture Boost | Ayonne',
    description: 'Quench thirsty skin with our Hydration Serum. Deep moisture, dewy glow. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'collagen-and-retinol-serum': {
    title: 'Collagen & Retinol Serum - Anti-Aging | Ayonne',
    description: 'Powerful anti-aging with collagen & retinol. Reduces wrinkles, firms skin. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'firm-serum': {
    title: 'Firming Serum - Lift & Tighten | Ayonne',
    description: 'Visibly lift & firm with our Firming Serum. Tightens, sculpts, defines. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'vitamin-c-lotion': {
    title: 'Vitamin C Antioxidant Lotion - Brightening | Ayonne',
    description: 'Brighten & protect with Vitamin C Lotion. Fades dark spots, boosts radiance. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === FACE CARE ===
  'glow-mask': {
    title: 'Glow Mask - Radiance Face Treatment | Ayonne',
    description: 'Instant glow with our radiance mask. Brightens, hydrates, reveals luminous skin. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'soothing-moisturizer': {
    title: 'Soothing Moisturizer - Calm & Hydrate | Ayonne',
    description: 'Calm sensitive skin with our Soothing Moisturizer. Reduces redness, hydrates. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'active-eye-cream': {
    title: 'Active Eye Cream - Anti-Aging Eye Care | Ayonne',
    description: 'Target wrinkles & dark circles with our Eye Cream. Firms, brightens, refreshes. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'mens-under-eye-cream': {
    title: 'Men\'s Under Eye Cream - Dark Circle Treatment | Ayonne',
    description: 'Target dark circles & puffiness for men. Energizes, de-puffs tired eyes. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'makeup-remover-solution': {
    title: 'Makeup Remover Solution - Gentle Cleanser | Ayonne',
    description: 'Effortlessly remove makeup without irritation. Gentle on skin, tough on makeup. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },
  'tanning-drops': {
    title: 'Tanning Drops - Natural Glow | Ayonne',
    description: 'Buildable tan with our self-tanning drops. Natural, streak-free, sun-kissed glow. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === MORE SOAPS ===
  'natural-soap-citron': {
    title: 'Citron Soap - Refreshing Natural Bar | Ayonne',
    description: 'Refreshing citrus soap cleanses & energizes. Bright scent, clean feel. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  'natural-soap-eucalyptus-pepperminty': {
    title: 'Eucalyptus Peppermint Soap - Invigorating | Ayonne',
    description: 'Invigorating eucalyptus & mint soap. Awakens senses, deep clean. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },
  'natural-soap-lavender-rosemary': {
    title: 'Lavender Rosemary Soap - Calming Bar | Ayonne',
    description: 'Calming lavender & rosemary soap. Relaxes, cleanses, soothes. Free AI skin analysis at ai.ayonne.skin. Natural, vegan.',
  },

  // === MEN'S GROOMING ===
  'beard-nylon-brush': {
    title: 'Beard Brush - Nylon Styling Tool | Ayonne',
    description: 'Style & groom beard with our nylon brush. Distributes oils, tames flyaways. For well-groomed beards. Vegan grooming.',
  },
  'beard-oil-unscented': {
    title: 'Beard Oil Unscented - Natural Care | Ayonne',
    description: 'Nourish beard without fragrance. Softens, conditions, promotes growth. For sensitive skin. Vegan grooming.',
  },
  'beard-oil-classic': {
    title: 'Beard Oil Classic - Traditional Scent | Ayonne',
    description: 'Classic scented beard oil. Softens, conditions, masculine fragrance. Healthy beard growth. Vegan grooming.',
  },
  'beard-oil-speakeasy': {
    title: 'Beard Oil Speakeasy - Premium Scent | Ayonne',
    description: 'Sophisticated speakeasy-scented beard oil. Softens, nourishes, refined fragrance. Vegan grooming.',
  },
  'beard-butter': {
    title: 'Beard Butter - Deep Conditioning | Ayonne',
    description: 'Rich beard butter for deep conditioning. Softens, shapes, tames beard. For groomed beards. Vegan grooming.',
  },
  'hair-clay': {
    title: 'Hair Clay - Matte Styling Product | Ayonne',
    description: 'Matte finish hair styling clay. Strong hold, natural look, reworkable. For textured hairstyles. Vegan styling.',
  },

  // === MORE HAIR CARE ===
  'smooth-sculpt-curl-enhancer': {
    title: 'Curl Enhancer - Define & Sculpt | Ayonne',
    description: 'Define curls with our Curl Enhancer. Smooths frizz, adds bounce, sculpts curls. Vegan hair care.',
  },
  'daily-repair-conditioner': {
    title: 'Daily Repair Conditioner - Strengthening | Ayonne',
    description: 'Repair & strengthen hair with our conditioner. Soft, manageable, healthy hair. Vegan, sulfate-free.',
  },
  'setting-spray': {
    title: 'Setting Spray - Makeup Lock | Ayonne',
    description: 'Lock in makeup all day with our Setting Spray. Matte finish, long-lasting hold. Vegan beauty.',
  },
  'oil-control-setting-spray': {
    title: 'Oil Control Setting Spray - Mattifying | Ayonne',
    description: 'Control shine & set makeup. Oil-absorbing, matte finish, long-lasting. Free AI skin analysis at ai.ayonne.skin. Vegan.',
  },

  // === TOOLS ===
  'sculpting-gua-sha-glossy': {
    title: 'Gua Sha Tool - Facial Sculpting | Ayonne',
    description: 'Sculpt & de-puff with our Gua Sha. Promotes circulation, defines contours. Free AI skin analysis at ai.ayonne.skin. Beauty tool.',
  },
  'everywhere-makeup-bag': {
    title: 'Makeup Bag - Travel Beauty Case | Ayonne',
    description: 'Stylish makeup bag for beauty on-the-go. Organized, compact, durable. Perfect for travel.',
  },

  // === SHIMMER ===
  'liquid-shimmer-gatsby': {
    title: 'Liquid Shimmer Gatsby - Body Highlighter | Ayonne',
    description: 'Glamorous body shimmer for luminous skin. Buildable glow, special occasions. Vegan beauty.',
  },
  'liquid-shimmer-hottie': {
    title: 'Liquid Shimmer Hottie - Body Glow | Ayonne',
    description: 'Radiant body shimmer for sun-kissed glow. Buildable, beautiful shine. Vegan beauty.',
  },

  // === DIGITAL PRODUCTS (optimize for better SEO even if excluded from Shopping) ===
  'sultry-skin-how-to-get-beautiful-glowing-skin': {
    title: 'Sultry Skin Guide - Glowing Skin eBook | Ayonne',
    description: 'Learn secrets to beautiful, glowing skin. Expert tips, skincare routines, free download. Get AI skin analysis at ai.ayonne.skin.',
  },
  'the-natural-acne-remedy': {
    title: 'Natural Acne Remedy Guide - Clear Skin | Ayonne',
    description: 'Natural solutions for acne-prone skin. Expert remedies, clear skin tips, free download. Get AI skin analysis at ai.ayonne.skin.',
  },
  'wrinkle-reverse-how-to-reverse-time-on-your-complexion': {
    title: 'Wrinkle Reverse Guide - Anti-Aging Tips | Ayonne',
    description: 'Turn back time on your complexion. Expert anti-aging tips, free download. Get AI skin analysis at ai.ayonne.skin.',
  },
  'your-best-skin-ever-a-comprehensive-guide': {
    title: 'Best Skin Ever - Comprehensive Guide | Ayonne',
    description: 'Your complete guide to healthy, beautiful skin. Expert tips, free download. Get AI skin analysis at ai.ayonne.skin.',
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

  if (!response.ok) return null
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
    body: JSON.stringify({ action: 'update', productId, title, description }),
  })

  if (!response.ok) return false
  const data = await response.json()
  return data.success === true
}

async function main() {
  console.log('🚀 Starting bulk SEO update (Part 2)...\n')

  const handles = Object.keys(PRODUCT_SEO_MAP)
  console.log(`📊 ${handles.length} products to optimize\n`)

  let updated = 0, skipped = 0, failed = 0, notFound = 0

  for (const handle of handles) {
    const seoData = PRODUCT_SEO_MAP[handle]
    console.log(`📦 ${handle}`)

    const product = await getProductByHandle(handle)
    if (!product) {
      console.log(`   ⏭️  Not found`)
      notFound++
      continue
    }

    if ((product.seo?.title || '') === seoData.title) {
      console.log(`   ✅ Already done`)
      skipped++
      continue
    }

    const success = await updateProductSEO(product.id, seoData.title, seoData.description)
    if (success) {
      console.log(`   ✅ Updated`)
      updated++
    } else {
      console.log(`   ❌ Failed`)
      failed++
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('\n' + '='.repeat(40))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`🔍 Not found: ${notFound}`)
}

main().catch(console.error)
