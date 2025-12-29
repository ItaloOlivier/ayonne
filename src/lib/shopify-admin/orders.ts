/**
 * Shopify Order Management
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'

/**
 * Get recent orders (for tracking discount usage)
 */
export async function getRecentOrders(first: number = 10): Promise<Array<{
  id: string
  name: string
  totalPrice: string
  discountCodes: string[]
  createdAt: string
}>> {
  if (!isShopifyConfigured()) {
    return []
  }

  const query = `
    query getOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          name
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          discountCodes
          createdAt
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      orders: {
        nodes: Array<{
          id: string
          name: string
          totalPriceSet: { shopMoney: { amount: string } }
          discountCodes: string[]
          createdAt: string
        }>
      }
    }>(query, { first })

    return (result.data?.orders?.nodes ?? []).map(o => ({
      id: o.id,
      name: o.name,
      totalPrice: o.totalPriceSet.shopMoney.amount,
      discountCodes: o.discountCodes,
      createdAt: o.createdAt,
    }))
  } catch {
    return []
  }
}
