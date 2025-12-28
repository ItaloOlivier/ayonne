'use client'

import { useState } from 'react'
import { buildShopifyCartUrl } from '@/lib/shopify-products'

interface Bundle {
  id: string
  name: string
  tagline: string
  products: Array<{
    slug: string
    name: string
    price: number
    imageUrl?: string
  }>
  originalPrice: number
  bundlePrice: number
  savings: number
  badge?: string
  popular?: boolean
}

interface QuickBundleProps {
  bundles: Bundle[]
  userConcerns: string[]
  discountCode?: string
  discountPercent?: number
}

export default function QuickBundle({
  bundles,
  userConcerns,
  discountCode,
  discountPercent,
}: QuickBundleProps) {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)

  const handleCheckout = (bundle: Bundle) => {
    const finalPrice = discountPercent
      ? bundle.bundlePrice * (1 - discountPercent / 100)
      : bundle.bundlePrice

    const url = buildShopifyCartUrl(
      bundle.products.map(p => p.slug),
      discountCode
    )
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-[#D4AF37] text-xs tracking-widest uppercase font-medium mb-2">
          Curated For You
        </p>
        <h2 className="text-2xl text-[#1C4444] font-light">
          Complete Skincare Bundles
        </h2>
        <p className="text-[#1C4444]/60 text-sm mt-2">
          Everything you need in one click
        </p>
      </div>

      {/* Bundle Cards */}
      <div className="space-y-4">
        {bundles.map((bundle) => {
          const isSelected = selectedBundle === bundle.id
          const finalPrice = discountPercent
            ? bundle.bundlePrice * (1 - discountPercent / 100)
            : bundle.bundlePrice
          const totalSavings = bundle.originalPrice - finalPrice

          return (
            <div
              key={bundle.id}
              className={`relative bg-white rounded-2xl shadow-luxury overflow-hidden transition-all ${
                bundle.popular ? 'ring-2 ring-[#D4AF37]' : ''
              } ${isSelected ? 'ring-2 ring-[#1C4444]' : ''}`}
            >
              {/* Popular badge */}
              {bundle.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-[#D4AF37] text-[#1C4444] text-xs font-bold px-4 py-1 rounded-bl-xl">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Bundle content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg text-[#1C4444] font-medium">
                      {bundle.name}
                    </h3>
                    <p className="text-sm text-[#1C4444]/60 mt-0.5">
                      {bundle.tagline}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-[#1C4444] font-light">
                      ${finalPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-[#1C4444]/50 line-through">
                      ${bundle.originalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Product previews */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-3">
                    {bundle.products.slice(0, 4).map((product, i) => (
                      <div
                        key={product.slug}
                        className="w-12 h-12 rounded-full border-2 border-white bg-[#F4EBE7] overflow-hidden shadow-sm"
                        style={{ zIndex: 4 - i }}
                        title={product.name}
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#1C4444]/60">
                            {i + 1}
                          </div>
                        )}
                      </div>
                    ))}
                    {bundle.products.length > 4 && (
                      <div className="w-12 h-12 rounded-full border-2 border-white bg-[#1C4444] flex items-center justify-center text-white text-xs font-medium">
                        +{bundle.products.length - 4}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[#1C4444]/60">
                    {bundle.products.length} products
                  </p>
                </div>

                {/* Savings highlight */}
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-700 font-medium">
                      Save ${totalSavings.toFixed(2)}
                    </p>
                    <p className="text-emerald-600 text-sm">
                      {Math.round((totalSavings / bundle.originalPrice) * 100)}% off retail
                    </p>
                  </div>
                </div>

                {/* Expandable product list */}
                <button
                  onClick={() => setSelectedBundle(isSelected ? null : bundle.id)}
                  className="w-full flex items-center justify-between py-2 text-sm text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
                >
                  <span>View all products</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isSelected && (
                  <div className="mt-2 space-y-2 border-t border-[#1C4444]/10 pt-3">
                    {bundle.products.map((product, i) => (
                      <div key={product.slug} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#1C4444] text-white text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm text-[#1C4444]">{product.name}</span>
                        <span className="text-sm text-[#1C4444]/50">${product.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(bundle)}
                  className={`w-full mt-4 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    bundle.popular
                      ? 'bg-[#D4AF37] text-[#1C4444] hover:bg-[#C9A227]'
                      : 'bg-[#1C4444] text-white hover:bg-[#2d5a5a]'
                  }`}
                >
                  <span>Get This Bundle</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 py-4 text-xs text-[#1C4444]/50">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          7-day guarantee
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Free shipping $50+
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Cruelty-free
        </span>
      </div>
    </div>
  )
}

// Compact single bundle CTA
export function FeaturedBundle({
  bundle,
  discountCode,
  discountPercent,
}: {
  bundle: Bundle
  discountCode?: string
  discountPercent?: number
}) {
  const finalPrice = discountPercent
    ? bundle.bundlePrice * (1 - discountPercent / 100)
    : bundle.bundlePrice
  const totalSavings = bundle.originalPrice - finalPrice

  const handleCheckout = () => {
    const url = buildShopifyCartUrl(
      bundle.products.map(p => p.slug),
      discountCode
    )
    window.open(url, '_blank')
  }

  return (
    <div className="bg-gradient-to-br from-[#1C4444] to-[#2a5858] rounded-2xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 bg-[#D4AF37] text-[#1C4444] text-xs font-bold rounded">
          BEST VALUE
        </span>
        <span className="text-white/60 text-sm">Save ${totalSavings.toFixed(2)}</span>
      </div>

      <h3 className="text-xl font-light mb-1">{bundle.name}</h3>
      <p className="text-white/70 text-sm mb-4">{bundle.tagline}</p>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {bundle.products.slice(0, 3).map((product, i) => (
            <div
              key={product.slug}
              className="w-10 h-10 rounded-full border-2 border-[#1C4444] bg-white overflow-hidden"
              style={{ zIndex: 3 - i }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#F4EBE7]" />
              )}
            </div>
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-[#1C4444] bg-white/10 flex items-center justify-center text-xs">
            +{bundle.products.length - 3}
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-light">${finalPrice.toFixed(2)}</p>
          <p className="text-white/50 text-sm line-through">${bundle.originalPrice.toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        className="w-full mt-4 py-3 bg-white text-[#1C4444] rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
      >
        <span>Get Complete Bundle</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  )
}
