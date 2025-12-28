'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SHOPIFY_PRODUCT_MAP } from '@/lib/shopify-products'

interface SelectedProduct {
  slug: string
  name: string
  imageUrl: string
  category: string
}

interface CompatibilityResult {
  score: number
  issues: Array<{
    type: 'conflict' | 'warning' | 'timing' | 'missing'
    severity: 'high' | 'medium' | 'low'
    title: string
    description: string
    products?: string[]
  }>
  suggestions: Array<{
    type: 'timing' | 'order' | 'add' | 'remove'
    title: string
    description: string
    productSlug?: string
  }>
  routine: {
    morning: string[]
    evening: string[]
  }
}

const productCategories = {
  'Cleansers': ['vitamin-c-cleanser', 'kale-face-cleanser', 'makeup-remover-solution'],
  'Toners': ['vitamin-c-toner', 'antioxidant-toner'],
  'Serums': [
    'vitamin-c-lotion', 'collagen-and-retinol-serum', 'hyaluronic-acid-serum',
    'niacinamide-vitamin-boost-serum', 'firm-serum', 'hydration-serum', 'glycolic-acid-serum'
  ],
  'Moisturizers': [
    'embrace-collagen-moisturizer', 'hyaluronic-moisturizer', 'soothing-moisturizer',
    'oil-control-hydrator'
  ],
  'Eye Care': ['active-eye-cream', 'mens-under-eye-cream'],
  'Treatments': ['anti-aging-rose-gold-oil', 'glow-mask', 'mint-exfoliating-facial-polish'],
} as const

