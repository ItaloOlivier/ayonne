/**
 * Shopify Shop Information
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'

/**
 * Get shop information
 */
export async function getShopInfo(): Promise<{
  name: string
  email: string
  domain: string
  currency: string
  plan: string
} | null> {
  if (!isShopifyConfigured()) {
    return null
  }

  const query = `
    query getShop {
      shop {
        name
        email
        primaryDomain {
          url
        }
        currencyCode
        plan {
          displayName
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      shop: {
        name: string
        email: string
        primaryDomain: { url: string }
        currencyCode: string
        plan: { displayName: string }
      }
    }>(query)

    return {
      name: result.data?.shop?.name ?? '',
      email: result.data?.shop?.email ?? '',
      domain: result.data?.shop?.primaryDomain?.url ?? '',
      currency: result.data?.shop?.currencyCode ?? 'USD',
      plan: result.data?.shop?.plan?.displayName ?? '',
    }
  } catch {
    return null
  }
}
