'use client'

import { useEffect, useState } from 'react'
import { SkinScores, getQualityColor, getSkinAgeColor } from '@/lib/skin-analysis/scoring'

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

  // Animate skin age counting
  useEffect(() => {
    if (!animate) {
      setDisplaySkinAge(scores.skinAge)
      return
    }

    const duration = 1500
    const steps = 40
    const increment = (scores.skinAge - userAge) / steps
    let current = userAge

    const interval = setInterval(() => {
      current += increment
      if (current >= scores.skinAge) {
        setDisplaySkinAge(scores.skinAge)
        clearInterval(interval)
        // Show achievable after a delay
        setTimeout(() => setShowAchievable(true), 500)
      } else {
        setDisplaySkinAge(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [scores.skinAge, userAge, animate])

  // Animate quality score counting
  useEffect(() => {
    if (!animate) {
      setDisplayQuality(scores.qualityScore)
      return
    }

    const duration = 1500
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
  }, [scores.qualityScore, animate])

  const skinAgeColor = getSkinAgeColor(scores.skinAge, userAge)
  const qualityColor = getQualityColor(scores.qualityScore)
  const improvement = scores.skinAge - scores.achievableSkinAge

  if (compact) {
    return (
      <div className="flex gap-4">
        {/* Compact Skin Age */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: skinAgeColor }}>
            {displaySkinAge}
          </div>
          <div className="text-xs">
            <div className="text-[#1C4444]/60">Skin Age</div>
            {showAchievable && improvement > 0 && (
              <div className="text-green-600 font-medium">→ {scores.achievableSkinAge}</div>
            )}
          </div>
        </div>

        {/* Compact Quality */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: qualityColor }}>
            {displayQuality}
          </div>
          <div className="text-xs">
            <div className="text-[#1C4444]/60">Quality</div>
            <div style={{ color: qualityColor }} className="font-medium">{scores.qualityLabel}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Skin Age Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#1C4444]/10">
        <h3 className="text-sm font-medium text-[#1C4444]/60 mb-4 text-center">
          Skin Age Analysis
        </h3>

        <div className="flex items-center justify-center gap-6">
          {/* Current Skin Age */}
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2 transition-all duration-500"
              style={{ backgroundColor: skinAgeColor }}
            >
              {displaySkinAge}
            </div>
            <p className="text-xs text-[#1C4444]/60">Current</p>
          </div>

          {/* Arrow with improvement */}
          {showAchievable && improvement > 0 && (
            <div className="flex flex-col items-center animate-fade-in">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="text-xs text-green-600 font-medium mt-1">-{improvement} yrs</span>
            </div>
          )}

          {/* Achievable Skin Age */}
          {showAchievable && improvement > 0 && (
            <div className="text-center animate-fade-in">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2 border-4 border-dashed border-green-300"
                style={{ backgroundColor: '#22c55e' }}
              >
                {scores.achievableSkinAge}
              </div>
              <p className="text-xs text-green-600 font-medium">Achievable</p>
            </div>
          )}
        </div>

        {/* Aging Factors */}
        {scores.agingFactors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1C4444]/5">
            <p className="text-xs text-[#1C4444]/50 mb-2">Contributing factors:</p>
            <div className="flex flex-wrap gap-1.5">
              {scores.agingFactors.map((factor, i) => (
                <span key={i} className="text-xs bg-[#F4EBE7] text-[#1C4444]/70 px-2 py-1 rounded">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skin Quality Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#1C4444]/10">
        <h3 className="text-sm font-medium text-[#1C4444]/60 mb-4 text-center">
          Skin Quality Score
        </h3>

        {/* Circular Score */}
        <div className="flex justify-center mb-4">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={qualityColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={(1 - displayQuality / 100) * 2 * Math.PI * 42}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[#1C4444]">{displayQuality}</span>
              <span className="text-xs font-medium" style={{ color: qualityColor }}>
                {scores.qualityLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          {Object.entries(scores.categories).map(([category, score]) => (
            <div key={category} className="flex items-center gap-3">
              <span className="text-xs text-[#1C4444]/60 w-20 capitalize">{category}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${score}%`,
                    backgroundColor: getQualityColor(score),
                  }}
                />
              </div>
              <span className="text-xs text-[#1C4444]/70 w-8 text-right">{score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Animation keyframes in globals.css
// @keyframes fade-in {
//   from { opacity: 0; transform: translateX(-10px); }
//   to { opacity: 1; transform: translateX(0); }
// }
// .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
