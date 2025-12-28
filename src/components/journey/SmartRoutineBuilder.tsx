'use client'

import { useState, useEffect } from 'react'
import { buildShopifyCartUrl } from '@/lib/shopify-products'

interface Product {
  slug: string
  name: string
  price: number
  imageUrl: string
  matchScore: number
  targetConcern: string
  step: 'cleanser' | 'toner' | 'serum' | 'treatment' | 'moisturizer' | 'sunscreen'
}

interface SmartRoutineBuilderProps {
  recommendations: Product[]
  skinConcerns: string[]
  skinType: string
  discountCode?: string
  discountPercent?: number
  onCheckout?: () => void
}

const ROUTINE_STEPS = [
  { id: 'cleanser', name: 'Cleanse', icon: '🧼', order: 1 },
  { id: 'toner', name: 'Tone', icon: '💧', order: 2 },
  { id: 'serum', name: 'Treat', icon: '✨', order: 3 },
  { id: 'treatment', name: 'Target', icon: '🎯', order: 4 },
  { id: 'moisturizer', name: 'Hydrate', icon: '🧴', order: 5 },
  { id: 'sunscreen', name: 'Protect', icon: '☀️', order: 6 },
]

export default function SmartRoutineBuilder({
  recommendations,
  skinConcerns,
  skinType,
  discountCode,
  discountPercent,
  onCheckout,
}: SmartRoutineBuilderProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState(0)
  const [isBuilding, setIsBuilding] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  // Group products by routine step
  const productsByStep = ROUTINE_STEPS.map(step => ({
    ...step,
    products: recommendations.filter(p => p.step === step.id),
  }))

  // Auto-select top product from each step on mount
  useEffect(() => {
    const autoSelected = productsByStep
      .filter(step => step.products.length > 0)
      .map(step => step.products[0].slug)
    setSelectedProducts(autoSelected)
  }, [])

  const selectedProductData = recommendations.filter(p =>
    selectedProducts.includes(p.slug)
  )

  const subtotal = selectedProductData.reduce((sum, p) => sum + p.price, 0)
  const discount = discountPercent ? subtotal * (discountPercent / 100) : 0
  const total = subtotal - discount

  const handleToggleProduct = (slug: string, step: string) => {
    setSelectedProducts(prev => {
      // Remove any other product from the same step
      const otherProducts = prev.filter(s => {
        const product = recommendations.find(p => p.slug === s)
        return product?.step !== step
      })
      // Toggle this product
      if (prev.includes(slug)) {
        return otherProducts
      }
      return [...otherProducts, slug]
    })
  }

  const handleBuildComplete = () => {
    setIsBuilding(false)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleCheckout = () => {
    onCheckout?.()
    const url = buildShopifyCartUrl(selectedProducts, discountCode)
    window.open(url, '_blank')
  }

  // Free shipping threshold
  const freeShippingThreshold = 50
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - total)
  const hasFreeShipping = total >= freeShippingThreshold

  return (
    <div className="bg-white rounded-3xl shadow-luxury-lg overflow-hidden">
      {/* Confetti overlay */}
      {showConfetti && <ConfettiOverlay />}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1C4444] to-[#2a5858] px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#D4AF37] text-xs tracking-widest uppercase font-medium">
              Your Personalized Routine
            </p>
            <h2 className="text-white text-xl font-light mt-1">
              Built for {skinType} skin
            </h2>
          </div>
          {discountCode && (
            <div className="px-3 py-1.5 bg-[#D4AF37] text-[#1C4444] rounded-full text-sm font-bold">
              {discountPercent}% OFF
            </div>
          )}
        </div>

        {/* Skin concerns tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {skinConcerns.slice(0, 4).map(concern => (
            <span
              key={concern}
              className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full"
            >
              {concern}
            </span>
          ))}
        </div>
      </div>

      {/* Routine Steps */}
      <div className="p-6">
        {isBuilding ? (
          <RoutineSteps
            steps={productsByStep}
            selectedProducts={selectedProducts}
            activeStep={activeStep}
            onToggleProduct={handleToggleProduct}
            onNextStep={() => setActiveStep(prev => Math.min(prev + 1, productsByStep.length - 1))}
            onPrevStep={() => setActiveStep(prev => Math.max(prev - 1, 0))}
            onComplete={handleBuildComplete}
          />
        ) : (
          <RoutineSummary
            selectedProducts={selectedProductData}
            onEdit={() => setIsBuilding(true)}
          />
        )}
      </div>

      {/* Sticky checkout footer */}
      <div className="border-t border-[#1C4444]/10 bg-[#F4EBE7] p-6">
        {/* Free shipping progress */}
        {!hasFreeShipping && !discountCode && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#1C4444]/60">
                Add ${amountToFreeShipping.toFixed(2)} for free shipping
              </span>
              <span className="text-[#1C4444] font-medium">
                ${total.toFixed(2)} / ${freeShippingThreshold}
              </span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1C4444] to-[#D4AF37] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (total / freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {hasFreeShipping && (
          <div className="mb-4 flex items-center gap-2 text-emerald-600 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Free shipping unlocked!</span>
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#1C4444]/60">
              {selectedProducts.length} products
            </span>
            <span className="text-[#1C4444]">${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">Discount ({discountPercent}%)</span>
              <span className="text-emerald-600">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-medium pt-2 border-t border-[#1C4444]/10">
            <span className="text-[#1C4444]">Total</span>
            <span className="text-[#1C4444]">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={selectedProducts.length === 0}
          className="w-full py-4 bg-[#1C4444] text-white rounded-xl font-medium hover:bg-[#2d5a5a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          <span>Complete My Routine</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#1C4444]/50">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure
          </span>
          <span>•</span>
          <span>30-day returns</span>
          <span>•</span>
          <span>Cruelty-free</span>
        </div>
      </div>
    </div>
  )
}

// Routine building steps
function RoutineSteps({
  steps,
  selectedProducts,
  activeStep,
  onToggleProduct,
  onNextStep,
  onPrevStep,
  onComplete,
}: {
  steps: Array<{ id: string; name: string; icon: string; order: number; products: Product[] }>
  selectedProducts: string[]
  activeStep: number
  onToggleProduct: (slug: string, step: string) => void
  onNextStep: () => void
  onPrevStep: () => void
  onComplete: () => void
}) {
  const currentStep = steps[activeStep]
  const isLastStep = activeStep === steps.length - 1
  const selectedInStep = selectedProducts.find(slug =>
    currentStep?.products.some(p => p.slug === slug)
  )

  // Skip steps with no products
  useEffect(() => {
    if (currentStep?.products.length === 0) {
      if (!isLastStep) {
        onNextStep()
      } else {
        onPrevStep()
      }
    }
  }, [activeStep, currentStep, isLastStep, onNextStep, onPrevStep])

  if (!currentStep || currentStep.products.length === 0) {
    return null
  }

  return (
    <div>
      {/* Step progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-all ${
                i < activeStep
                  ? 'bg-[#D4AF37]'
                  : i === activeStep
                    ? 'bg-[#1C4444] w-4'
                    : 'bg-[#1C4444]/20'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-[#1C4444]/60">
          Step {activeStep + 1} of {steps.length}
        </span>
      </div>

      {/* Current step */}
      <div className="text-center mb-6">
        <span className="text-4xl mb-2 block">{currentStep.icon}</span>
        <h3 className="text-xl text-[#1C4444] font-light">
          {currentStep.name}
        </h3>
        <p className="text-sm text-[#1C4444]/60 mt-1">
          Select your {currentStep.name.toLowerCase()} product
        </p>
      </div>

      {/* Products */}
      <div className="space-y-3 mb-6">
        {currentStep.products.map((product, i) => {
          const isSelected = selectedProducts.includes(product.slug)
          return (
            <button
              key={product.slug}
              onClick={() => onToggleProduct(product.slug, currentStep.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-[#1C4444] bg-[#1C4444]/5'
                  : 'border-[#1C4444]/10 hover:border-[#1C4444]/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-[#F4EBE7] overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {currentStep.icon}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[#1C4444] font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-[#1C4444]/60 mt-0.5">
                        For {product.targetConcern}
                      </p>
                    </div>
                    <p className="text-[#1C4444] font-medium flex-shrink-0">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-[#1C4444]/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1C4444] to-[#D4AF37] rounded-full"
                        style={{ width: `${product.matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#D4AF37] font-medium">
                      {product.matchScore}% match
                    </span>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#1C4444] bg-[#1C4444]'
                      : 'border-[#1C4444]/30'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              {i === 0 && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-xs rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Best match for you
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {activeStep > 0 && (
          <button
            onClick={onPrevStep}
            className="flex-1 py-3 border border-[#1C4444]/20 text-[#1C4444] rounded-xl hover:bg-[#1C4444]/5 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={isLastStep ? onComplete : onNextStep}
          className="flex-1 py-3 bg-[#1C4444] text-white rounded-xl hover:bg-[#2d5a5a] transition-colors flex items-center justify-center gap-2"
        >
          <span>{isLastStep ? 'See My Routine' : 'Next Step'}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Skip link */}
      {!isLastStep && (
        <button
          onClick={onComplete}
          className="w-full mt-3 text-sm text-[#1C4444]/50 hover:text-[#1C4444] transition-colors"
        >
          Skip to checkout →
        </button>
      )}
    </div>
  )
}

// Routine summary view
function RoutineSummary({
  selectedProducts,
  onEdit,
}: {
  selectedProducts: Product[]
  onEdit: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#1C4444] font-medium">Your Routine</h3>
        <button
          onClick={onEdit}
          className="text-sm text-[#D4AF37] hover:underline"
        >
          Edit
        </button>
      </div>

      <div className="space-y-3">
        {selectedProducts
          .sort((a, b) => {
            const stepOrder = { cleanser: 1, toner: 2, serum: 3, treatment: 4, moisturizer: 5, sunscreen: 6 }
            return (stepOrder[a.step] || 99) - (stepOrder[b.step] || 99)
          })
          .map((product, i) => {
            const stepData = ROUTINE_STEPS.find(s => s.id === product.step)
            return (
              <div
                key={product.slug}
                className="flex items-center gap-3 p-3 bg-[#F4EBE7] rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-lg bg-white overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {stepData?.icon}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1C4444] font-medium text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-[#1C4444]/60">
                    {stepData?.name}
                  </p>
                </div>
                <p className="text-[#1C4444] font-medium text-sm">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// Confetti animation
function ConfettiOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#D4AF37', '#1C4444', '#F4EBE7', '#2d6a6a'][i % 4],
            animationDelay: `${Math.random() * 0.5}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  )
}
