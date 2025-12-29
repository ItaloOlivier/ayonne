/**
 * Shopify Admin API Types
 */

export interface GraphQLResponse<T> {
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

export interface UserError {
  field: string[] | null
  message: string
  code?: string
}

export interface DiscountCodeNode {
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

export interface CreateDiscountParams {
  code: string
  discountPercent: number
  expiresAt: Date | null
  usageLimit?: number
  oncePerCustomer?: boolean
  title?: string
}

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

export interface ProductFeedItem {
  id: string
  handle: string
  title: string
  description: string
  seo: {
    title: string | null
    description: string | null
  }
  images: Array<{ src: string; alt: string | null }>
  variants: Array<{
    id: string
    price: string
    available: boolean
    sku: string | null
  }>
  productType: string
  tags: string[]
}

export interface ShopifyProduct {
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
}
