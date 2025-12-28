'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface FaceAgeFilterProps {
  imageUrl: string
  currentSkinAge: number
  targetSkinAge: number
  scenario: 'younger' | 'older'
  label?: string
}

/**
 * FaceAgeFilter Component
 *
 * Uses AI-powered age transformation via Replicate SAM model.
 * Falls back to CSS filters if AI service is unavailable.
 */
export default function FaceAgeFilter({
  imageUrl,
  currentSkinAge,
  targetSkinAge,
  scenario,
  label,
}: FaceAgeFilterProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [transformedImageUrl, setTransformedImageUrl] = useState<string | null>(null)
  const [isTransforming, setIsTransforming] = useState(false)
  const [useFallback, setUseFallback] = useState(false)

  const ageDiff = Math.abs(targetSkinAge - currentSkinAge)

  // Calculate CSS filter intensity based on age difference (fallback)
  const intensity = Math.min(ageDiff / 10, 1)

  // CSS filter effects for younger look
  const youngerFilter = `
    brightness(${1 + (0.12 * intensity)})
    contrast(${1 + (0.08 * intensity)})
    saturate(${1 + (0.20 * intensity)})
    blur(${0.4 * intensity}px)
  `.replace(/\s+/g, ' ').trim()

  // CSS filter effects for older look
  const olderFilter = `
    brightness(${1 - (0.08 * intensity)})
    contrast(${1 - (0.12 * intensity)})
    saturate(${1 - (0.25 * intensity)})
    sepia(${0.20 * intensity})
  `.replace(/\s+/g, ' ').trim()

  const filterString = scenario === 'younger' ? youngerFilter : olderFilter

  // Fetch AI-transformed image
  const fetchTransformedImage = useCallback(async () => {
    if (transformedImageUrl || isTransforming || useFallback) return

    setIsTransforming(true)

    try {
      const response = await fetch('/api/face-aging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          targetAge: targetSkinAge,
        }),
      })

      const data = await response.json()

      if (data.success && data.transformedImage) {
        setTransformedImageUrl(data.transformedImage)
      } else if (data.fallback) {
        // Service unavailable, use CSS fallback
        setUseFallback(true)
      } else {
        setUseFallback(true)
      }
    } catch (error) {
      console.error('Face aging error:', error)
      setUseFallback(true)
    } finally {
      setIsTransforming(false)
    }
  }, [imageUrl, targetSkinAge, transformedImageUrl, isTransforming, useFallback])

  // Trigger AI transformation on mount
  useEffect(() => {
    fetchTransformedImage()
  }, [fetchTransformedImage])

  // Reset state when target age changes (scenario switch)
  useEffect(() => {
    setTransformedImageUrl(null)
    setUseFallback(false)
    setIsTransforming(false)
  }, [targetSkinAge])

  // Determine which image to show
  const displayImageUrl = showOriginal
    ? imageUrl
    : (transformedImageUrl || imageUrl)

  // Should we apply CSS filter? Only if showing transformed view and no AI image available
  const shouldApplyFilter = !showOriginal && !transformedImageUrl && !isTransforming

  return (
    <div className="relative group">
      {/* Image container */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C4444]/5 to-[#1C4444]/10"
        onMouseEnter={() => setShowOriginal(true)}
        onMouseLeave={() => setShowOriginal(false)}
        onTouchStart={() => setShowOriginal(true)}
        onTouchEnd={() => setShowOriginal(false)}
      >
        {/* Loading skeleton */}
        {(!isLoaded || isTransforming) && (
          <div className="absolute inset-0 bg-[#F4EBE7] animate-pulse flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-3 border-[#1C4444]/20 border-t-[#1C4444] rounded-full animate-spin" />
            {isTransforming && (
              <p className="text-xs text-[#1C4444]/60 mt-3">Creating preview...</p>
            )}
          </div>
        )}

        {/* Image with optional filter effect */}
        <div
          className="relative aspect-square transition-all duration-500"
          style={{
            filter: shouldApplyFilter ? filterString : 'none',
          }}
        >
          <Image
            src={displayImageUrl}
            alt={`Your skin ${scenario === 'younger' ? 'with proper skincare' : 'without skincare'}`}
            fill
            className={`object-cover transition-opacity duration-300 ${isLoaded && !isTransforming ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized={displayImageUrl.startsWith('data:') || displayImageUrl.includes('replicate')}
          />
        </div>

        {/* Glow overlay for younger effect (only with CSS fallback) */}
        {scenario === 'younger' && !showOriginal && !transformedImageUrl && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 30%, rgba(255, 255, 255, ${0.18 * intensity}), transparent 70%)`,
            }}
          />
        )}

        {/* Shadow overlay for older effect (only with CSS fallback) */}
        {scenario === 'older' && !showOriginal && !transformedImageUrl && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 70%, rgba(139, 90, 43, ${0.08 * intensity}), transparent 80%)`,
            }}
          />
        )}

        {/* Age badge */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
          scenario === 'younger'
            ? 'bg-[#D4AF37]/90 text-white'
            : 'bg-amber-600/90 text-white'
        }`}>
          {scenario === 'younger' ? (
            <>Skin Age {targetSkinAge} <span className="opacity-70">(-{ageDiff} yrs)</span></>
          ) : (
            <>Skin Age {targetSkinAge} <span className="opacity-70">(+{ageDiff} yrs)</span></>
          )}
        </div>

        {/* Label */}
        {label && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className={`px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm ${
              scenario === 'younger'
                ? 'bg-[#1C4444]/80 text-white'
                : 'bg-amber-900/80 text-white'
            }`}>
              {label}
            </div>
          </div>
        )}

        {/* "Hold to see original" hint */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs bg-black/50 text-white/80 backdrop-blur-sm transition-opacity duration-300 ${
          showOriginal ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {showOriginal ? 'Current' : 'Hold to compare'}
        </div>
      </div>

      {/* Age comparison indicator */}
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#1C4444]" />
          <span className="text-[#1C4444]/70">Now: {currentSkinAge}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${
          scenario === 'younger' ? 'text-[#9A8428]' : 'text-amber-600'
        }`}>
          {scenario === 'younger' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          <span className="font-medium">
            → {targetSkinAge}
          </span>
        </div>
      </div>

      {/* Preview disclaimer */}
      <p className="text-xs text-[#1C4444]/40 text-center mt-2">
        {transformedImageUrl ? 'AI-generated preview' : 'Visual preview for illustration'}
      </p>
    </div>
  )
}

/**
 * Side-by-side comparison component
 */
interface FaceComparisonProps {
  imageUrl: string
  currentSkinAge: number
  withProductsAge: number
  withoutProductsAge: number
}

export function FaceComparison({
  imageUrl,
  currentSkinAge,
  withProductsAge,
  withoutProductsAge,
}: FaceComparisonProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <FaceAgeFilter
          imageUrl={imageUrl}
          currentSkinAge={currentSkinAge}
          targetSkinAge={withProductsAge}
          scenario="younger"
          label="With Ayonne Products"
        />
      </div>
      <div>
        <FaceAgeFilter
          imageUrl={imageUrl}
          currentSkinAge={currentSkinAge}
          targetSkinAge={withoutProductsAge}
          scenario="older"
          label="Without Products"
        />
      </div>
    </div>
  )
}
