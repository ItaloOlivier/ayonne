/**
 * Shopify Collection Management
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'

/**
 * Get all collections from Shopify
 */
export async function getAllCollections(): Promise<Array<{
  id: string
  handle: string
  title: string
  productsCount: number
}>> {
  if (!isShopifyConfigured()) {
    return []
  }

  const query = `
    query getCollections {
      collections(first: 50) {
        nodes {
          id
          handle
          title
          productsCount {
            count
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      collections: {
        nodes: Array<{
          id: string
          handle: string
          title: string
          productsCount: { count: number }
        }>
      }
    }>(query)

    return (result.data?.collections?.nodes ?? []).map(c => ({
      id: c.id,
      handle: c.handle,
      title: c.title,
      productsCount: c.productsCount.count,
    }))
  } catch {
    return []
  }
}

/**
 * Get products in a specific collection
 */
export async function getCollectionProducts(handle: string): Promise<Array<{
  id: string
  handle: string
  title: string
}>> {
  if (!isShopifyConfigured()) {
    return []
  }

  const query = `
    query getCollectionProducts($handle: String!) {
      collectionByHandle(handle: $handle) {
        products(first: 100) {
          nodes {
            id
            handle
            title
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      collectionByHandle: {
        products: { nodes: Array<{ id: string; handle: string; title: string }> }
      } | null
    }>(query, { handle })

    return result.data?.collectionByHandle?.products?.nodes ?? []
  } catch {
    return []
  }
}
