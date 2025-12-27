'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { getShopifyProductUrl, SHOPIFY_STORE_URL } from '@/lib/shopify'
import { getShopifyImageUrl, buildShopifyCartUrl } from '@/lib/shopify-products'

interface RecommendedProduct {
  productId: string
  productName: string
  productSlug: string
  productShopifySlug?: string | null  // Actual Shopify product handle
  productImage: string | null
  productPrice: number
  productSalePrice: number | null
  reason: string
  relevanceScore: number
}

interface ProductRecommendationsProps {
  recommendations: RecommendedProduct[]
}

interface ProductCardProps {
  rec: RecommendedProduct
  idx: number
  isSelected: boolean
  onToggleSelect: () => void
}

function ProductCard({ rec, idx, isSelected, onToggleSelect }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  // Get the Shopify slug (use productShopifySlug if available, fallback to productSlug)
  const shopifySlug = rec.productShopifySlug || rec.productSlug

  // Get image from Shopify CDN mapping, fallback to provided image
  const shopifyImage = getShopifyImageUrl(shopifySlug)
  const imageUrl = shopifyImage || rec.productImage || ''

  const showPlaceholder = imageError || !imageUrl

  return (
    <div className={`group border rounded-lg overflow-hidden transition-colors ${
      isSelected
        ? 'border-[#1C4444] ring-2 ring-[#1C4444]/20'
        : 'border-[#1C4444]/10 hover:border-[#1C4444]/30'
    }`}>
      {/* Selection Checkbox */}
      <div className="relative">
        <button
          onClick={onToggleSelect}
          className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{
            backgroundColor: isSelected ? '#1C4444' : 'white',
            borderColor: isSelected ? '#1C4444' : 'rgba(28, 68, 68, 0.3)',
          }}
        >
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Product Image */}
        <a
          href={getShopifyProductUrl(rec.productSlug, shopifySlug)}
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
            <div className="absolute top-2 right-2 bg-[#1C4444] text-white text-xs px-2 py-1 rounded">
              Best Match
            </div>
          )}

          {/* Sale Badge */}
          {rec.productSalePrice && (
            <div className={`absolute ${idx === 0 ? 'top-9' : 'top-2'} right-2 bg-red-500 text-white text-xs px-2 py-1 rounded`}>
              Sale
            </div>
          )}
        </a>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <a
          href={getShopifyProductUrl(rec.productSlug, shopifySlug)}
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
        <div className="flex items-center gap-2">
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
      </div>
    </div>
  )
}

export default function ProductRecommendations({ recommendations }: ProductRecommendationsProps) {
  // Start with all products selected
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    new Set(recommendations.map(r => r.productSlug))
  )

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-medium text-[#1C4444] mb-4">Recommended For You</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F4EBE7] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#1C4444]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-[#1C4444]/60 mb-4">
            No product recommendations available at this time.
          </p>
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

  const toggleSelect = (slug: string) => {
    setSelectedSlugs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedSlugs(new Set(recommendations.map(r => r.productSlug)))
  }

  const deselectAll = () => {
    setSelectedSlugs(new Set())
  }

  // Calculate total for selected products
  const selectedProducts = recommendations.filter(r => selectedSlugs.has(r.productSlug))
  const totalPrice = selectedProducts.reduce(
    (sum, r) => sum + (r.productSalePrice || r.productPrice),
    0
  )

  // Build Shopify cart URL with all selected products using variant IDs
  const getCartUrl = () => {
    if (selectedProducts.length === 0) return SHOPIFY_STORE_URL
    const slugs = selectedProducts.map(p => p.productSlug)
    return buildShopifyCartUrl(slugs)
  }

  const allSelected = selectedSlugs.size === recommendations.length
  const noneSelected = selectedSlugs.size === 0

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-medium text-[#1C4444]">Recommended For You</h3>
          <p className="text-[#1C4444]/60 text-sm">
            Select products to add to your cart
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="text-sm text-[#1C4444] hover:text-[#1C4444]/70 transition-colors underline"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-[#1C4444]/50">
            {selectedSlugs.size} of {recommendations.length} selected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => (
          <ProductCard
            key={rec.productId}
            rec={rec}
            idx={idx}
            isSelected={selectedSlugs.has(rec.productSlug)}
            onToggleSelect={() => toggleSelect(rec.productSlug)}
          />
        ))}
      </div>

      {/* Checkout Section */}
      <div className="mt-6 pt-6 border-t border-[#1C4444]/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            {!noneSelected && (
              <>
                <p className="text-sm text-[#1C4444]/60">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xl font-medium text-[#1C4444]">
                  Total: {formatPrice(totalPrice)}
                </p>
              </>
            )}
          </div>
          <a
            href={getCartUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors ${
              noneSelected
                ? 'bg-[#1C4444]/20 text-[#1C4444]/50 cursor-not-allowed'
                : 'bg-[#1C4444] text-white hover:bg-[#1C4444]/90'
            }`}
            onClick={(e) => {
              if (noneSelected) e.preventDefault()
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {noneSelected ? 'Select Products' : `Checkout on Ayonne (${selectedProducts.length})`}
          </a>
        </div>
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
