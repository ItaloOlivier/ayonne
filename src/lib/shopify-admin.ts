/**
 * Shopify Admin GraphQL API Integration
 *
 * This module handles automatic synchronization of discount codes
 * between our growth hacking system and Shopify using the GraphQL API.
 *
 * Required environment variables:
 * - SHOPIFY_STORE_DOMAIN: Your Shopify store domain (e.g., 'ecosmetics-skin.myshopify.com')
 * - SHOPIFY_ADMIN_API_TOKEN: Admin API access token with write_discounts scope
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN
const SHOPIFY_API_VERSION = '2025-01'

// GraphQL Types
interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
    extensions?: { code: string }
  }>
  extensions?: {
    cost: {
      requestedQueryCost: number
      actualQueryCost: number
      throttleStatus: {
        maximumAvailable: number
        currentlyAvailable: number
        restoreRate: number
      }
    }
  }
}

interface UserError {
  field: string[] | null
  message: string
  code?: string
}

interface DiscountCodeNode {
  id: string
  codeDiscount: {
    title: string
    codes: {
      nodes: Array<{ code: string }>
    }
    startsAt: string
    endsAt: string | null
    usageLimit: number | null
    appliesOncePerCustomer: boolean
  }
}

interface CreateDiscountParams {
  code: string
  discountPercent: number
  expiresAt: Date | null
  usageLimit?: number
  oncePerCustomer?: boolean
  title?: string
}

/**
 * Check if Shopify Admin API is configured
 */
export function isShopifyConfigured(): boolean {
  return !!(SHOPIFY_STORE_DOMAIN && SHOPIFY_ADMIN_API_TOKEN)
}

/**
 * Make a GraphQL request to the Shopify Admin API
 */
async function shopifyGraphQL<T>(
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

  // Log cost information for monitoring
  if (result.extensions?.cost) {
    console.log(`Shopify API cost: ${result.extensions.cost.actualQueryCost}/${result.extensions.cost.throttleStatus.currentlyAvailable}`)
  }

  return result
}

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
          percentage: discountPercent / 100, // GraphQL expects decimal (0.10 = 10%)
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

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors.map(e => e.message).join(', ')
      console.error('Shopify GraphQL errors:', errorMessage)
      return { success: false, error: errorMessage }
    }

    // Check for user errors
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

    console.log(`✅ Synced discount to Shopify (GraphQL): ${code} (${discountPercent}% off)`)

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
 * Delete a discount code from Shopify using GraphQL
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
 * Get all discount codes from Shopify using GraphQL
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
 * Check if a discount code exists in Shopify using GraphQL
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

    console.log(`✅ Created free shipping discount: ${params.code}`)
    return { success: true, discountId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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
      totalSales: '0', // Would need orders API to calculate
    }
  } catch {
    return null
  }
}

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

    // Group by customer email
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

// ============================================================================
// PRODUCT SYNC FUNCTIONS
// ============================================================================

/**
 * Get all products from Shopify with full details
 */
