/**
 * Shopify Product Management
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'
import type { ShopifyProduct, ProductFeedItem } from './types'

/**
 * Get product information by handle (slug)
 */
export async function getProductByHandle(handle: string): Promise<{
  id: string
  title: string
  handle: string
  status: string
  totalInventory: number
  priceRange: { min: string; max: string }
  variants: Array<{ id: string; title: string; price: string; inventoryQuantity: number }>
} | null> {
  if (!isShopifyConfigured()) {
    return null
  }

  const query = `
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        status
        totalInventory
        priceRangeV2 {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        variants(first: 10) {
          nodes {
            id
            title
            price
            inventoryQuantity
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
        status: string
        totalInventory: number
        priceRangeV2: {
          minVariantPrice: { amount: string }
          maxVariantPrice: { amount: string }
        }
        variants: {
          nodes: Array<{
            id: string
            title: string
            price: string
            inventoryQuantity: number
          }>
        }
      }
    }>(query, { handle })

    const product = result.data?.productByHandle
    if (!product) return null

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      totalInventory: product.totalInventory,
      priceRange: {
        min: product.priceRangeV2.minVariantPrice.amount,
        max: product.priceRangeV2.maxVariantPrice.amount,
      },
      variants: product.variants.nodes.map(v => ({
        id: v.id,
        title: v.title,
        price: v.price,
        inventoryQuantity: v.inventoryQuantity,
      })),
    }
  } catch {
    return null
  }
}

/**
 * Get all products from Shopify with full details
 */
export async function getAllProducts(first: number = 50, cursor?: string): Promise<{
  products: ShopifyProduct[]
  hasNextPage: boolean
  endCursor: string | null
}> {
  if (!isShopifyConfigured()) {
    return { products: [], hasNextPage: false, endCursor: null }
  }

  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after, sortKey: TITLE) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          handle
          title
          status
          totalInventory
          priceRangeV2 {
            minVariantPrice { amount }
            maxVariantPrice { amount }
          }
          images(first: 5) {
            nodes {
              url
            }
          }
          variants(first: 10) {
            nodes {
              id
              title
              price
              inventoryQuantity
              sku
            }
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
        nodes: Array<{
          id: string
          handle: string
          title: string
          status: string
          totalInventory: number
          priceRangeV2: {
            minVariantPrice: { amount: string }
            maxVariantPrice: { amount: string }
          }
          images: { nodes: Array<{ url: string }> }
          variants: {
            nodes: Array<{
              id: string
              title: string
              price: string
              inventoryQuantity: number
              sku: string | null
            }>
          }
        }>
      }
    }>(query, { first, after: cursor })

    const products = result.data?.products?.nodes ?? []

    return {
      products: products.map(p => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
        status: p.status,
        totalInventory: p.totalInventory,
        priceRange: {
          min: p.priceRangeV2.minVariantPrice.amount,
          max: p.priceRangeV2.maxVariantPrice.amount,
        },
        images: p.images.nodes.map(i => i.url),
        defaultVariantId: p.variants.nodes[0]?.id?.replace('gid://shopify/ProductVariant/', '') ?? null,
        variants: p.variants.nodes.map(v => ({
          id: v.id.replace('gid://shopify/ProductVariant/', ''),
          title: v.title,
          price: v.price,
          inventoryQuantity: v.inventoryQuantity,
          sku: v.sku,
        })),
      })),
      hasNextPage: result.data?.products?.pageInfo?.hasNextPage ?? false,
      endCursor: result.data?.products?.pageInfo?.endCursor ?? null,
    }
  } catch (error) {
    console.error('Failed to get products from Shopify:', error)
    return { products: [], hasNextPage: false, endCursor: null }
  }
}

/**
 * Get inventory levels for a specific product variant
 */
export async function getInventoryLevel(variantId: string): Promise<number | null> {
  if (!isShopifyConfigured()) {
    return null
  }

  const query = `
    query getVariantInventory($id: ID!) {
      productVariant(id: $id) {
        inventoryQuantity
      }
    }
  `

  try {
    const gid = variantId.startsWith('gid://') ? variantId : `gid://shopify/ProductVariant/${variantId}`
    const result = await shopifyGraphQL<{
      productVariant: { inventoryQuantity: number } | null
    }>(query, { id: gid })

    return result.data?.productVariant?.inventoryQuantity ?? null
  } catch {
    return null
  }
}

/**
 * Bulk get inventory for multiple variants
 */
export async function getBulkInventory(variantIds: string[]): Promise<Map<string, number>> {
  if (!isShopifyConfigured() || variantIds.length === 0) {
    return new Map()
  }

  const gids = variantIds.map(id =>
    id.startsWith('gid://') ? id : `gid://shopify/ProductVariant/${id}`
  )

  const query = `
    query getBulkInventory($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          inventoryQuantity
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      nodes: Array<{
        id: string
        inventoryQuantity: number
      } | null>
    }>(query, { ids: gids })

    const inventoryMap = new Map<string, number>()
    for (const node of result.data?.nodes ?? []) {
      if (node) {
        const cleanId = node.id.replace('gid://shopify/ProductVariant/', '')
        inventoryMap.set(cleanId, node.inventoryQuantity)
      }
    }
    return inventoryMap
  } catch {
    return new Map()
  }
}

/**
 * Get all products with full data for AI catalog/feed generation
 */
export async function getAllProductsForFeed(): Promise<ProductFeedItem[]> {
  if (!isShopifyConfigured()) {
    return []
  }

  const query = `
    query getProductsForFeed($first: Int!) {
      products(first: $first) {
        nodes {
          id
          handle
          title
          descriptionHtml
          seo {
            title
            description
          }
          images(first: 3) {
            nodes {
              url
              altText
            }
          }
          variants(first: 5) {
            nodes {
              id
              price
              availableForSale
              sku
            }
          }
          productType
          tags
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      products: {
        nodes: Array<{
          id: string
          handle: string
          title: string
          descriptionHtml: string
          seo: { title: string | null; description: string | null }
          images: { nodes: Array<{ url: string; altText: string | null }> }
          variants: { nodes: Array<{ id: string; price: string; availableForSale: boolean; sku: string | null }> }
          productType: string
          tags: string[]
        }>
      }
    }>(query, { first: 250 })

    return (result.data?.products?.nodes ?? []).map(p => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      description: p.descriptionHtml,
      seo: p.seo,
      images: p.images.nodes.map(img => ({ src: img.url, alt: img.altText })),
      variants: p.variants.nodes.map(v => ({
        id: v.id,
        price: v.price,
        available: v.availableForSale,
        sku: v.sku,
      })),
      productType: p.productType,
      tags: p.tags,
    }))
  } catch (error) {
    console.error('Error fetching products for feed:', error)
    return []
  }
}
