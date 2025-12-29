/**
 * Shopify Customer Management
 */

import { shopifyGraphQL, isShopifyConfigured } from './client'
import type { UserError } from './types'

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
      if (userErrors.some(e => e.message.includes('already exists'))) {
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

    console.log(`Created Shopify customer: ${params.email}`)
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
