/**
 * Shopify GMC (Google Merchant Center) Fix Utilities
 *
 * Functions to fix common GMC issues by updating Shopify product data.
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'

interface ProductUpdateResult {
  success: boolean
  productId: string
  handle: string
  error?: string
}

/**
 * Get product by handle with metafields
 */
export async function getProductWithMetafields(handle: string): Promise<{
  id: string
  title: string
  handle: string
  productType: string
  tags: string[]
  metafields: Array<{ key: string; value: string; namespace: string }>
} | null> {
  if (!isShopifyConfigured()) return null

  const query = `
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        productType
        tags
        metafields(first: 20) {
          nodes {
            key
            value
            namespace
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      productByHandle: {
        id: string
        title: string
        handle: string
        productType: string
        tags: string[]
        metafields: { nodes: Array<{ key: string; value: string; namespace: string }> }
      } | null
    }>(query, { handle })

    const product = result.data?.productByHandle
    if (!product) return null

    return {
      ...product,
      metafields: product.metafields.nodes,
    }
  } catch (error) {
    console.error('Error getting product:', error)
    return null
  }
}

/**
 * Update product tags (add or remove)
 */
export async function updateProductTags(
  productId: string,
  tagsToAdd: string[],
  tagsToRemove: string[] = []
): Promise<ProductUpdateResult> {
  if (!isShopifyConfigured()) {
    return { success: false, productId, handle: '', error: 'Shopify not configured' }
  }

  // First get current tags
  const getTagsQuery = `
    query getProductTags($id: ID!) {
      product(id: $id) {
        handle
        tags
      }
    }
  `

  try {
    const current = await shopifyGraphQL<{
      product: { handle: string; tags: string[] } | null
    }>(getTagsQuery, { id: productId })

    if (!current.data?.product) {
      return { success: false, productId, handle: '', error: 'Product not found' }
    }

    const currentTags = current.data.product.tags
    const newTags = [
      ...currentTags.filter(t => !tagsToRemove.includes(t)),
      ...tagsToAdd.filter(t => !currentTags.includes(t)),
    ]

    const mutation = `
      mutation updateProductTags($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const result = await shopifyGraphQL<{
      productUpdate: {
        product: { id: string; tags: string[] } | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, { input: { id: productId, tags: newTags } })

    if (result.data?.productUpdate?.userErrors?.length) {
      return {
        success: false,
        productId,
        handle: current.data.product.handle,
        error: result.data.productUpdate.userErrors[0].message,
      }
    }

    return { success: true, productId, handle: current.data.product.handle }
  } catch (error) {
    return { success: false, productId, handle: '', error: String(error) }
  }
}

/**
 * Update Google product category via metafield
 */
export async function updateGoogleProductCategory(
  productId: string,
  category: string
): Promise<ProductUpdateResult> {
  if (!isShopifyConfigured()) {
    return { success: false, productId, handle: '', error: 'Shopify not configured' }
  }

  const mutation = `
    mutation updateProductMetafield($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      productUpdate: {
        product: { id: string; handle: string } | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, {
      input: {
        id: productId,
        metafields: [
          {
            namespace: 'google',
            key: 'product_category',
            value: category,
            type: 'single_line_text_field',
          },
        ],
      },
    })

    if (result.data?.productUpdate?.userErrors?.length) {
      return {
        success: false,
        productId,
        handle: result.data?.productUpdate?.product?.handle || '',
        error: result.data.productUpdate.userErrors[0].message,
      }
    }

    return {
      success: true,
      productId,
      handle: result.data?.productUpdate?.product?.handle || '',
    }
  } catch (error) {
    return { success: false, productId, handle: '', error: String(error) }
  }
}

/**
 * Exclude product from Google Shopping channel by adding tag
 */
export async function excludeFromGoogleShopping(productId: string): Promise<ProductUpdateResult> {
  return updateProductTags(productId, ['google-shopping-exclude'], [])
}

/**
 * Update product type (used for categorization)
 */
export async function updateProductType(
  productId: string,
  productType: string
): Promise<ProductUpdateResult> {
  if (!isShopifyConfigured()) {
    return { success: false, productId, handle: '', error: 'Shopify not configured' }
  }

  const mutation = `
    mutation updateProductType($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          handle
          productType
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      productUpdate: {
        product: { id: string; handle: string; productType: string } | null
        userErrors: Array<{ field: string[]; message: string }>
      }
    }>(mutation, { input: { id: productId, productType } })

    if (result.data?.productUpdate?.userErrors?.length) {
      return {
        success: false,
        productId,
        handle: result.data?.productUpdate?.product?.handle || '',
        error: result.data.productUpdate.userErrors[0].message,
      }
    }

    return {
      success: true,
      productId,
      handle: result.data?.productUpdate?.product?.handle || '',
    }
  } catch (error) {
    return { success: false, productId, handle: '', error: String(error) }
  }
}

