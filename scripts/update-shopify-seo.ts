/**
 * Script to update Shopify product SEO via Admin API
 *
 * Usage:
 *   npx tsx scripts/update-shopify-seo.ts
 *   npx tsx scripts/update-shopify-seo.ts --dry-run
 *   npx tsx scripts/update-shopify-seo.ts --handle vitamin-c-lotion-1
 */

import 'dotenv/config'

import {
  isShopifyConfigured,
  getProductSEO,
  updateProductSEO,
  getAllProductsSEO,
} from '../src/lib/shopify-admin/index.js'
import { OPTIMIZED_PRODUCT_SEO } from '../src/lib/seo-data.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const handleArg = args.find(a => a.startsWith('--handle='))
const specificHandle = handleArg?.split('=')[1]

async function main() {
  console.log('🔍 Shopify SEO Update Script')
  console.log('============================')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (applying changes)'}`)
  console.log('')

  // Check if Shopify is configured
  if (!isShopifyConfigured()) {
    console.error('❌ Shopify Admin API not configured')
    console.error('   Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN in .env')
    process.exit(1)
  }

  console.log('✅ Shopify API configured')
  console.log('')

  // Get products to update
  const productsToUpdate = specificHandle
    ? OPTIMIZED_PRODUCT_SEO.filter(p => p.handle === specificHandle)
    : OPTIMIZED_PRODUCT_SEO

  if (productsToUpdate.length === 0) {
    console.error(`❌ No products found${specificHandle ? ` for handle: ${specificHandle}` : ''}`)
    process.exit(1)
  }

  console.log(`📦 Processing ${productsToUpdate.length} products...`)
  console.log('')

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const product of productsToUpdate) {
    try {
      // Get current SEO from Shopify
      const currentSEO = await getProductSEO(product.handle)

      if (!currentSEO) {
        console.log(`⚠️  ${product.handle}: Not found in Shopify, skipping`)
        skipped++
        continue
      }

      // Check if update is needed
      const needsTitleUpdate = currentSEO.title !== product.title
      const needsDescUpdate = currentSEO.seo?.description !== product.description

      if (!needsTitleUpdate && !needsDescUpdate) {
        console.log(`✓  ${product.handle}: Already optimized`)
        skipped++
        continue
      }

      // Log what will change
      console.log(`\n📝 ${product.handle}:`)
      if (needsTitleUpdate) {
        console.log(`   Title: "${currentSEO.title}" → "${product.title}"`)
      }
      if (needsDescUpdate) {
        console.log(`   Desc: "${currentSEO.seo?.description?.slice(0, 50)}..." → "${product.description.slice(0, 50)}..."`)
      }

      // Apply update (unless dry run)
      if (!dryRun) {
        const result = await updateProductSEO(currentSEO.id, {
          title: product.title,
          description: product.description,
        })

        if (result.success) {
          console.log(`   ✅ Updated successfully`)
          updated++
        } else {
          console.log(`   ❌ Failed: ${result.error}`)
          failed++
        }
      } else {
        console.log(`   ⏸️  Would update (dry run)`)
        updated++
      }

      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`❌ ${product.handle}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`)
      failed++
    }
  }

  console.log('')
  console.log('============================')
  console.log('📊 Summary:')
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total: ${productsToUpdate.length}`)

  if (dryRun) {
    console.log('')
    console.log('💡 Run without --dry-run to apply changes')
  }
}

main().catch(console.error)
