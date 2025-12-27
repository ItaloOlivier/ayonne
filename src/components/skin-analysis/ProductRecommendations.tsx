'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { getShopifyProductUrl, SHOPIFY_STORE_URL } from '@/lib/shopify'

// Get product image from Shopify CDN based on product slug
function getShopifyProductImage(slug: string): string {
  // Shopify CDN URL pattern for product images
  return `https://ayonne.skin/cdn/shop/files/${slug}.png`
}

interface RecommendedProduct {
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  productPrice: number
  productSalePrice: number | null
  reason: string
  relevanceScore: number
}

interface ProductRecommendationsProps {
  recommendations: RecommendedProduct[]
}

function ProductCard({ rec, idx }: { rec: RecommendedProduct; idx: number }) {
  const [imageError, setImageError] = useState(false)

  // Try to get image from Shopify CDN, fallback to provided image
  const imageUrl = rec.productImage && !rec.productImage.includes('placeholder')
    ? rec.productImage
    : getShopifyProductImage(rec.productSlug)

  const showPlaceholder = imageError

  return (
    <div className="group border border-[#1C4444]/10 rounded-lg overflow-hidden hover:border-[#1C4444]/30 transition-colors">
      {/* Product Image */}
      <a
        href={getShopifyProductUrl(rec.productSlug)}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-square bg-[#F4EBE7]"
      >
        {showPlaceholder ? (
          <div className="w-full h-full flex items-center justify-center text-[#1C4444]/30">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={rec.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        )}

        {/* Best Match Badge for top recommendation */}
        {idx === 0 && (
          <div className="absolute top-2 left-2 bg-[#1C4444] text-white text-xs px-2 py-1 rounded">
            Best Match
          </div>
        )}

        {/* Sale Badge */}
        {rec.productSalePrice && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Sale
          </div>
        )}
      </a>

      {/* Product Info */}
      <div className="p-4">
        <a
          href={getShopifyProductUrl(rec.productSlug)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h4 className="text-[#1C4444] font-medium text-sm mb-1 line-clamp-2 group-hover:text-[#1C4444]/80">
            {rec.productName}
          </h4>
        </a>

        {/* Why recommended */}
        <p className="text-[#1C4444]/50 text-xs mb-3 line-clamp-2">
          {rec.reason}
        </p>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          {rec.productSalePrice ? (
            <>
              <span className="text-[#1C4444] font-medium">
                {formatPrice(rec.productSalePrice)}
              </span>
              <span className="text-[#1C4444]/40 text-sm line-through">
                {formatPrice(rec.productPrice)}
              </span>
            </>
          ) : (
            <span className="text-[#1C4444] font-medium">
              {formatPrice(rec.productPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <a
          href={getShopifyProductUrl(rec.productSlug)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#1C4444] text-white text-sm py-2 px-4 rounded-lg hover:bg-[#1C4444]/90 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add to Cart
        </a>
      </div>
    </div>
  )
}

export default function ProductRecommendations({ recommendations }: ProductRecommendationsProps) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-medium text-[#1C4444] mb-2">Recommended For You</h3>
      <p className="text-[#1C4444]/60 text-sm mb-6">
        Based on your skin analysis, these products will help address your concerns
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => (
          <ProductCard key={rec.productId} rec={rec} idx={idx} />
        ))}
      </div>

      {/* View All Products CTA */}
      <div className="mt-6 text-center">
        <a
          href={SHOPIFY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#1C4444]/70 transition-colors"
        >
          Browse All Products on Ayonne.skin
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
