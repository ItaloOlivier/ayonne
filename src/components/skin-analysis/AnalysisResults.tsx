'use client'

import { SKIN_TYPES, SKIN_CONDITIONS, SkinType, SkinConditionType } from '@/lib/skin-analysis/conditions'
import { calculateSkinScores, SkinScores } from '@/lib/skin-analysis/scoring'
import DualScoreDisplay from './DualScoreDisplay'
import { useMemo } from 'react'

interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

interface AnalysisResultsProps {
  skinType: SkinType | null
  conditions: DetectedCondition[]
  userAge?: number
}

export default function AnalysisResults({ skinType, conditions, userAge = 30 }: AnalysisResultsProps) {
  const skinTypeInfo = skinType ? SKIN_TYPES[skinType] : null

  // Calculate dual scores
  const scores: SkinScores = useMemo(
    () => calculateSkinScores(conditions, userAge),
    [conditions, userAge]
  )

  const improvement = scores.skinAge - scores.achievableSkinAge

  return (
    <div className="space-y-8">
      {/* Dual Score Display */}
      <DualScoreDisplay scores={scores} userAge={userAge} animate={true} />

      {/* Improvement Callout */}
      {improvement > 0 && (
        <div className="bg-gradient-to-r from-[#D4AF37]/5 via-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-6 animate-elegant-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-white flex items-center justify-center flex-shrink-0 shadow-luxury">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-[#1C4444] text-lg tracking-wide">
                Your skin could look up to {improvement} years younger
              </h4>
              <p className="text-sm text-[#1C4444]/60 mt-2 leading-relaxed">
                With a consistent anti-aging routine using the right products, you can achieve visible improvements in fine lines, texture, and radiance.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card-luxury p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Your Results</p>
        <h3 className="text-xl font-medium text-[#1C4444] mb-8 tracking-wide">Detailed Analysis</h3>

        {/* Skin Type */}
        {skinTypeInfo && (
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white flex items-center justify-center shadow-luxury">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-[#1C4444]/50 text-xs uppercase tracking-widest">Your Skin Type</p>
              <p className="text-[#1C4444] font-medium text-xl tracking-wide">{skinTypeInfo.name}</p>
            </div>
          </div>
          <p className="text-[#1C4444]/60 text-sm pl-16 leading-relaxed">
            {skinTypeInfo.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4 pl-16">
            {skinTypeInfo.characteristics.map((char, idx) => (
              <span
                key={idx}
                className="bg-[#1C4444]/8 text-[#1C4444] text-xs px-4 py-1.5 rounded-full tracking-wide"
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected Conditions */}
      <div>
        <h4 className="text-[#1C4444] font-medium mb-6 tracking-wide">Detected Concerns</h4>

        {conditions.length === 0 ? (
          <div className="bg-gradient-to-r from-[#D4AF37]/5 to-[#D4AF37]/10 border border-[#D4AF37]/20 p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-white flex items-center justify-center shadow-luxury">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#1C4444] tracking-wide">Your skin looks great!</p>
                <p className="text-sm mt-1 text-[#1C4444]/60">
                  No major concerns detected. Keep up your current routine and focus on prevention.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {conditions.map((condition, idx) => {
              const conditionInfo = SKIN_CONDITIONS[condition.id as SkinConditionType]
              const confidencePercent = Math.round(condition.confidence * 100)

              return (
                <div key={idx} className="border border-[#1C4444]/8 rounded-xl p-5 hover:border-[#1C4444]/15 hover:shadow-luxury transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{conditionInfo?.icon || '📋'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[#1C4444] font-medium tracking-wide">{condition.name}</h5>
                        <span className="text-xs text-[#1C4444]/40 tracking-wide">
                          {confidencePercent}% confidence
                        </span>
                      </div>
                      <p className="text-[#1C4444]/55 text-sm leading-relaxed">
                        {condition.description}
                      </p>

                      {/* Confidence bar */}
                      <div className="mt-4">
                        <div className="h-1 bg-[#1C4444]/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#1C4444] to-[#1C4444]/80 rounded-full transition-all duration-700"
                            style={{ width: `${confidencePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-10 pt-8 border-t border-[#1C4444]/8">
        <div className="flex items-center gap-3 text-[#1C4444]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-white flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <p className="text-sm font-medium tracking-wide">
            Analysis complete! See personalized recommendations below.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
