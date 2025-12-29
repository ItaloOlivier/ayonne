/**
 * Shopify Admin GraphQL API Client
 */

import type { GraphQLResponse } from './types'

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN
const SHOPIFY_API_VERSION = '2025-01'

/**
 * Check if Shopify Admin API is configured
 */
export function isShopifyConfigured(): boolean {
  return !!(SHOPIFY_STORE_DOMAIN && SHOPIFY_ADMIN_API_TOKEN)
}

/**
 * Make a GraphQL request to the Shopify Admin API
 */
export async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
  if (!isShopifyConfigured()) {
    throw new Error('Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN.')
  }

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Shopify GraphQL error:', response.status, errorText)
    throw new Error(`Shopify GraphQL error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  // Log cost information for monitoring (only in development)
  if (process.env.NODE_ENV === 'development' && result.extensions?.cost) {
    console.log(`Shopify API cost: ${result.extensions.cost.actualQueryCost}/${result.extensions.cost.throttleStatus.currentlyAvailable}`)
  }

  return result
}
