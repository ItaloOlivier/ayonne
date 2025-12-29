/**
 * Shopify SEO Management
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'
import type { ProductSEO, ProductSEOData, UserError } from './types'

/**
 * Get product SEO data
 */
export async function getProductSEO(handle: string): Promise<ProductSEOData | null> {
  if (!isShopifyConfigured()) {
    return null
  }

  const query = `
    query getProductSEO($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        title
        seo {
          title
          description
        }
        descriptionHtml
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      productByHandle: ProductSEOData | null
    }>(query, { handle })

    return result.data?.productByHandle ?? null
  } catch {
    return null
  }
}

/**
 * Update product SEO (meta title and description)
 */
export async function updateProductSEO(
  productId: string,
  seo: ProductSEO
): Promise<{ success: boolean; error?: string }> {
  if (!isShopifyConfigured()) {
    return { success: false, error: 'Shopify not configured' }
  }

  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          seo {
            title
            description
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`

  const variables = {
    input: {
      id: gid,
      seo: {
        title: seo.title,
        description: seo.description,
      },
    },
  }

  try {
    const result = await shopifyGraphQL<{
      productUpdate: {
        product: { id: string } | null
        userErrors: UserError[]
      }
    }>(mutation, variables)

    const userErrors = result.data?.productUpdate?.userErrors ?? []
    if (userErrors.length > 0) {
      return { success: false, error: userErrors.map(e => e.message).join(', ') }
    }

    console.log(`Updated SEO for product: ${productId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Bulk get all products with their SEO data
 */
export async function getAllProductsSEO(first: number = 50): Promise<ProductSEOData[]> {
  if (!isShopifyConfigured()) {
    return []
  }

  const query = `
    query getProductsSEO($first: Int!) {
      products(first: $first) {
        nodes {
          id
          handle
          title
          seo {
            title
            description
          }
          descriptionHtml
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      products: { nodes: ProductSEOData[] }
    }>(query, { first })

    return result.data?.products?.nodes ?? []
  } catch {
    return []
  }
}

/**
 * Generate optimized SEO title for a product
 */
export function generateOptimizedTitle(productName: string, category?: string): string {
  const cleanName = productName
    .replace(/^Buy\s+/i, '')
    .replace(/\s*-\s*Best\s+.*$/i, '')
    .trim()

  const suffixes: Record<string, string> = {
    'anti-aging': 'Anti-Aging Skincare | Ayonne',
    'hydration': 'Hydrating Skincare | Ayonne',
    'cleansers': 'Natural Cleanser | Ayonne',
    'soaps': 'Natural Soap | Ayonne',
    'serums': 'Face Serum | Ayonne',
    'moisturizers': 'Face Moisturizer | Ayonne',
  }

  const suffix = category ? suffixes[category.toLowerCase()] || 'Skincare | Ayonne' : 'Skincare | Ayonne'

  return `${cleanName} - ${suffix}`
}

/**
 * Generate optimized SEO description for a product
 */
export function generateOptimizedDescription(
  productName: string,
  benefits: string[],
  skinConcerns: string[]
): string {
  const benefitText = benefits.length > 0 ? benefits.slice(0, 3).join(', ') : 'radiant, healthy skin'
  const concernText = skinConcerns.length > 0 ? skinConcerns.slice(0, 2).join(' & ') : 'skin health'

  return `Shop ${productName} - formulated for ${benefitText}. Perfect for ${concernText}. Free AI skin analysis at ai.ayonne.skin. Vegan, cruelty-free, science-backed skincare.`
}

/**
 * Analyze SEO quality of a product
 */
export function analyzeSEOQuality(product: ProductSEOData): {
  score: number
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  const title = product.seo.title || product.title
  if (!title || title.length < 30) {
    issues.push('Title too short (< 30 chars)')
    score -= 15
  }
  if (title && title.length > 60) {
    issues.push('Title too long (> 60 chars)')
    score -= 10
  }
  if (title?.toLowerCase().includes('buy ')) {
    issues.push('Title starts with "Buy" - spammy')
    score -= 10
  }
  if (title?.toLowerCase().includes('best ')) {
    issues.push('Title contains "Best" - generic')
    score -= 5
  }

  const description = product.seo.description || ''
  if (!description || description.length < 120) {
    issues.push('Meta description too short (< 120 chars)')
    score -= 20
  }
  if (description && description.length > 160) {
    issues.push('Meta description too long (> 160 chars)')
    score -= 5
  }
  if (!description.toLowerCase().includes('ayonne')) {
    recommendations.push('Add brand name to description')
  }

  const keywords = ['skincare', 'skin', 'serum', 'moisturizer', 'anti-aging', 'natural']
  const hasKeyword = keywords.some(k =>
    title?.toLowerCase().includes(k) || description.toLowerCase().includes(k)
  )
  if (!hasKeyword) {
    recommendations.push('Add relevant skincare keywords')
    score -= 10
  }

  if (!description.includes('ai.ayonne.skin')) {
    recommendations.push('Mention AI skin analyzer in description')
  }
  if (!description.toLowerCase().includes('vegan') && !description.toLowerCase().includes('cruelty-free')) {
    recommendations.push('Mention vegan/cruelty-free')
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  }
}

/**
 * Update page/article SEO
 */
export async function updatePageSEO(
  pageId: string,
  seo: { title: string; description: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isShopifyConfigured()) {
    return { success: false, error: 'Shopify not configured' }
  }

  const mutation = `
    mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const gid = pageId.startsWith('gid://') ? pageId : `gid://shopify/Page/${pageId}`

  try {
    const result = await shopifyGraphQL<{
      pageUpdate: {
        page: { id: string } | null
        userErrors: UserError[]
      }
    }>(mutation, {
      id: gid,
      page: {
        seo: {
          title: seo.title,
          description: seo.description
        }
      }
    })

    const userErrors = result.data?.pageUpdate?.userErrors ?? []
    if (userErrors.length > 0) {
      return { success: false, error: userErrors.map(e => e.message).join(', ') }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get all pages with SEO data
 */
export async function getAllPagesSEO(): Promise<Array<{
  id: string
  handle: string
  title: string
  seo: { title: string | null; description: string | null }
}>> {
  if (!isShopifyConfigured()) {
    return []
  }

  const query = `
    query getPagesSEO {
      pages(first: 50) {
        nodes {
          id
          handle
          title
          seo {
            title
            description
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      pages: {
        nodes: Array<{
          id: string
          handle: string
          title: string
          seo: { title: string | null; description: string | null }
        }>
      }
    }>(query)

    return result.data?.pages?.nodes ?? []
  } catch {
    return []
  }
}

/**
 * Create an llms.txt compatible product catalog
 */
export async function generateLLMSProductCatalog(): Promise<string> {
  const products = await getAllProductsSEO(100)

  if (products.length === 0) {
    return '# No products found'
  }

  const lines = [
    '# Ayonne Product Catalog',
    '',
    '> Complete list of Ayonne skincare products',
    '',
    '## Products',
    '',
  ]

  for (const product of products) {
    const description = product.seo.description ||
      product.descriptionHtml.replace(/<[^>]*>/g, '').slice(0, 150) + '...'

    lines.push(`### ${product.title}`)
    lines.push(`- URL: https://ayonne.skin/products/${product.handle}`)
    lines.push(`- ${description}`)
    lines.push('')
  }

  return lines.join('\n')
}
