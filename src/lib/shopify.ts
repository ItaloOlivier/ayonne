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

export function getShopifyProductUrl(slug: string): string {
  return shopifyUrls.products(slug)
}

export function getShopifyCollectionUrl(slug: string): string {
  const shopifySlug = collectionMapping[slug] || slug
  return shopifyUrls.collections(shopifySlug)
}