export default function RoutineCheckerPage() {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('Cleansers')

  const addProduct = (slug: string) => {
    const product = SHOPIFY_PRODUCT_MAP[slug]
    if (product && !selectedProducts.find(p => p.slug === slug)) {
      let category = 'Other'
      for (const [cat, slugs] of Object.entries(productCategories)) {
        if ((slugs as readonly string[]).includes(slug)) {
          category = cat
          break
        }
      }
      setSelectedProducts(prev => [...prev, {
        slug,
        name: product.title,
        imageUrl: product.imageUrl,
        category
      }])
    }
  }

  const removeProduct = (slug: string) => {
    setSelectedProducts(prev => prev.filter(p => p.slug !== slug))
    setResult(null)
  }

  const analyzeRoutine = async () => {
    if (selectedProducts.length < 2) return
    setAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch('/api/routine-checker/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: selectedProducts.map(p => p.slug) })
      })
      if (!response.ok) throw new Error('Analysis failed')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => { setResult(null) }, [selectedProducts])

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      <section className="py-12 md:py-16 border-b border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C4444]/10 rounded-full text-sm text-[#1C4444] mb-6">
              <span className="text-lg">🧪</span>
              <span>AI-Powered Analysis</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-normal text-[#1C4444] mb-4">
              Are Your Skincare Products<br />
              <span className="text-[#9A8428]">Fighting Each Other?</span>
            </h1>
            <p className="text-[#1C4444]/70 text-lg mb-8">
              Select your products and we&apos;ll check for ingredient conflicts,
              timing issues, and missing routine steps.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-[#1C4444]">Your Products</h2>
                <button onClick={() => setShowProductPicker(true)} className="btn-primary btn-sm">
                  + Add Product
                </button>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#1C4444]/20 rounded-xl">
                  <div className="text-4xl mb-4">🧴</div>
                  <p className="text-[#1C4444]/60 mb-4">No products selected yet</p>
                  <button onClick={() => setShowProductPicker(true)} className="btn-secondary btn-sm">
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedProducts.map((product) => (
                    <div key={product.slug} className="relative group bg-[#F4EBE7] rounded-xl p-3">
                      <button
                        onClick={() => removeProduct(product.slug)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        aria-label={`Remove ${product.name}`}
                      >
                        ×
                      </button>
                      <div className="aspect-square relative mb-2 rounded-lg overflow-hidden bg-white">
                        <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-2" sizes="(max-width: 640px) 50vw, 25vw" />
                      </div>
                      <p className="text-xs text-[#1C4444] font-medium line-clamp-2 text-center">{product.name}</p>
                      <p className="text-xs text-[#1C4444]/50 text-center mt-1">{product.category}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedProducts.length >= 2 && (
                <div className="mt-6 text-center">
                  <button onClick={analyzeRoutine} disabled={analyzing} className="btn-primary btn-lg w-full sm:w-auto">
                    {analyzing ? (
                      <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing...</>
                    ) : (
                      <><span>🔬</span>Check Compatibility</>
                    )}
                  </button>
                  <p className="text-xs text-[#1C4444]/50 mt-2">{selectedProducts.length} products selected</p>
                </div>
              )}
            </div>

            {result && (
              <div className="space-y-6 animate-elegant-fade-in">
                <div className="bg-white rounded-2xl p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#F4EBE7" strokeWidth="12" />
                        <circle cx="64" cy="64" r="56" fill="none" stroke={result.score >= 8 ? '#1C4444' : result.score >= 6 ? '#9A8428' : '#DC2626'} strokeWidth="12" strokeDasharray={`${(result.score / 10) * 352} 352`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-[#1C4444]">{result.score}</span>
                        <span className="text-xs text-[#1C4444]/60">/10</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-medium text-[#1C4444] mb-2">
                        {result.score >= 8 ? 'Great Routine!' : result.score >= 6 ? 'Good, But Could Be Better' : 'Needs Attention'}
                      </h3>
                      <p className="text-[#1C4444]/70">
                        {result.score >= 8 ? 'Your products work well together with minimal conflicts.' : result.score >= 6 ? 'We found a few issues that could affect your results.' : 'Several conflicts detected that may reduce effectiveness or cause irritation.'}
                      </p>
                    </div>
                  </div>
                </div>

                {result.issues.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 md:p-8">
                    <h3 className="text-lg font-medium text-[#1C4444] mb-4 flex items-center gap-2">
                      <span className="text-xl">⚠️</span>Issues Found ({result.issues.length})
                    </h3>
                    <div className="space-y-4">
                      {result.issues.map((issue, i) => (
                        <div key={i} className={`p-4 rounded-xl border-l-4 ${issue.severity === 'high' ? 'bg-red-50 border-red-500' : issue.severity === 'medium' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{issue.type === 'conflict' ? '⚡' : issue.type === 'warning' ? '⚠️' : issue.type === 'timing' ? '⏰' : '➕'}</span>
                            <div>
                              <h4 className="font-medium text-[#1C4444]">{issue.title}</h4>
                              <p className="text-sm text-[#1C4444]/70 mt-1">{issue.description}</p>
                              {issue.products && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {issue.products.map((p, j) => <span key={j} className="text-xs px-2 py-1 bg-white rounded-full text-[#1C4444]">{p}</span>)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.suggestions.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 md:p-8">
                    <h3 className="text-lg font-medium text-[#1C4444] mb-4 flex items-center gap-2">
                      <span className="text-xl">💡</span>How to Optimize Your Routine
                    </h3>
                    <div className="space-y-4">
                      {result.suggestions.map((suggestion, i) => (
                        <div key={i} className="p-4 bg-[#F4EBE7] rounded-xl">
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{suggestion.type === 'timing' ? '⏰' : suggestion.type === 'order' ? '📋' : suggestion.type === 'add' ? '➕' : '➖'}</span>
                            <div>
                              <h4 className="font-medium text-[#1C4444]">{suggestion.title}</h4>
                              <p className="text-sm text-[#1C4444]/70 mt-1">{suggestion.description}</p>
                              {suggestion.productSlug && SHOPIFY_PRODUCT_MAP[suggestion.productSlug] && (
                                <Link href={`https://ayonne.skin/products/${SHOPIFY_PRODUCT_MAP[suggestion.productSlug]?.handle}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-[#1C4444] font-medium mt-2 hover:underline">
                                  Shop Now →
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 md:p-8">
                  <h3 className="text-lg font-medium text-[#1C4444] mb-4 flex items-center gap-2">
                    <span className="text-xl">📋</span>Recommended Application Order
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <h4 className="font-medium text-[#1C4444] mb-3 flex items-center gap-2"><span>☀️</span> Morning</h4>
                      <ol className="space-y-2">
                        {result.routine.morning.map((step, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#1C4444] text-white text-xs flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm text-[#1C4444]">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl">
                      <h4 className="font-medium text-[#1C4444] mb-3 flex items-center gap-2"><span>🌙</span> Evening</h4>
                      <ol className="space-y-2">
                        {result.routine.evening.map((step, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#1C4444] text-white text-xs flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm text-[#1C4444]">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#1C4444] to-[#2d6a6a] text-white rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium">Get Personalized Analysis</h3>
                      <p className="text-white/80 text-sm">Upload a selfie for AI-powered skin analysis and product recommendations</p>
                    </div>
                    <Link href="/skin-analysis" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1C4444] rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap">
                      <span>📷</span>Start Skin Analysis
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white rounded-xl p-5 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-medium text-[#1C4444] mb-1">Ingredient Conflicts</h4>
                <p className="text-sm text-[#1C4444]/60">Vitamin C + Retinol timing, pH incompatibilities</p>
              </div>
              <div className="bg-white rounded-xl p-5 text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <h4 className="font-medium text-[#1C4444] mb-1">Over-Exfoliation</h4>
                <p className="text-sm text-[#1C4444]/60">Too many acids or actives at once</p>
              </div>
              <div className="bg-white rounded-xl p-5 text-center">
                <div className="text-2xl mb-2">➕</div>
                <h4 className="font-medium text-[#1C4444] mb-1">Missing Steps</h4>
                <p className="text-sm text-[#1C4444]/60">Identify gaps like SPF or moisturizer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showProductPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProductPicker(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-[#1C4444]/10 flex items-center justify-between">
              <h3 className="text-lg font-medium text-[#1C4444]">Select Products</h3>
              <button onClick={() => setShowProductPicker(false)} className="w-8 h-8 rounded-full bg-[#F4EBE7] flex items-center justify-center text-[#1C4444]">×</button>
            </div>
            <div className="flex gap-2 p-4 overflow-x-auto border-b border-[#1C4444]/10">
              {Object.keys(productCategories).map((category) => (
                <button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${activeCategory === category ? 'bg-[#1C4444] text-white' : 'bg-[#F4EBE7] text-[#1C4444] hover:bg-[#1C4444]/10'}`}>
                  {category}
                </button>
              ))}
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {productCategories[activeCategory as keyof typeof productCategories]?.map((slug) => {
                  const product = SHOPIFY_PRODUCT_MAP[slug]
                  const isSelected = selectedProducts.some(p => p.slug === slug)
                  if (!product) return null
                  return (
                    <button key={slug} onClick={() => isSelected ? removeProduct(slug) : addProduct(slug)} className={`p-3 rounded-xl text-left transition-all ${isSelected ? 'bg-[#1C4444]/10 ring-2 ring-[#1C4444]' : 'bg-[#F4EBE7] hover:bg-[#1C4444]/5'}`}>
                      <div className="aspect-square relative mb-2 rounded-lg overflow-hidden bg-white">
                        <Image src={product.imageUrl} alt={product.title} fill className="object-contain p-2" sizes="(max-width: 640px) 50vw, 33vw" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#1C4444]/20 flex items-center justify-center">
                            <span className="w-8 h-8 rounded-full bg-[#1C4444] text-white flex items-center justify-center">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#1C4444] font-medium line-clamp-2">{product.title}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-4 border-t border-[#1C4444]/10">
              <button onClick={() => setShowProductPicker(false)} className="btn-primary w-full">Done ({selectedProducts.length} selected)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
