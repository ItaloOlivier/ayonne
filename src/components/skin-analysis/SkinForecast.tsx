'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SkinForecast, ConditionProjection, ProductForCondition } from '@/lib/skin-analysis/forecast'
import { buildShopifyCartUrl } from '@/lib/shopify-products'

interface SkinForecastProps {
  forecast: SkinForecast
  skinType: string | null
}

export default function SkinForecastView({ forecast, skinType }: SkinForecastProps) {
  const [activeScenario, setActiveScenario] = useState<'withProducts' | 'withoutProducts'>('withProducts')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set((forecast.recommendedProducts || []).map(p => p.slug))
  )

  const toggleProduct = (slug: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(slug)) {
      newSelected.delete(slug)
    } else {
      newSelected.add(slug)
    }
    setSelectedProducts(newSelected)
  }

  const selectedTotal = (forecast.recommendedProducts || [])
    .filter(p => selectedProducts.has(p.slug))
    .reduce((sum, p) => sum + p.price, 0)

  const handleCheckout = () => {
    const slugs = (forecast.recommendedProducts || [])
      .filter(p => selectedProducts.has(p.slug))
      .map(p => p.slug)
    if (slugs.length > 0) {
      const url = buildShopifyCartUrl(slugs)
      window.open(url, '_blank')
    }
  }

  // Calculate improvements (with products)
  const skinAgeImprovement = forecast.withProducts
    ? forecast.currentSkinAge - forecast.withProducts.skinAge90
    : 0
  const qualityImprovement = forecast.withProducts
    ? forecast.withProducts.qualityScore90 - forecast.currentQualityScore
    : 0

  // Calculate degradation (without products)
  const skinAgeDegradation = forecast.withoutProducts
    ? forecast.withoutProducts.skinAge90 - forecast.currentSkinAge
    : 0
  const qualityDegradation = forecast.withoutProducts
    ? forecast.currentQualityScore - forecast.withoutProducts.qualityScore90
    : 0

  // Early return if forecast data is incomplete
  if (!forecast.withProducts || !forecast.withoutProducts) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center">
        <p className="text-[#1C4444]/60">Loading forecast data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with confidence indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium text-[#1C4444]">Your Skin Forecast</h2>
          <p className="text-[#1C4444]/60 text-sm mt-1">
            Based on {forecast.analysisCount} {forecast.analysisCount === 1 ? 'analysis' : 'analyses'}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          forecast.confidenceLevel === 'high'
            ? 'bg-green-100 text-green-700'
            : forecast.confidenceLevel === 'medium'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {forecast.confidenceLevel === 'high' ? '🎯 High Confidence' :
           forecast.confidenceLevel === 'medium' ? '📊 Medium Confidence' :
           '📈 Building Data...'}
        </div>
      </div>

      {/* Scenario Toggle */}
      <div className="bg-[#F4EBE7] rounded-2xl p-2 flex gap-2">
        <button
          onClick={() => setActiveScenario('withProducts')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            activeScenario === 'withProducts'
              ? 'bg-gradient-to-r from-[#1C4444] to-[#2d6a6a] text-white shadow-lg'
              : 'text-[#1C4444]/70 hover:text-[#1C4444]'
          }`}
        >
          ✨ With Ayonne Products
        </button>
        <button
          onClick={() => setActiveScenario('withoutProducts')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            activeScenario === 'withoutProducts'
              ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg'
              : 'text-[#1C4444]/70 hover:text-[#1C4444]'
          }`}
        >
          ⚠️ Without Products
        </button>
      </div>

      {/* Main Projection Card */}
      {activeScenario === 'withProducts' ? (
        <WithProductsProjection
          forecast={forecast}
          skinAgeImprovement={skinAgeImprovement}
          qualityImprovement={qualityImprovement}
        />
      ) : (
        <WithoutProductsProjection
          forecast={forecast}
          skinAgeDegradation={skinAgeDegradation}
          qualityDegradation={qualityDegradation}
          onSwitchScenario={() => setActiveScenario('withProducts')}
        />
      )}

      {/* Products Needed for Results */}
      {(forecast.recommendedProducts || []).length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#D4AF37]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛍️</span>
              <h3 className="text-lg font-medium text-[#1C4444]">Products for These Results</h3>
            </div>
            <span className="text-sm text-[#D4AF37] font-medium">
              {selectedProducts.size} selected
            </span>
          </div>

          <p className="text-sm text-[#1C4444]/60 mb-4">
            The improvements above require these products. Select the ones you want to add to your routine.
          </p>

          <div className="space-y-3 mb-6">
            {(forecast.recommendedProducts || []).map(product => (
              <ProductCard
                key={product.slug}
                product={product}
                isSelected={selectedProducts.has(product.slug)}
                onToggle={() => toggleProduct(product.slug)}
                condition={(forecast.conditionProjections || []).find(c => c.recommendedProduct?.slug === product.slug)}
              />
            ))}
          </div>

          {/* Checkout CTA */}
          {selectedProducts.size > 0 && (
            <div className="bg-gradient-to-r from-[#1C4444] to-[#2d6a6a] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">{selectedProducts.size} products</p>
                  <p className="text-white text-2xl font-light">${selectedTotal.toFixed(2)}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  className="px-6 py-3 bg-white text-[#1C4444] rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <span>Get These Results</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
              <p className="text-white/50 text-xs mt-2">
                Checkout securely on ayonne.skin
              </p>
            </div>
          )}
        </div>
      )}

      {/* Condition Details */}
      {(forecast.conditionProjections || []).length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-medium text-[#1C4444] mb-4 flex items-center gap-2">
            <span>📊</span> Condition Breakdown
          </h3>
          <ConditionProjectionsView
            projections={forecast.conditionProjections || []}
            scenario={activeScenario}
          />
        </div>
      )}

      {/* Category Improvements */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-lg font-medium text-[#1C4444] mb-4 flex items-center gap-2">
          <span>📈</span> Category Changes (90 Days)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(forecast.categories).map(([category, values]) => {
            const projected = activeScenario === 'withProducts'
              ? values.withProducts90
              : values.withoutProducts90
            const change = projected - values.current
            const isImprovement = change > 0

            return (
              <div key={category} className="bg-[#F4EBE7] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1C4444] capitalize">{category}</span>
                  <span className={`text-sm font-medium ${
                    isImprovement ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-[#1C4444]'
                  }`}>
                    {change > 0 && '+'}{change}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#1C4444]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1C4444]/40 rounded-full"
                      style={{ width: `${values.current}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#1C4444]/60">{values.current}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                    isImprovement ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div
                      className={`h-full rounded-full ${isImprovement ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${projected}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isImprovement ? 'text-green-600' : 'text-red-500'}`}>
                    {projected}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Warnings */}
      {(forecast.warnings || []).length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-medium text-[#1C4444] mb-4 flex items-center gap-2">
            <span>⚠️</span> Important Notes
          </h3>
          <div className="space-y-3">
            {(forecast.warnings || []).map((warning, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  warning.type === 'degradation' ? 'bg-rose-50 border-rose-200' :
                  warning.type === 'seasonal' ? 'bg-blue-50 border-blue-200' :
                  'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{warning.icon}</span>
                  <div>
                    <h4 className="font-medium text-[#1C4444]">{warning.title}</h4>
                    <p className="text-sm text-[#1C4444]/70 mt-1">{warning.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consistency Score */}
      <div className="bg-[#F4EBE7] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-medium text-[#1C4444]">Tracking Consistency</p>
            <p className="text-xs text-[#1C4444]/60">
              {forecast.consistencyScore >= 70
                ? 'Great job! Keep analyzing weekly for best predictions.'
                : forecast.consistencyScore >= 40
                ? 'Good start! More frequent analyses = better forecasts.'
                : 'Tip: Weekly skin checks help us predict your progress.'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1C4444]">{forecast.consistencyScore}%</p>
        </div>
      </div>

      {/* New Analysis CTA */}
      <div className="bg-gradient-to-r from-[#9A8428] to-[#C4A83C] rounded-xl p-6 text-white text-center">
        <p className="text-lg font-medium mb-2">Track your progress</p>
        <p className="text-white/80 text-sm mb-4">
          Regular analyses help us give you better forecasts
        </p>
        <Link
          href="/skin-analysis"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1C4444] rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          <span>📷</span> New Analysis
        </Link>
      </div>
    </div>
  )
}

function WithProductsProjection({
  forecast,
  skinAgeImprovement,
  qualityImprovement,
}: {
  forecast: SkinForecast
  skinAgeImprovement: number
  qualityImprovement: number
}) {
  return (
    <div className="bg-gradient-to-br from-[#1C4444] to-[#2d6a6a] rounded-2xl p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h3 className="text-lg font-medium">With Ayonne Products (90 Days)</h3>
      </div>

      <div className="grid gap-4">
        {/* Skin Age Projection */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌟</span>
              <div>
                <p className="text-white/70 text-sm">Skin Age</p>
                <p className="text-xl font-medium">
                  {forecast.currentSkinAge} → {forecast.withProducts.skinAge90}
                  {skinAgeImprovement > 0 && (
                    <span className="text-green-300 ml-2 text-base">
                      (-{skinAgeImprovement} years)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-white/70">Best Achievable</p>
              <p className="font-medium">{forecast.withProducts.achievableSkinAge}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (skinAgeImprovement / Math.max(1, forecast.currentSkinAge - forecast.withProducts.achievableSkinAge)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Quality Score Projection */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-white/70 text-sm">Skin Health</p>
              <p className="text-xl font-medium">
                {forecast.currentQualityScore} → {forecast.withProducts.qualityScore90}
                {qualityImprovement > 0 && (
                  <span className="text-green-300 ml-2 text-base">
                    (+{qualityImprovement} points)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transition-all duration-1000"
              style={{ width: `${forecast.withProducts.qualityScore90}%` }}
            />
          </div>
        </div>

        {/* Conditions that will clear */}
        {forecast.conditionProjections.filter(c => c.withProducts.clearByDay !== null).length > 0 && (
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-sm mb-3">Expected to Clear</p>
            <div className="space-y-2">
              {forecast.conditionProjections
                .filter(c => c.withProducts.clearByDay !== null)
                .sort((a, b) => (a.withProducts.clearByDay || 999) - (b.withProducts.clearByDay || 999))
                .slice(0, 3)
                .map(condition => (
                  <div key={condition.id} className="flex items-center justify-between">
                    <span>{condition.name}</span>
                    <span className="text-green-300 text-sm">
                      Day {condition.withProducts.clearByDay}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="mt-6 flex justify-between text-xs text-white/60">
        <div className="text-center">
          <div className="w-3 h-3 bg-white/30 rounded-full mx-auto mb-1" />
          <p>Today</p>
          <p className="text-white font-medium">{forecast.currentQualityScore}</p>
        </div>
        <div className="flex-1 flex items-center px-4">
          <div className="h-0.5 w-full bg-white/20" />
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-white/50 rounded-full mx-auto mb-1" />
          <p>30 Days</p>
          <p className="text-white font-medium">{forecast.withProducts.qualityScore30}</p>
        </div>
        <div className="flex-1 flex items-center px-4">
          <div className="h-0.5 w-full bg-white/20" />
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-white/70 rounded-full mx-auto mb-1" />
          <p>60 Days</p>
          <p className="text-white font-medium">{forecast.withProducts.qualityScore60}</p>
        </div>
        <div className="flex-1 flex items-center px-4">
          <div className="h-0.5 w-full bg-white/20" />
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-1" />
          <p>90 Days</p>
          <p className="text-white font-medium">{forecast.withProducts.qualityScore90}</p>
        </div>
      </div>
    </div>
  )
}

function WithoutProductsProjection({
  forecast,
  skinAgeDegradation,
  qualityDegradation,
  onSwitchScenario,
}: {
  forecast: SkinForecast
  skinAgeDegradation: number
  qualityDegradation: number
  onSwitchScenario: () => void
}) {
  return (
    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚠️</span>
        <h3 className="text-lg font-medium">Without Treatment (90 Days)</h3>
      </div>

      <div className="bg-white/10 rounded-xl p-4 mb-4">
        <p className="text-white/90 text-sm leading-relaxed">
          {forecast.withoutProducts.message}
        </p>
      </div>

      <div className="grid gap-4">
        {/* Skin Age Degradation */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📉</span>
            <div>
              <p className="text-white/70 text-sm">Skin Age</p>
              <p className="text-xl font-medium">
                {forecast.currentSkinAge} → {forecast.withoutProducts.skinAge90}
                {skinAgeDegradation > 0 && (
                  <span className="text-red-200 ml-2 text-base">
                    (+{skinAgeDegradation} years)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-300 to-red-400 rounded-full"
              style={{ width: `${Math.min(100, (skinAgeDegradation / 10) * 100)}%` }}
            />
          </div>
        </div>

        {/* Quality Score Degradation */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💔</span>
            <div>
              <p className="text-white/70 text-sm">Skin Health</p>
              <p className="text-xl font-medium">
                {forecast.currentQualityScore} → {forecast.withoutProducts.qualityScore90}
                {qualityDegradation > 0 && (
                  <span className="text-red-200 ml-2 text-base">
                    (-{qualityDegradation} points)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-300 to-red-400 rounded-full"
              style={{ width: `${forecast.withoutProducts.qualityScore90}%` }}
            />
          </div>
        </div>

        {/* What will get worse */}
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-sm mb-3">Conditions That Will Worsen</p>
          <div className="space-y-2">
            {forecast.conditionProjections
              .filter(c => c.withoutProducts.projected90 > c.currentConfidence)
              .slice(0, 4)
              .map(condition => (
                <div key={condition.id} className="flex items-center justify-between">
                  <span className="text-sm">{condition.name}</span>
                  <span className="text-red-200 text-xs">
                    {condition.withoutProducts.message}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 flex justify-between text-xs text-white/60">
        <div className="text-center">
          <div className="w-3 h-3 bg-white/30 rounded-full mx-auto mb-1" />
          <p>Today</p>
          <p className="text-white font-medium">{forecast.currentQualityScore}</p>
        </div>
        <div className="flex-1 flex items-center px-4">
          <div className="h-0.5 w-full bg-white/20" />
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-red-300 rounded-full mx-auto mb-1" />
          <p>30 Days</p>
          <p className="text-white font-medium">{forecast.withoutProducts.qualityScore30}</p>
        </div>
        <div className="flex-1 flex items-center px-4">
          <div className="h-0.5 w-full bg-white/20" />
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-red-400 rounded-full mx-auto mb-1" />
          <p>60 Days</p>
          <p className="text-white font-medium">{forecast.withoutProducts.qualityScore60}</p>
        </div>
        <div className="flex-1 flex items-center px-4">
          <div className="h-0.5 w-full bg-white/20" />
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1" />
          <p>90 Days</p>
          <p className="text-white font-medium">{forecast.withoutProducts.qualityScore90}</p>
        </div>
      </div>

      {/* CTA to see with products */}
      <button
        onClick={onSwitchScenario}
        className="w-full mt-6 py-3 bg-white text-rose-600 rounded-xl font-medium hover:bg-white/90 transition-colors"
      >
        See How Ayonne Products Can Help →
      </button>
    </div>
  )
}

function ProductCard({
  product,
  isSelected,
  onToggle,
  condition,
}: {
  product: ProductForCondition
  isSelected: boolean
  onToggle: () => void
  condition?: ConditionProjection
}) {
  return (
    <div
      onClick={onToggle}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#1C4444] bg-[#1C4444]/5'
          : 'border-[#1C4444]/10 hover:border-[#1C4444]/30'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
          isSelected ? 'bg-[#1C4444] border-[#1C4444]' : 'border-[#1C4444]/30'
        }`}>
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#1C4444]">{product.name}</h4>
          {condition && (
            <p className="text-xs text-[#1C4444]/60 mt-0.5">
              Targets: {condition.name}
              {condition.withProducts.clearByDay && (
                <span className="text-green-600 ml-1">
                  • Clears by day {condition.withProducts.clearByDay}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="font-medium text-[#1C4444]">${product.price.toFixed(2)}</p>
          <p className="text-xs text-green-600">{Math.round(product.effectiveness * 100)}% effective</p>
        </div>
      </div>
    </div>
  )
}

function ConditionProjectionsView({
  projections,
  scenario,
}: {
  projections: ConditionProjection[]
  scenario: 'withProducts' | 'withoutProducts'
}) {
  const getImprovementColor = (rate: ConditionProjection['withProducts']['improvementRate']) => {
    switch (rate) {
      case 'fast': return 'text-green-600 bg-green-50'
      case 'moderate': return 'text-blue-600 bg-blue-50'
      case 'slow': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const getImprovementLabel = (rate: ConditionProjection['withProducts']['improvementRate']) => {
    switch (rate) {
      case 'fast': return '🚀 Fast improvement'
      case 'moderate': return '📈 Moderate improvement'
      case 'slow': return '🐢 Slow improvement'
      default: return '⏸️ Stagnant'
    }
  }

  return (
    <div className="space-y-4">
      {projections.map(condition => {
        const projectionData = scenario === 'withProducts'
          ? condition.withProducts
          : condition.withoutProducts

        const isGettingWorse = scenario === 'withoutProducts' ||
          (condition.withProducts.projected90 > condition.currentConfidence)

        return (
          <div key={condition.id} className="border border-[#1C4444]/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[#1C4444]">{condition.name}</h4>
              {scenario === 'withProducts' ? (
                <span className={`text-xs px-2 py-1 rounded-full ${getImprovementColor(condition.withProducts.improvementRate)}`}>
                  {getImprovementLabel(condition.withProducts.improvementRate)}
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600">
                  ⚠️ Will worsen
                </span>
              )}
            </div>

            {/* Confidence progression */}
            <div className="grid grid-cols-4 gap-2 text-center text-sm mb-3">
              <div>
                <p className="text-[#1C4444]/60 text-xs">Now</p>
                <p className="font-medium text-[#1C4444]">{Math.round(condition.currentConfidence * 100)}%</p>
              </div>
              <div>
                <p className="text-[#1C4444]/60 text-xs">30d</p>
                <p className={`font-medium ${isGettingWorse ? 'text-red-500' : 'text-[#1C4444]'}`}>
                  {Math.round(projectionData.projected30 * 100)}%
                </p>
              </div>
              <div>
                <p className="text-[#1C4444]/60 text-xs">60d</p>
                <p className={`font-medium ${isGettingWorse ? 'text-red-500' : 'text-[#1C4444]'}`}>
                  {Math.round(projectionData.projected60 * 100)}%
                </p>
              </div>
              <div>
                <p className="text-[#1C4444]/60 text-xs">90d</p>
                <p className={`font-medium ${isGettingWorse ? 'text-red-500' : 'text-green-600'}`}>
                  {Math.round(projectionData.projected90 * 100)}%
                </p>
              </div>
            </div>

            {/* Visual bar */}
            <div className="h-2 bg-[#F4EBE7] rounded-full overflow-hidden flex">
              <div
                className={`h-full ${isGettingWorse ? 'bg-red-400' : 'bg-[#1C4444]'}`}
                style={{ width: `${projectionData.projected90 * 100}%` }}
              />
              {!isGettingWorse && (
                <div
                  className="h-full bg-green-400"
                  style={{ width: `${(condition.currentConfidence - projectionData.projected90) * 100}%` }}
                />
              )}
            </div>

            {scenario === 'withProducts' && condition.withProducts.clearByDay !== null && (
              <p className="text-xs text-green-600 mt-2">
                ✨ Expected to clear by day {condition.withProducts.clearByDay}
              </p>
            )}

            {scenario === 'withoutProducts' && (
              <p className="text-xs text-red-500 mt-2">
                ⚠️ {condition.withoutProducts.message}
              </p>
            )}

            {/* Product recommendation */}
            {condition.recommendedProduct && scenario === 'withProducts' && (
              <div className="mt-3 pt-3 border-t border-[#1C4444]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💊</span>
                  <span className="text-sm text-[#1C4444]/70">
                    {condition.recommendedProduct.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const url = buildShopifyCartUrl([condition.recommendedProduct!.slug])
                    window.open(url, '_blank')
                  }}
                  className="px-3 py-1.5 bg-[#1C4444] text-white text-xs rounded-lg font-medium hover:bg-[#2d5a5a] transition-colors flex items-center gap-1"
                >
                  <span>Add to Cart</span>
                  <span>${condition.recommendedProduct.price.toFixed(2)}</span>
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
