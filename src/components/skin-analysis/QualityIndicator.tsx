'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { quickQualityCheck, getQualityTier } from '@/lib/skin-analysis/image-quality'

interface QualityIndicatorProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
  onQualityChange?: (score: number, isAcceptable: boolean) => void
}

/**
 * Real-time Quality Indicator
 *
 * Displays live feedback on image quality during camera capture:
 * - Brightness level indicator
 * - Quality score badge
 * - Warning messages for issues
 */
export default function QualityIndicator({
  videoRef,
  isActive,
  onQualityChange,
}: QualityIndicatorProps) {
  const [quality, setQuality] = useState<{
    score: number
    isAcceptable: boolean
    mainIssue: string | null
  }>({ score: 0, isAcceptable: false, mainIssue: null })
  const [isChecking, setIsChecking] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  const checkQuality = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(checkQuality)
      return
    }

    // Sample at lower resolution for performance
    const sampleWidth = 320
    const sampleHeight = 320
    canvas.width = sampleWidth
    canvas.height = sampleHeight

    ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight)
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)

    const result = quickQualityCheck(imageData.data, sampleWidth, sampleHeight)

    setQuality(result)
    onQualityChange?.(result.score, result.isAcceptable)

    // Check every 500ms for performance
    setTimeout(() => {
      if (isActive) {
        animationRef.current = requestAnimationFrame(checkQuality)
      }
    }, 500)
  }, [videoRef, isActive, onQualityChange])

  useEffect(() => {
    if (isActive) {
      setIsChecking(true)
      animationRef.current = requestAnimationFrame(checkQuality)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setIsChecking(false)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, checkQuality])

  const tier = getQualityTier(quality.score)

  if (!isActive || !isChecking) return null

  return (
    <>
      {/* Hidden canvas for image analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Quality Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300"
          style={{
            backgroundColor: `${tier.color}20`,
            borderColor: tier.color,
            borderWidth: 1,
          }}
        >
          {/* Quality indicator dot */}
          <div
            className={`w-2 h-2 rounded-full ${
              quality.score >= 70 ? 'animate-pulse' : ''
            }`}
            style={{ backgroundColor: tier.color }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: tier.color }}
          >
            {tier.tier}
          </span>
        </div>
      </div>

      {/* Brightness meter */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-16 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden">
            <div
              className="w-full transition-all duration-300 rounded-full"
              style={{
                height: `${Math.min(100, quality.score)}%`,
                backgroundColor: tier.color,
                marginTop: 'auto',
              }}
            />
          </div>
          <svg
            className="w-4 h-4"
            style={{ color: tier.color }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
      </div>

      {/* Warning message for quality issues */}
      {quality.mainIssue && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white animate-elegant-fade-in">
            <svg
              className="w-4 h-4 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm">{quality.mainIssue}</span>
          </div>
        </div>
      )}

      {/* Good quality confirmation */}
      {quality.score >= 85 && !quality.mainIssue && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1C4444]/90 backdrop-blur-sm rounded-lg text-white animate-elegant-fade-in">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm">Perfect lighting</span>
          </div>
        </div>
      )}
    </>
  )
}
