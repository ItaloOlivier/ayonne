import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read the mapping file
const mappingPath = path.join(__dirname, 'shopify-slug-mapping.json')
const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'))
const mapping = mappingData.mapping as Record<string, { shopifySlug: string | null; active: boolean }>

// Read the seed data
const seedPath = path.join(__dirname, 'seed-data.json')
const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))

// Update products with Shopify slugs and active status
let activeCount = 0
let inactiveCount = 0

seedData.products = seedData.products.map((product: { slug: string; shopifySlug?: string | null; active?: boolean }) => {
  const productMapping = mapping[product.slug]

  if (productMapping) {
    product.shopifySlug = productMapping.shopifySlug
    product.active = productMapping.active

    if (productMapping.active) {
      activeCount++
    } else {
      inactiveCount++
    }
  } else {
    // If not in mapping, mark as inactive
    product.shopifySlug = null
    product.active = false
    inactiveCount++
    console.log(`No mapping found for: ${product.slug}`)
  }

  return product
})

// Write updated seed data
fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2))

console.log(`\nUpdated seed-data.json:`)
console.log(`  Active products: ${activeCount}`)
console.log(`  Inactive products: ${inactiveCount}`)
console.log(`  Total products: ${seedData.products.length}`)
