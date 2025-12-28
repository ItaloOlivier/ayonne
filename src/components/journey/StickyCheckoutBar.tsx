'use client'

import { useState, useEffect } from 'react'
import { buildShopifyCartUrl } from '@/lib/shopify-products'

interface StickyCheckoutBarProps {
  products: Array<{
    slug: string
    name: string
    price: number
    imageUrl?: string
  }>
  discountCode?: string
  discountPercent?: number
  show?: boolean
}

export default function StickyCheckoutBar({
  products,
  discountCode,
  discountPercent,
  show = true,
}: StickyCheckoutBarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!show || products.length === 0) {
      setIsVisible(false)
      return
    }

    // Show after scrolling down a bit
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [show, products.length])

  if (!isVisible || products.length === 0) return null

  const subtotal = products.reduce((sum, p) => sum + p.price, 0)
  const discount = discountPercent ? subtotal * (discountPercent / 100) : 0
  const total = subtotal - discount

  const freeShippingThreshold = 50
  const hasFreeShipping = total >= freeShippingThreshold
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - total)

  const handleCheckout = () => {
    const url = buildShopifyCartUrl(
      products.map(p => p.slug),
      discountCode
    )
    window.open(url, '_blank')
  }

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sticky bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Free shipping progress bar */}
        {!hasFreeShipping && !discountCode && (
          <div className="bg-[#1C4444] text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
            <span>Add ${amountToFreeShipping.toFixed(2)} for</span>
            <span className="font-medium">FREE SHIPPING</span>
            <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] rounded-full"
                style={{ width: `${Math.min(100, (total / freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {hasFreeShipping && (
          <div className="bg-emerald-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Free shipping unlocked!</span>
          </div>
        )}

        {/* Main bar */}
        <div className="bg-white border-t border-[#1C4444]/10 shadow-lg">
          {/* Expanded view */}
          {isExpanded && (
            <div className="px-4 py-4 border-b border-[#1C4444]/10 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-[#1C4444]">Your Routine</h4>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-[#1C4444]/50 hover:text-[#1C4444]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {products.map((product, i) => (
                  <div key={product.slug} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F4EBE7] overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1C4444] truncate">{product.name}</p>
                    </div>
                    <p className="text-sm text-[#1C4444] font-medium">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              {discount > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1C4444]/10 flex justify-between text-sm">
                  <span className="text-emerald-600">Discount ({discountPercent}%)</span>
                  <span className="text-emerald-600">-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Collapsed bar */}
          <div className="px-4 py-3 flex items-center gap-4">
            {/* Product preview */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex -space-x-2"
            >
              {products.slice(0, 3).map((product, i) => (
                <div
                  key={product.slug}
                  className="w-10 h-10 rounded-full border-2 border-white bg-[#F4EBE7] overflow-hidden shadow-sm"
                  style={{ zIndex: 3 - i }}
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
              {products.length > 3 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#1C4444] flex items-center justify-center text-white text-xs font-medium">
                  +{products.length - 3}
                </div>
              )}
            </button>

            {/* Price info */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-left"
              >
                <p className="text-sm text-[#1C4444]/60">
                  {products.length} products
                </p>
                <p className="text-lg font-medium text-[#1C4444]">
                  ${total.toFixed(2)}
                  {discount > 0 && (
                    <span className="text-sm text-[#1C4444]/50 line-through ml-2">
                      ${subtotal.toFixed(2)}
                    </span>
                  )}
                </p>
              </button>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="px-6 py-3 bg-[#1C4444] text-white rounded-xl font-medium hover:bg-[#2d5a5a] transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span>Checkout</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Mini version for inline use
export function InlineCheckoutBar({
  products,
  discountCode,
  discountPercent,
}: Omit<StickyCheckoutBarProps, 'show'>) {
  const subtotal = products.reduce((sum, p) => sum + p.price, 0)
  const discount = discountPercent ? subtotal * (discountPercent / 100) : 0
  const total = subtotal - discount

  const handleCheckout = () => {
    const url = buildShopifyCartUrl(
      products.map(p => p.slug),
      discountCode
    )
    window.open(url, '_blank')
  }

  if (products.length === 0) return null

  return (
    <div className="bg-[#1C4444] rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">{products.length} products selected</p>
          <p className="text-xl font-light">
            ${total.toFixed(2)}
            {discount > 0 && (
              <span className="text-sm text-white/50 line-through ml-2">
                ${subtotal.toFixed(2)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleCheckout}
          className="px-6 py-3 bg-white text-[#1C4444] rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
        >
          <span>Checkout</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
