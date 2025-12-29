/**
 * Shopify Discount Code Management
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'
import type { CreateDiscountParams, UserError, DiscountCodeNode } from './types'

/**
 * Create a basic discount code in Shopify using GraphQL
 */
export async function syncDiscountToShopify(params: CreateDiscountParams): Promise<{
  success: boolean
  discountId?: string
  error?: string
}> {
  if (!isShopifyConfigured()) {
    console.warn('Shopify not configured - discount code not synced:', params.code)
    return { success: false, error: 'Shopify not configured' }
  }

  const { code, discountPercent, expiresAt, usageLimit, oncePerCustomer = true, title } = params

  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                nodes {
                  code
                }
              }
              startsAt
              endsAt
            }
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `

  const variables = {
    basicCodeDiscount: {
      title: title || `AI Growth: ${code}`,
      code,
      startsAt: new Date().toISOString(),
      endsAt: expiresAt ? expiresAt.toISOString() : null,
      usageLimit: usageLimit || null,
      appliesOncePerCustomer: oncePerCustomer,
      customerSelection: {
        all: true,
      },
      customerGets: {
        value: {
          percentage: discountPercent / 100,
        },
        items: {
          all: true,
        },
      },
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: true,
      },
    },
  }

  try {
    const result = await shopifyGraphQL<{
      discountCodeBasicCreate: {
        codeDiscountNode: DiscountCodeNode | null
        userErrors: UserError[]
      }
    }>(mutation, variables)

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors.map(e => e.message).join(', ')
      console.error('Shopify GraphQL errors:', errorMessage)
      return { success: false, error: errorMessage }
    }

    const userErrors = result.data?.discountCodeBasicCreate?.userErrors || []
    if (userErrors.length > 0) {
      const errorMessage = userErrors.map(e => `${e.field?.join('.')}: ${e.message}`).join(', ')
      console.error('Shopify discount creation errors:', errorMessage)
      return { success: false, error: errorMessage }
    }

    const discountNode = result.data?.discountCodeBasicCreate?.codeDiscountNode
    if (!discountNode) {
      return { success: false, error: 'No discount node returned' }
    }

    console.log(`Synced discount to Shopify: ${code} (${discountPercent}% off)`)

    return {
      success: true,
      discountId: discountNode.id,
    }
  } catch (error) {
    console.error('Failed to sync discount to Shopify:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a discount code from Shopify
 */
export async function deleteDiscountFromShopify(discountId: string): Promise<boolean> {
  if (!isShopifyConfigured()) {
    return false
  }

  const mutation = `
    mutation discountCodeDelete($id: ID!) {
      discountCodeDelete(id: $id) {
        deletedCodeDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      discountCodeDelete: {
        deletedCodeDiscountId: string | null
        userErrors: UserError[]
      }
    }>(mutation, { id: discountId })

    if (result.data?.discountCodeDelete?.userErrors?.length) {
      console.error('Failed to delete discount:', result.data.discountCodeDelete.userErrors)
      return false
    }

    return !!result.data?.discountCodeDelete?.deletedCodeDiscountId
  } catch (error) {
    console.error('Failed to delete discount from Shopify:', error)
    return false
  }
}

/**
 * Get all discount codes from Shopify
 */
