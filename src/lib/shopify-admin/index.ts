/**
 * Shopify Admin API Module
 *
 * This module provides a clean, modular interface for interacting with the
 * Shopify Admin GraphQL API. It's split into focused sub-modules:
 *
 * - client: Core GraphQL client and configuration check
 * - discounts: Discount code CRUD and batch operations
 * - products: Product queries and inventory management
 * - customers: Customer CRUD and tag management
 * - collections: Collection queries
 * - orders: Order queries
 * - seo: SEO management and analysis
 * - shop: Shop information
 * - types: TypeScript type definitions
 */

// Re-export client utilities
export { isShopifyConfigured, shopifyGraphQL } from './client'

// Re-export discount operations
export {
  syncDiscountToShopify,
  deleteDiscountFromShopify,
  getShopifyDiscountCodes,
  discountExistsInShopify,
  batchSyncDiscountsToShopify,
  createFreeShippingDiscount,
  deactivateDiscount,
  getDiscountAnalytics,
  getDiscountUsage,
} from './discounts'

// Re-export product operations
export {
  getProductByHandle,
  getAllProducts,
  getInventoryLevel,
  getBulkInventory,
  getAllProductsForFeed,
} from './products'

// Re-export customer operations
export {
  createShopifyCustomer,
  findShopifyCustomerByEmail,
  updateCustomerTags,
  addCustomerNote,
} from './customers'

// Re-export collection operations
export {
  getAllCollections,
  getCollectionProducts,
} from './collections'

// Re-export order operations
export {
  getRecentOrders,
} from './orders'

// Re-export SEO operations
export {
  getProductSEO,
  updateProductSEO,
  getAllProductsSEO,
  generateOptimizedTitle,
  generateOptimizedDescription,
  analyzeSEOQuality,
  updatePageSEO,
  getAllPagesSEO,
  generateLLMSProductCatalog,
} from './seo'

// Re-export shop operations
export {
  getShopInfo,
} from './shop'

// Re-export GMC fix operations
export {
  getProductWithMetafields,
  updateProductTags,
  updateGoogleProductCategory,
  excludeFromGoogleShopping,
  updateProductType,
  parseShopifyOfferId,
  batchFixGMCIssues,
  suggestCategory,
  SKINCARE_CATEGORY_MAP,
} from './gmc-fixes'

// Re-export types
export type {
  GraphQLResponse,
  UserError,
  DiscountCodeNode,
  CreateDiscountParams,
  ProductSEO,
  ProductSEOData,
  ProductFeedItem,
  ShopifyProduct,
} from './types'
