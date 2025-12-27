'use client'

import { useState, useMemo } from 'react'
import { formatPrice } from '@/lib/utils'
import { getShopifyProductUrl, SHOPIFY_STORE_URL } from '@/lib/shopify'
import { getShopifyImageUrl, buildShopifyCartUrl } from '@/lib/shopify-products'
import { useToast } from '@/components/ui/Toast'
import ScarcityIndicator from './ScarcityIndicator'

type SortOption = 'relevance' | 'price-low' | 'price-high'

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
  showScarcity?: boolean
}

function ProductCard({ rec, idx, isSelected, onToggleSelect, showScarcity = false }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  // Get the Shopify slug for product URLs (use productShopifySlug if available, fallback to productSlug)
  const shopifySlug = rec.productShopifySlug || rec.productSlug

  // Get image from Shopify CDN mapping using LOCAL slug (not Shopify handle)
  // SHOPIFY_PRODUCT_MAP is keyed by local productSlug, not shopifySlug
  const shopifyImage = getShopifyImageUrl(rec.productSlug)
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

        {/* Scarcity indicator for top recommendation */}
        {showScarcity && (
          <div className="mt-3 pt-3 border-t border-[#1C4444]/10">
            <ScarcityIndicator
              productName={rec.productName}
              stockLevel="low"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductRecommendations({ recommendations }: ProductRecommendationsProps) {
  const { showToast } = useToast()

  // Start with all products selected
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    new Set(recommendations.map(r => r.productSlug))
  )
  const [sortBy, setSortBy] = useState<SortOption>('relevance')

  // Sort recommendations
  const sortedRecommendations = useMemo(() => {
    const sorted = [...recommendations]
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.productSalePrice || a.productPrice) - (b.productSalePrice || b.productPrice))
        break
      case 'price-high':
        sorted.sort((a, b) => (b.productSalePrice || b.productPrice) - (a.productSalePrice || a.productPrice))
        break
      case 'relevance':
      default:
        sorted.sort((a, b) => b.relevanceScore - a.relevanceScore)
        break
    }
    return sorted
  }, [recommendations, sortBy])

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
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-[#1C4444]/20 rounded-lg px-3 py-1.5 bg-white text-[#1C4444] focus:outline-none focus:ring-2 focus:ring-[#1C4444]/10"
            aria-label="Sort products by"
          >
            <option value="relevance">Best Match</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
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
        {sortedRecommendations.map((rec, idx) => (
          <ProductCard
            key={rec.productId}
            rec={rec}
            idx={idx}
            isSelected={selectedSlugs.has(rec.productSlug)}
            onToggleSelect={() => toggleSelect(rec.productSlug)}
            showScarcity={idx === 0}
          />
        ))}
      </div>

      {/* Checkout Section - Enhanced Marketing */}
      <div className="mt-6 pt-6 border-t border-[#1C4444]/10">
        {/* Free Shipping Progress */}
        {!noneSelected && totalPrice < 50 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-[#F4EBE7] to-[#F4EBE7]/50 rounded-lg border border-[#D4AF37]/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="text-sm text-[#1C4444] font-medium">
                Add {formatPrice(50 - totalPrice)} more for FREE shipping!
              </span>
            </div>
            <div className="h-1.5 bg-[#1C4444]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalPrice / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {!noneSelected && totalPrice >= 50 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-[#1C4444]/5 to-transparent rounded-lg border border-[#1C4444]/10">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#1C4444]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-[#1C4444] font-medium">
                You qualify for FREE shipping!
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            {!noneSelected && (
              <>
                <p className="text-sm text-[#1C4444]/60">
                  {selectedProducts.length} personalized product{selectedProducts.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-2xl font-medium text-[#1C4444]">
                  {formatPrice(totalPrice)}
                </p>
                {/* Trust indicator */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-xs text-[#1C4444]/50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#1C4444]/50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Premium CTA Button */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <a
              href={getCartUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-medium transition-all duration-300 overflow-hidden ${
                noneSelected
                  ? 'bg-[#1C4444]/20 text-[#1C4444]/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white shadow-luxury hover:shadow-luxury-lg hover:scale-[1.02]'
              }`}
              onClick={(e) => {
                if (noneSelected) {
                  e.preventDefault()
                } else {
                  showToast(`${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''} added to cart!`, 'success')
                }
              }}
            >
              {/* Shine effect on hover */}
              {!noneSelected && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}

              <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="relative z-10 text-base tracking-wide">
                {noneSelected ? 'Select Your Products' : 'Complete Your Routine'}
              </span>
              {!noneSelected && (
                <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </a>
            {!noneSelected && (
              <p className="text-xs text-[#1C4444]/40 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Opens Ayonne.skin checkout
              </p>
            )}
          </div>
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
