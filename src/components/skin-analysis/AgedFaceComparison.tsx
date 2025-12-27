'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AgedFaceComparisonProps {
  originalImage: string
  agedImage: string | null
}

export default function AgedFaceComparison({ originalImage, agedImage }: AgedFaceComparisonProps) {
  const [showAged, setShowAged] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  if (!agedImage) {
    return (
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-medium text-[#1C4444] mb-4">Your Photo</h3>
        <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden">
          <img
            src={originalImage}
            alt="Your photo"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-center text-[#1C4444]/60 text-sm mt-4">
          Aging simulation is currently unavailable
        </p>
      </div>
    )
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.min(Math.max(percentage, 0), 100))
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.min(Math.max(percentage, 0), 100))
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-medium text-[#1C4444] mb-2">See Your Future Self</h3>
      <p className="text-[#1C4444]/60 text-sm mb-4">
        This is what your skin could look like in 20 years without proper care
      </p>

      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowAged(false)}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
            !showAged
              ? 'bg-[#1C4444] text-white'
              : 'bg-[#1C4444]/10 text-[#1C4444] hover:bg-[#1C4444]/20'
          )}
        >
          Now
        </button>
        <button
          onClick={() => setShowAged(true)}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
            showAged
              ? 'bg-[#1C4444] text-white'
              : 'bg-[#1C4444]/10 text-[#1C4444] hover:bg-[#1C4444]/20'
          )}
        >
          +20 Years
        </button>
      </div>

      {/* Image comparison slider */}
      <div
        className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden cursor-col-resize select-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
      >
        {/* Current image (bottom layer) */}
        <img
          src={originalImage}
          alt="Current"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Aged image (top layer, clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${showAged ? 100 : sliderPosition}%` }}
        >
          <img
            src={agedImage}
            alt="Aged prediction"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${100 / (showAged ? 1 : sliderPosition / 100)}%` }}
          />
        </div>

        {/* Slider handle (only show in slider mode) */}
        {!showAged && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>
        )}

        {/* Labels */}
        {!showAged && (
          <>
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              Now
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              +20 Years
            </div>
          </>
        )}
      </div>

      <p className="text-center text-[#1C4444]/50 text-xs mt-4">
        Drag the slider to compare or toggle between views
      </p>

      {/* Call to action */}
      <div className="mt-6 p-4 bg-[#F4EBE7] rounded-lg text-center">
        <p className="text-[#1C4444] font-medium mb-1">
          The good news? It doesn&apos;t have to be this way.
        </p>
        <p className="text-[#1C4444]/60 text-sm">
          With proper skincare, you can significantly slow visible aging. See our recommendations below.
        </p>
      </div>
    </div>
  )
}