export async function getAllProducts(first: number = 50, cursor?: string): Promise<{
  products: Array<{
    id: string
    handle: string
    title: string
    status: string
    totalInventory: number
    priceRange: { min: string; max: string }
    images: string[]
    defaultVariantId: string | null
    variants: Array<{
      id: string
      title: string
      price: string
      inventoryQuantity: number
      sku: string | null
    }>
  }>
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

  // Build query for multiple variants
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

// ============================================================================
// CUSTOMER SYNC FUNCTIONS
// ============================================================================

/**
 * Create a customer in Shopify
 */
export async function createShopifyCustomer(params: {
  email: string
  firstName: string
  lastName?: string
  phone?: string
  tags?: string[]
  note?: string
}): Promise<{ success: boolean; customerId?: string; error?: string }> {
  if (!isShopifyConfigured()) {
    return { success: false, error: 'Shopify not configured' }
  }

  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables = {
    input: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName || '',
      phone: params.phone,
      tags: params.tags || ['ai-skin-analyzer'],
      note: params.note || 'Created from AI Skin Analyzer',
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
      },
    },
  }

  try {
    const result = await shopifyGraphQL<{
      customerCreate: {
        customer: { id: string; email: string } | null
        userErrors: UserError[]
      }
    }>(mutation, variables)

    const userErrors = result.data?.customerCreate?.userErrors ?? []
    if (userErrors.length > 0) {
      // Check if customer already exists
      if (userErrors.some(e => e.message.includes('already exists'))) {
        // Try to find existing customer
        const existing = await findShopifyCustomerByEmail(params.email)
        if (existing) {
          return { success: true, customerId: existing }
        }
      }
      return { success: false, error: userErrors.map(e => e.message).join(', ') }
    }

    const customerId = result.data?.customerCreate?.customer?.id
    if (!customerId) {
      return { success: false, error: 'No customer ID returned' }
    }

    console.log(`✅ Created Shopify customer: ${params.email}`)
    return { success: true, customerId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Find a Shopify customer by email
 */
export async function findShopifyCustomerByEmail(email: string): Promise<string | null> {
  if (!isShopifyConfigured()) {
    return null
  }

  const query = `
    query findCustomer($query: String!) {
      customers(first: 1, query: $query) {
        nodes {
          id
        }
      }
    }
  `

  try {
    const result = await shopifyGraphQL<{
      customers: { nodes: Array<{ id: string }> }
    }>(query, { query: `email:${email}` })

    return result.data?.customers?.nodes[0]?.id ?? null
  } catch {
    return null
  }
}

/**
 * Update Shopify customer tags (for segmentation)
 */
export async function updateCustomerTags(customerId: string, tags: string[]): Promise<boolean> {
  if (!isShopifyConfigured()) {
    return false
  }

  const mutation = `
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
        }
        userErrors {
          message
        }
      }
    }
  `

  try {
    const gid = customerId.startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}`
    const result = await shopifyGraphQL<{
      customerUpdate: {
        customer: { id: string } | null
        userErrors: UserError[]
      }
    }>(mutation, { input: { id: gid, tags } })

    return !result.data?.customerUpdate?.userErrors?.length
  } catch {
    return false
  }
}

/**
 * Add a note to Shopify customer (for skin analysis results)
 */
export async function addCustomerNote(customerId: string, note: string): Promise<boolean> {
  if (!isShopifyConfigured()) {
    return false
  }

  const mutation = `
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
        }
        userErrors {
          message
        }
      }
    }
  `

  try {
    const gid = customerId.startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}`

    // First get existing note
    const existingResult = await shopifyGraphQL<{
      customer: { note: string | null } | null
    }>(`query { customer(id: "${gid}") { note } }`)

    const existingNote = existingResult.data?.customer?.note || ''
    const newNote = existingNote
      ? `${existingNote}\n\n---\n${new Date().toISOString()}\n${note}`
      : `${new Date().toISOString()}\n${note}`

    const result = await shopifyGraphQL<{
      customerUpdate: {
        customer: { id: string } | null
        userErrors: UserError[]
      }
    }>(mutation, { input: { id: gid, note: newNote } })

    return !result.data?.customerUpdate?.userErrors?.length
  } catch {
    return false
  }
}

// ============================================================================
// COLLECTION SYNC FUNCTIONS
// ============================================================================

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

// ============================================================================
// SEO MANAGEMENT FUNCTIONS
// ============================================================================

export interface ProductSEO {
  title: string
  description: string
  handle?: string
}

export interface ProductSEOData {
  id: string
  handle: string
  title: string
  seo: {
    title: string | null
    description: string | null
  }
  descriptionHtml: string
}

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
 * Requires write_products scope
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

    console.log(`✅ Updated SEO for product: ${productId}`)
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
  // Remove generic terms
  const cleanName = productName
    .replace(/^Buy\s+/i, '')
    .replace(/\s*-\s*Best\s+.*$/i, '')
    .trim()

  // Add relevant suffix based on category
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

  // Check title
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

  // Check description
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

  // Check for keywords
  const keywords = ['skincare', 'skin', 'serum', 'moisturizer', 'anti-aging', 'natural']
  const hasKeyword = keywords.some(k =>
    title?.toLowerCase().includes(k) || description.toLowerCase().includes(k)
  )
  if (!hasKeyword) {
    recommendations.push('Add relevant skincare keywords')
    score -= 10
  }

  // Recommendations
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
 * Update page/article SEO (for blogs, about page, etc.)
 * Requires write_content scope
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
