'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SHOPIFY_STORE_URL } from '@/lib/shopify'
import { getShopifyProduct, buildShopifyCartUrl } from '@/lib/shopify-products'

// Matches the structure stored in the database from analyze endpoint
interface StoredRecommendation {
  productId: string
  productName: string
  productSlug: string
  productShopifySlug: string | null
  productImage: string | null
  productPrice: number
  productSalePrice: number | null
  reason: string
  relevanceScore: number
}

interface SkinAnalysis {
  id: string
  skinType: string | null
  conditions: Array<{ name: string; confidence: number }>
  recommendations: StoredRecommendation[]
  createdAt: string
}

export default function MyRecommendationsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [latestAnalysis, setLatestAnalysis] = useState<SkinAnalysis | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch the user's latest analysis with recommendations
    fetch('/api/skin-analysis/history?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.error === 'Unauthorized') {
          router.push('/login')
          return
        }
        if (data.analyses && data.analyses.length > 0) {
          const analysis = data.analyses[0]
          // Parse recommendations if they're stored as JSON string
          if (typeof analysis.recommendations === 'string') {
            try {
              analysis.recommendations = JSON.parse(analysis.recommendations)
            } catch {
              analysis.recommendations = []
            }
          }
          setLatestAnalysis(analysis)
          // Pre-select top 3 products
          if (analysis.recommendations && analysis.recommendations.length > 0) {
            const topProducts = analysis.recommendations.slice(0, 3).map((p: StoredRecommendation) => p.productSlug)
            setSelectedProducts(new Set(topProducts))
          }
        }
      })
      .catch(err => {
        console.error('Error fetching recommendations:', err)
        setError('Failed to load recommendations')
      })
      .finally(() => setIsLoading(false))
  }, [router])

  const toggleProduct = (slug: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(slug)) {
      newSelected.delete(slug)
    } else {
      newSelected.add(slug)
    }
    setSelectedProducts(newSelected)
  }

  const handleCheckout = () => {
    if (selectedProducts.size === 0) return
    const cartUrl = buildShopifyCartUrl(Array.from(selectedProducts))
    window.open(cartUrl, '_blank')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getTotalPrice = () => {
    if (!latestAnalysis?.recommendations) return 0
    return latestAnalysis.recommendations
      .filter((p: StoredRecommendation) => selectedProducts.has(p.productSlug))
      .reduce((sum: number, p: StoredRecommendation) => sum + (p.productSalePrice || p.productPrice), 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4EBE7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Header */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <Link
              href="/skin-analysis/history"
              className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Progress
            </Link>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1C4444]/10 mb-4">
              <svg className="w-8 h-8 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-normal text-[#1C4444] mb-2">
              My Product Recommendations
            </h1>
            <p className="text-[#1C4444]/60">
              Personalized skincare products based on your latest skin analysis
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {error ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Link href="/skin-analysis" className="btn-primary">
                  Start New Analysis
                </Link>
              </div>
            ) : !latestAnalysis ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-[#1C4444] mb-2">
                  No Recommendations Yet
                </h2>
                <p className="text-[#1C4444]/60 mb-6">
                  Complete a skin analysis to get personalized product recommendations tailored to your skin type and concerns.
                </p>
                <Link href="/skin-analysis" className="btn-primary">
                  Start Your Skin Analysis
                </Link>
              </div>
            ) : (
              <>
                {/* Analysis Summary */}
                <div className="bg-white rounded-xl p-6 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#1C4444]/60 mb-1">Based on your analysis from</p>
                      <p className="text-[#1C4444] font-medium">
                        {new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {latestAnalysis.skinType && (
                        <span className="px-3 py-1 bg-[#1C4444] text-white text-sm rounded-full">
                          {latestAnalysis.skinType.charAt(0).toUpperCase() + latestAnalysis.skinType.slice(1)} Skin
                        </span>
                      )}
                      {latestAnalysis.conditions?.slice(0, 3).map((c) => (
                        <span key={c.name} className="px-3 py-1 bg-[#F4EBE7] text-[#1C4444] text-sm rounded-full">
                          {c.name}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/skin-analysis/results/${latestAnalysis.id}`}
                      className="text-[#1C4444] text-sm hover:underline"
                    >
                      View Full Results
                    </Link>
                  </div>
                </div>

                {/* Products Grid */}
                {latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 ? (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {latestAnalysis.recommendations.map((product: StoredRecommendation) => {
                        const shopifyInfo = getShopifyProduct(product.productSlug)
                        const imageUrl = shopifyInfo?.imageUrl || product.productImage || '/images/products/placeholder.jpg'
                        const isSelected = selectedProducts.has(product.productSlug)

                        return (
                          <div
                            key={product.productSlug}
                            className={`bg-white rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              isSelected ? 'border-[#1C4444] shadow-lg' : 'border-transparent hover:border-[#1C4444]/30'
                            }`}
                            onClick={() => toggleProduct(product.productSlug)}
                          >
                            {/* Product Image */}
                            <div className="relative aspect-square bg-[#F4EBE7]">
                              <Image
                                src={imageUrl}
                                alt={product.productName}
                                fill
                                className="object-cover"
                              />
                              {/* Selection Checkbox */}
                              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-[#1C4444] border-[#1C4444]' : 'bg-white border-[#1C4444]/30'
                              }`}>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {/* Match Badge */}
                              {product.relevanceScore > 0 && (
                                <div className="absolute top-3 left-3 bg-[#1C4444] text-white text-xs px-2 py-1 rounded-full">
                                  {Math.min(Math.round(product.relevanceScore), 99)}% Match
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                              <h3 className="font-medium text-[#1C4444] mb-1 line-clamp-2">
                                {product.productName}
                              </h3>
                              {product.reason && (
                                <p className="text-[#1C4444]/60 text-sm mb-3 line-clamp-2">
                                  {product.reason}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <div>
                                  {product.productSalePrice ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-[#1C4444]">
                                        {formatPrice(product.productSalePrice)}
                                      </span>
                                      <span className="text-sm text-[#1C4444]/50 line-through">
                                        {formatPrice(product.productPrice)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-medium text-[#1C4444]">
                                      {formatPrice(product.productPrice)}
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={`${SHOPIFY_STORE_URL}/products/${shopifyInfo?.handle || product.productShopifySlug || product.productSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#1C4444] text-sm hover:underline"
                                >
                                  View Details
                                </a>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Enhanced Checkout Bar */}
                    <div className="sticky bottom-0 bg-white border-t border-[#1C4444]/10 shadow-luxury-lg -mx-4 lg:-mx-8">
                      <div className="container mx-auto max-w-5xl p-4">
                        {/* Free Shipping Progress */}
                        {selectedProducts.size > 0 && getTotalPrice() < 50 && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-[#F4EBE7] to-[#F4EBE7]/50 rounded-lg border border-[#D4AF37]/20">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                              <span className="text-sm text-[#1C4444] font-medium">
                                Add {formatPrice(50 - getTotalPrice())} more for FREE shipping!
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#1C4444]/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((getTotalPrice() / 50) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {selectedProducts.size > 0 && getTotalPrice() >= 50 && (
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
                            {selectedProducts.size > 0 && (
                              <>
                                <p className="text-sm text-[#1C4444]/60">
                                  {selectedProducts.size} personalized product{selectedProducts.size !== 1 ? 's' : ''} selected
                                </p>
                                <p className="text-2xl font-medium text-[#1C4444]">
                                  {formatPrice(getTotalPrice())}
                                </p>
                                {/* Trust indicators */}
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
                            <button
                              onClick={handleCheckout}
                              disabled={selectedProducts.size === 0}
                              className={`group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-medium transition-all duration-300 overflow-hidden ${
                                selectedProducts.size === 0
                                  ? 'bg-[#1C4444]/20 text-[#1C4444]/50 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white shadow-luxury hover:shadow-luxury-lg hover:scale-[1.02]'
                              }`}
                            >
                              {/* Shine effect on hover */}
                              {selectedProducts.size > 0 && (
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                              )}

                              <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              <span className="relative z-10 text-base tracking-wide">
                                {selectedProducts.size === 0 ? 'Select Your Products' : 'Complete Your Routine'}
                              </span>
                              {selectedProducts.size > 0 && (
                                <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              )}
                            </button>
                            {selectedProducts.size > 0 && (
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
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <p className="text-[#1C4444]/60 mb-4">
                      No product recommendations available for this analysis.
                    </p>
                    <Link href="/skin-analysis" className="btn-primary">
                      Start New Analysis
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
