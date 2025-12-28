'use client'

import { useState, useEffect } from 'react'
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
 * Applies CSS filters to simulate aging/de-aging effects on a face photo.
 *
 * For "younger" scenario (with products):
 * - Increases brightness and saturation
 * - Adds subtle glow effect
 * - Smooths appearance
 *
 * For "older" scenario (without products):
 * - Decreases saturation
 * - Adds subtle sepia tone
 * - Reduces contrast slightly
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

  const ageDiff = Math.abs(targetSkinAge - currentSkinAge)

  // Calculate filter intensity based on age difference (max 10 years = 100% effect)
  const intensity = Math.min(ageDiff / 10, 1)

  // Build the CSS filter string based on scenario
  const filterString = scenario === 'younger'
    ? `brightness(${1 + (0.08 * intensity)}) contrast(${1 + (0.05 * intensity)}) saturate(${1 + (0.15 * intensity)}) blur(${0.3 * intensity}px)`
    : `brightness(${1 - (0.05 * intensity)}) contrast(${1 - (0.08 * intensity)}) saturate(${1 - (0.20 * intensity)}) sepia(${0.15 * intensity})`

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
        {!isLoaded && (
          <div className="absolute inset-0 bg-[#F4EBE7] animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 border-3 border-[#1C4444]/20 border-t-[#1C4444] rounded-full animate-spin" />
          </div>
        )}

        {/* Filtered image */}
        <div
          className="relative aspect-square transition-all duration-500"
          style={{
            filter: showOriginal ? 'none' : filterString,
          }}
        >
          <Image
            src={imageUrl}
            alt={`Your skin ${scenario === 'younger' ? 'rejuvenated' : 'aged'}`}
            fill
            className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>

        {/* Glow overlay for younger effect */}
        {scenario === 'younger' && !showOriginal && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 30%, rgba(255, 255, 255, ${0.15 * intensity}), transparent 70%)`,
            }}
          />
        )}

        {/* Age badge */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
          scenario === 'younger'
            ? 'bg-green-500/90 text-white'
            : 'bg-amber-500/90 text-white'
        }`}>
          {scenario === 'younger' ? (
            <>Age {targetSkinAge} <span className="opacity-70">(-{ageDiff})</span></>
          ) : (
            <>Age {targetSkinAge} <span className="opacity-70">(+{ageDiff})</span></>
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
          {showOriginal ? 'Original' : 'Hold to compare'}
        </div>
      </div>

      {/* Age comparison indicator */}
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#1C4444]" />
          <span className="text-[#1C4444]/70">Now: {currentSkinAge}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${
          scenario === 'younger' ? 'text-green-600' : 'text-amber-600'
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
            {scenario === 'younger' ? `→ ${targetSkinAge}` : `→ ${targetSkinAge}`}
          </span>
        </div>
      </div>
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
