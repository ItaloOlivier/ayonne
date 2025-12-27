'use client'

import { useEffect, useState, useRef } from 'react'
import { SkinScores, getQualityColor, getSkinAgeColor, getQualityAccessibleLabel, getSkinAgeAccessibleLabel, getCategoryAccessibleLabel } from '@/lib/skin-analysis/scoring'

interface DualScoreDisplayProps {
  scores: SkinScores
  userAge?: number
  animate?: boolean
  compact?: boolean
}

export default function DualScoreDisplay({
  scores,
  userAge = 30,
  animate = true,
  compact = false,
}: DualScoreDisplayProps) {
  const [displaySkinAge, setDisplaySkinAge] = useState(animate ? userAge : scores.skinAge)
  const [displayQuality, setDisplayQuality] = useState(animate ? 0 : scores.qualityScore)
  const [showAchievable, setShowAchievable] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection observer for viewport-based animation
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Animate skin age counting - only when in view
  useEffect(() => {
    if (!animate || !isInView) {
      if (!animate) setDisplaySkinAge(scores.skinAge)
      return
    }

    const duration = 2000 // Slower, more elegant
    const steps = 40
    const increment = (scores.skinAge - userAge) / steps
    let current = userAge

    const interval = setInterval(() => {
      current += increment
      if (current >= scores.skinAge) {
        setDisplaySkinAge(scores.skinAge)
        clearInterval(interval)
        // Show achievable after a delay
        setTimeout(() => setShowAchievable(true), 800)
      } else {
        setDisplaySkinAge(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [scores.skinAge, userAge, animate, isInView])

  // Animate quality score counting - only when in view
  useEffect(() => {
    if (!animate || !isInView) {
      if (!animate) setDisplayQuality(scores.qualityScore)
      return
    }

    const duration = 2000 // Slower, more elegant
    const steps = 60
    const increment = scores.qualityScore / steps
    let current = 0

    const interval = setInterval(() => {
      current += increment
      if (current >= scores.qualityScore) {
        setDisplayQuality(scores.qualityScore)
        clearInterval(interval)
      } else {
        setDisplayQuality(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [scores.qualityScore, animate, isInView])

  const skinAgeColor = getSkinAgeColor(scores.skinAge, userAge)
  const qualityColor = getQualityColor(scores.qualityScore)
  const improvement = scores.skinAge - scores.achievableSkinAge

  if (compact) {
    return (
      <div className="flex gap-6" role="region" aria-label="Skin analysis scores">
        {/* Compact Skin Vitality */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md"
            style={{ backgroundColor: skinAgeColor }}
            role="img"
            aria-label={getSkinAgeAccessibleLabel(scores.skinAge, userAge)}
          >
            {displaySkinAge}
          </div>
          <div className="text-xs">
            <div className="text-[#1C4444]/50 font-light tracking-wide">Vitality</div>
            {showAchievable && improvement > 0 && (
              <div className="text-[#1C4444] font-medium" aria-label={`Potential vitality: ${scores.achievableSkinAge} years`}>→ {scores.achievableSkinAge}</div>
            )}
          </div>
        </div>

        {/* Compact Quality */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md"
            style={{ backgroundColor: qualityColor }}
            role="img"
            aria-label={getQualityAccessibleLabel(scores.qualityScore)}
          >
            {displayQuality}
          </div>
          <div className="text-xs">
            <div className="text-[#1C4444]/50 font-light tracking-wide">Health</div>
            <div className="text-[#1C4444] font-medium">{scores.qualityLabel}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="grid md:grid-cols-2 gap-8" role="region" aria-label="Skin analysis results">
      {/* Skin Vitality Card - Hero Focus */}
      <div className="bg-white rounded-2xl p-8 border border-[#1C4444]/8 shadow-sm" role="group" aria-labelledby="vitality-heading">
        <div className="text-center mb-6">
          <h3 id="vitality-heading" className="text-xs font-medium text-[#1C4444]/40 uppercase tracking-[0.2em] mb-1">
            Skin Vitality
          </h3>
          <p className="text-[#1C4444]/60 text-sm font-light">
            Your skin&apos;s biological expression
          </p>
        </div>

        {/* Main Vitality Display */}
        <div className="flex items-center justify-center gap-8 mb-6">
          {/* Current Vitality Age */}
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-light mx-auto mb-3 shadow-lg transition-all duration-700"
              style={{ backgroundColor: skinAgeColor }}
              role="img"
              aria-label={getSkinAgeAccessibleLabel(scores.skinAge, userAge)}
            >
              {displaySkinAge}
            </div>
            <p className="text-xs text-[#1C4444]/50 font-light tracking-wide">Current</p>
          </div>

          {/* Improvement Arrow - Elegant transition */}
          {showAchievable && improvement > 0 && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-12 h-[1px] bg-gradient-to-r from-[#1C4444]/20 via-[#1C4444]/40 to-[#1C4444]/20 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-[#1C4444]/40 border-y-[4px] border-y-transparent" />
              </div>
              <span className="text-xs text-[#1C4444] font-medium mt-2 tracking-wide">
                {improvement} years
              </span>
            </div>
          )}

          {/* Achievable Vitality Age */}
          {showAchievable && improvement > 0 && (
            <div className="text-center animate-fade-in">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-light mx-auto mb-3 shadow-lg ring-2 ring-offset-4 ring-[#1C4444]/20"
                style={{ backgroundColor: '#1C4444' }}
              >
                {scores.achievableSkinAge}
              </div>
              <p className="text-xs text-[#1C4444] font-medium tracking-wide">Potential</p>
            </div>
          )}
        </div>

        {/* Subtle Factors */}
        {scores.agingFactors.length > 0 && (
          <div className="pt-6 border-t border-[#1C4444]/5">
            <p className="text-[10px] text-[#1C4444]/40 uppercase tracking-[0.15em] mb-3">
              Areas of focus
            </p>
            <div className="flex flex-wrap gap-2">
              {scores.agingFactors.map((factor, i) => (
                <span
                  key={i}
                  className="text-xs bg-[#F4EBE7]/60 text-[#1C4444]/60 px-3 py-1.5 rounded-full font-light"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skin Health Card */}
      <div className="bg-white rounded-2xl p-8 border border-[#1C4444]/8 shadow-sm" role="group" aria-labelledby="health-heading">
        <div className="text-center mb-6">
          <h3 id="health-heading" className="text-xs font-medium text-[#1C4444]/40 uppercase tracking-[0.2em] mb-1">
            Skin Health
          </h3>
          <p className="text-[#1C4444]/60 text-sm font-light">
            Overall condition & balance
          </p>
        </div>

        {/* Elegant Circular Score */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32" role="img" aria-label={getQualityAccessibleLabel(scores.qualityScore)}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              {/* Background circle - more subtle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#F4EBE7"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={qualityColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={(1 - displayQuality / 100) * 2 * Math.PI * 42}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-light text-[#1C4444]">{displayQuality}</span>
              <span className="text-xs font-medium text-[#1C4444]/60 mt-1">
                {scores.qualityLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown - Refined */}
        <div className="space-y-3" role="list" aria-label="Category breakdown">
          {Object.entries(scores.categories).map(([category, score]) => (
            <div key={category} className="flex items-center gap-4" role="listitem" aria-label={getCategoryAccessibleLabel(category, score)}>
              <span className="text-xs text-[#1C4444]/50 w-20 capitalize font-light tracking-wide">
                {category}
              </span>
              <div className="flex-1 h-1.5 bg-[#F4EBE7] rounded-full overflow-hidden" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${score}%`,
                    backgroundColor: qualityColor,
                    opacity: 0.8 + (score / 500), // Subtle variation
                  }}
                />
              </div>
              <span className="text-xs text-[#1C4444]/60 w-8 text-right font-light">{score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
