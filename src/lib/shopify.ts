// Shopify Store Configuration
// This app serves as an AI Skin Analyzer that links back to the main Shopify store

export const SHOPIFY_STORE_URL = 'https://ayonne.skin'

export const shopifyUrls = {
  home: SHOPIFY_STORE_URL,
  products: (slug: string) => `${SHOPIFY_STORE_URL}/products/${slug}`,
  collections: (slug: string) => `${SHOPIFY_STORE_URL}/collections/${slug}`,
  cart: `${SHOPIFY_STORE_URL}/cart`,
  checkout: `${SHOPIFY_STORE_URL}/checkout`,
  account: `${SHOPIFY_STORE_URL}/account`,
  // Add to cart URL - this opens Shopify with the product added to cart
  addToCart: (slug: string) => `${SHOPIFY_STORE_URL}/cart/add?id=${slug}`,
}

// Map our collection slugs to Shopify collection handles
export const collectionMapping: Record<string, string> = {
  'anti-aging-serums': 'anti-aging-serums',
  'moisturizers': 'moisturizers',
  'cleansers': 'cleansers',
  'self-care': 'self-care',
  'rise-and-glow': 'rise-and-glow',
  'ebooks': 'knowledge-is-beauty-ebooks',
  'mens': 'man-up',
  'bundles': 'bundles',
}

// Get Shopify product URL - uses shopifySlug if provided, otherwise falls back to local slug
export function getShopifyProductUrl(slug: string, shopifySlug?: string | null): string {
  return shopifyUrls.products(shopifySlug || slug)
}

export function getShopifyCollectionUrl(slug: string): string {
  const shopifySlug = collectionMapping[slug] || slug
  return shopifyUrls.collections(shopifySlug)
}

// Get the "Add to Cart" URL - redirects to product page where user can add to cart
// Shopify doesn't support direct add-to-cart via URL without variant ID, so we link to product page
export function getShopifyAddToCartUrl(slug: string, shopifySlug?: string | null): string {
  return `${SHOPIFY_STORE_URL}/products/${shopifySlug || slug}#add-to-cart`
}
