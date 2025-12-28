/**
 * Shopify Admin API Integration
 *
 * This module handles automatic synchronization of discount codes
 * between our growth hacking system and Shopify.
 *
 * Required environment variables:
 * - SHOPIFY_STORE_DOMAIN: Your Shopify store domain (e.g., 'ayonne.myshopify.com')
 * - SHOPIFY_ADMIN_API_TOKEN: Admin API access token with write_price_rules scope
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN
const SHOPIFY_API_VERSION = '2024-01'

interface ShopifyPriceRule {
  id: number
  title: string
  value_type: 'percentage' | 'fixed_amount'
  value: string
  customer_selection: 'all' | 'prerequisite'
  target_type: 'line_item' | 'shipping_line'
  target_selection: 'all' | 'entitled'
  allocation_method: 'across' | 'each'
  once_per_customer: boolean
  usage_limit: number | null
  starts_at: string
  ends_at: string | null
}

interface ShopifyDiscountCode {
  id: number
  price_rule_id: number
  code: string
  usage_count: number
  created_at: string
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
 * Make a request to the Shopify Admin API
 */
async function shopifyRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error('Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN.')
  }

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN!,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Shopify API error:', response.status, errorText)
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Create a price rule in Shopify (required for discount codes)
 */
async function createPriceRule(params: CreateDiscountParams): Promise<ShopifyPriceRule> {
  const { discountPercent, expiresAt, usageLimit, oncePerCustomer = true, title, code } = params

  const priceRule = {
    price_rule: {
      title: title || `Growth: ${code}`,
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: 'percentage',
      value: `-${discountPercent}`, // Negative for discount
      customer_selection: 'all',
      once_per_customer: oncePerCustomer,
      usage_limit: usageLimit || null,
      starts_at: new Date().toISOString(),
      ends_at: expiresAt ? expiresAt.toISOString() : null,
    },
  }

  const response = await shopifyRequest<{ price_rule: ShopifyPriceRule }>(
    '/price_rules.json',
    {
      method: 'POST',
      body: JSON.stringify(priceRule),
    }
  )

  return response.price_rule
}

/**
 * Create a discount code attached to a price rule
 */
async function createDiscountCode(
  priceRuleId: number,
  code: string
): Promise<ShopifyDiscountCode> {
  const response = await shopifyRequest<{ discount_code: ShopifyDiscountCode }>(
    `/price_rules/${priceRuleId}/discount_codes.json`,
    {
      method: 'POST',
      body: JSON.stringify({
        discount_code: { code },
      }),
    }
  )

  return response.discount_code
}

/**
 * Create a discount code in Shopify
 * This creates both the price rule and the discount code
 */
export async function syncDiscountToShopify(params: CreateDiscountParams): Promise<{
  success: boolean
  priceRuleId?: number
  discountCodeId?: number
  error?: string
}> {
  if (!isShopifyConfigured()) {
    console.warn('Shopify not configured - discount code not synced:', params.code)
    return { success: false, error: 'Shopify not configured' }
  }

  try {
    // Create the price rule
    const priceRule = await createPriceRule(params)

    // Create the discount code attached to the price rule
    const discountCode = await createDiscountCode(priceRule.id, params.code)

    console.log(`✅ Synced discount to Shopify: ${params.code} (${params.discountPercent}% off)`)

    return {
      success: true,
      priceRuleId: priceRule.id,
      discountCodeId: discountCode.id,
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
export async function deleteDiscountFromShopify(
  priceRuleId: number,
  discountCodeId: number
): Promise<boolean> {
  if (!isShopifyConfigured()) {
    return false
  }

  try {
    // Delete the discount code
    await shopifyRequest(
      `/price_rules/${priceRuleId}/discount_codes/${discountCodeId}.json`,
      { method: 'DELETE' }
    )

    // Delete the price rule
    await shopifyRequest(`/price_rules/${priceRuleId}.json`, { method: 'DELETE' })

    return true
  } catch (error) {
    console.error('Failed to delete discount from Shopify:', error)
    return false
  }
}

/**
 * Get all discount codes from Shopify (for verification)
 */
export async function getShopifyDiscountCodes(): Promise<ShopifyDiscountCode[]> {
  if (!isShopifyConfigured()) {
    return []
  }

  try {
    // First get all price rules
    const priceRulesResponse = await shopifyRequest<{ price_rules: ShopifyPriceRule[] }>(
      '/price_rules.json?limit=250'
    )

    // Then get discount codes for each price rule
    const allCodes: ShopifyDiscountCode[] = []

    for (const priceRule of priceRulesResponse.price_rules) {
      const codesResponse = await shopifyRequest<{ discount_codes: ShopifyDiscountCode[] }>(
        `/price_rules/${priceRule.id}/discount_codes.json`
      )
      allCodes.push(...codesResponse.discount_codes)
    }

    return allCodes
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

  try {
    // Shopify doesn't have a direct lookup by code, so we use the lookup endpoint
    const response = await shopifyRequest<{ discount_code?: ShopifyDiscountCode }>(
      `/discount_codes/lookup.json?code=${encodeURIComponent(code)}`
    )
    return !!response.discount_code
  } catch {
    // 404 means code doesn't exist
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

    // Rate limit: Shopify allows 2 requests per second for basic plans
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}