/**
 * Get product ID from Shopify offer ID format
 * Format: shopify_US_9604775739740_49430357803356 -> gid://shopify/Product/9604775739740
 */
export function parseShopifyOfferId(offerId: string): {
  productId: string
  variantId: string
} | null {
  const match = offerId.match(/shopify_[A-Z]{2}_(\d+)_(\d+)/)
  if (!match) return null

  return {
    productId: `gid://shopify/Product/${match[1]}`,
    variantId: `gid://shopify/ProductVariant/${match[2]}`,
  }
}

/**
 * Batch update products - apply fixes to multiple products
 */
export async function batchFixGMCIssues(
  fixes: Array<{
    offerId: string
    action: 'exclude' | 'update_category' | 'update_type'
    value?: string
  }>
): Promise<{
  total: number
  successful: number
  failed: number
  results: ProductUpdateResult[]
}> {
  const results: ProductUpdateResult[] = []

  for (const fix of fixes) {
    const parsed = parseShopifyOfferId(fix.offerId)
    if (!parsed) {
      results.push({
        success: false,
        productId: fix.offerId,
        handle: '',
        error: 'Invalid offer ID format',
      })
      continue
    }

    let result: ProductUpdateResult

    switch (fix.action) {
      case 'exclude':
        result = await excludeFromGoogleShopping(parsed.productId)
        break
      case 'update_category':
        result = await updateGoogleProductCategory(parsed.productId, fix.value || '')
        break
      case 'update_type':
        result = await updateProductType(parsed.productId, fix.value || '')
        break
      default:
        result = {
          success: false,
          productId: parsed.productId,
          handle: '',
          error: 'Unknown action',
        }
    }

    results.push(result)

    // Rate limiting - Shopify has 2 requests/second limit for mutations
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  return {
    total: fixes.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  }
}

// Google product category mappings for skincare
export const SKINCARE_CATEGORY_MAP: Record<string, string> = {
  // Correct categories for skincare products
  serum: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Facial Treatments & Cleansers',
  lotion: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lotion & Moisturizer',
  cleanser: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Facial Treatments & Cleansers',
  moisturizer: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Lotion & Moisturizer',
  soap: 'Health & Beauty > Personal Care > Cosmetics > Bath & Body > Bar Soap',
  shampoo: 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner',
  'beard wash': 'Health & Beauty > Personal Care > Shaving & Grooming > Beard Care',
  fragrance: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
  shimmer: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Face Makeup',
  oil: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Facial Treatments & Cleansers',
  mask: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Facial Treatments & Cleansers',
  toner: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Toners & Astringents',
  sunscreen: 'Health & Beauty > Personal Care > Cosmetics > Skin Care > Sunscreen',
  default: 'Health & Beauty > Personal Care > Cosmetics > Skin Care',
}

/**
 * Suggest correct category based on product title
 */
export function suggestCategory(title: string): string {
  const titleLower = title.toLowerCase()

  for (const [keyword, category] of Object.entries(SKINCARE_CATEGORY_MAP)) {
    if (keyword !== 'default' && titleLower.includes(keyword)) {
      return category
    }
  }

  return SKINCARE_CATEGORY_MAP.default
}