export async function getShopifyDiscountCodes(first: number = 50): Promise<Array<{
  id: string
  code: string
  title: string
  startsAt: string
  endsAt: string | null
}>> {
  if (!isShopifyConfigured()) {
    return []
  }

  const query = `
    query getDiscountCodes($first: Int!) {
      codeDiscountNodes(first: $first) {
        nodes {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                nodes {
                  code
                }
              }
              startsAt
              endsAt
            }
            ... on DiscountCodeBxgy {
              title
              codes(first: 1) {
                nodes {
                  code
                }
              }
              startsAt
              endsAt
            }
            ... on DiscountCodeFreeShipping {
              title
              codes(first: 1) {
                nodes {
                  code
                }
              }
              startsAt
              endsAt
            }
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      codeDiscountNodes: {
        nodes: Array<{
          id: string
          codeDiscount: {
            title: string
            codes: { nodes: Array<{ code: string }> }
            startsAt: string
            endsAt: string | null
          }
        }>
      }
    }>(query, { first })

    if (!result.data?.codeDiscountNodes?.nodes) {
      return []
    }

    return result.data.codeDiscountNodes.nodes
      .filter(node => node.codeDiscount?.codes?.nodes?.length > 0)
      .map(node => ({
        id: node.id,
        code: node.codeDiscount.codes.nodes[0].code,
        title: node.codeDiscount.title,
        startsAt: node.codeDiscount.startsAt,
        endsAt: node.codeDiscount.endsAt,
      }))
  } catch (error) {
    console.error('Failed to get Shopify discount codes:', error)
    return []
  }
}

/**
 * Check if a discount code exists in Shopify
 */
export async function discountExistsInShopify(code: string): Promise<boolean> {
  if (!isShopifyConfigured()) {
    return false
  }

  const query = `
    query checkDiscountCode($query: String!) {
      codeDiscountNodes(first: 1, query: $query) {
        nodes {
          id
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      codeDiscountNodes: {
        nodes: Array<{ id: string }>
      }
    }>(query, { query: `code:${code}` })

    return (result.data?.codeDiscountNodes?.nodes?.length ?? 0) > 0
  } catch {
    return false
  }
}

/**
 * Batch sync multiple discount codes to Shopify
 */
export async function batchSyncDiscountsToShopify(
  discounts: CreateDiscountParams[]
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const results = {
    synced: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const discount of discounts) {
    const result = await syncDiscountToShopify(discount)
    if (result.success) {
      results.synced++
    } else {
      results.failed++
      results.errors.push(`${discount.code}: ${result.error}`)
    }

    // Rate limit: Be conservative with GraphQL cost
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  return results
}

/**
 * Create a free shipping discount code
 */
export async function createFreeShippingDiscount(params: {
  code: string
  title?: string
  expiresAt: Date | null
  minimumSubtotal?: number
}): Promise<{ success: boolean; discountId?: string; error?: string }> {
  if (!isShopifyConfigured()) {
    return { success: false, error: 'Shopify not configured' }
  }

  const mutation = `
    mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
      discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
        codeDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables = {
    freeShippingCodeDiscount: {
      title: params.title || `Free Shipping: ${params.code}`,
      code: params.code,
      startsAt: new Date().toISOString(),
      endsAt: params.expiresAt ? params.expiresAt.toISOString() : null,
      appliesOncePerCustomer: true,
      customerSelection: {
        all: true,
      },
      destination: {
        all: true,
      },
      ...(params.minimumSubtotal && {
        minimumRequirement: {
          subtotal: {
            greaterThanOrEqualToSubtotal: params.minimumSubtotal.toString(),
          },
        },
      }),
    },
  }

  try {
    const result = await shopifyGraphQL<{
      discountCodeFreeShippingCreate: {
        codeDiscountNode: { id: string } | null
        userErrors: UserError[]
      }
    }>(mutation, variables)

    const userErrors = result.data?.discountCodeFreeShippingCreate?.userErrors || []
    if (userErrors.length > 0) {
      return { success: false, error: userErrors.map(e => e.message).join(', ') }
    }

    const discountId = result.data?.discountCodeFreeShippingCreate?.codeDiscountNode?.id
    if (!discountId) {
      return { success: false, error: 'No discount ID returned' }
    }

    console.log(`Created free shipping discount: ${params.code}`)
    return { success: true, discountId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Deactivate a discount code (instead of deleting)
 */
export async function deactivateDiscount(discountId: string): Promise<boolean> {
  if (!isShopifyConfigured()) {
    return false
  }

  const mutation = `
    mutation discountCodeDeactivate($id: ID!) {
      discountCodeDeactivate(id: $id) {
        codeDiscountNode {
          id
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
      discountCodeDeactivate: {
        codeDiscountNode: { id: string } | null
        userErrors: UserError[]
      }
    }>(mutation, { id: discountId })

    return !result.data?.discountCodeDeactivate?.userErrors?.length
  } catch {
    return false
  }
}

/**
 * Get discount analytics/usage stats
 */
export async function getDiscountAnalytics(discountId: string): Promise<{
  usageCount: number
  totalSales: string
} | null> {
  if (!isShopifyConfigured()) {
    return null
  }

  const query = `
    query getDiscountAnalytics($id: ID!) {
      codeDiscountNode(id: $id) {
        codeDiscount {
          ... on DiscountCodeBasic {
            asyncUsageCount
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      codeDiscountNode: {
        codeDiscount: {
          asyncUsageCount: number
        }
      }
    }>(query, { id: discountId })

    return {
      usageCount: result.data?.codeDiscountNode?.codeDiscount?.asyncUsageCount ?? 0,
      totalSales: '0',
    }
  } catch {
    return null
  }
}

/**
 * Get customers who used a specific discount code
 */
export async function getDiscountUsage(code: string): Promise<{
  totalOrders: number
  totalRevenue: string
  customers: Array<{ email: string; orderCount: number }>
} | null> {
  if (!isShopifyConfigured()) {
    return null
  }

  const query = `
    query getDiscountUsage($query: String!) {
      orders(first: 50, query: $query) {
        nodes {
          customer {
            email
          }
          totalPriceSet {
            shopMoney {
              amount
            }
          }
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      orders: {
        nodes: Array<{
          customer: { email: string } | null
          totalPriceSet: { shopMoney: { amount: string } }
        }>
      }
    }>(query, { query: `discount_code:${code}` })

    const orders = result.data?.orders?.nodes ?? []
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalPriceSet.shopMoney.amount), 0)

    const customerMap = new Map<string, number>()
    for (const order of orders) {
      const email = order.customer?.email ?? 'guest'
      customerMap.set(email, (customerMap.get(email) ?? 0) + 1)
    }

    return {
      totalOrders: orders.length,
      totalRevenue: totalRevenue.toFixed(2),
      customers: Array.from(customerMap.entries()).map(([email, orderCount]) => ({
        email,
        orderCount,
      })),
    }
  } catch {
    return null
  }
}
