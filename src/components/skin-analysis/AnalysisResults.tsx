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
    <div className="space-y-6">
      {/* Dual Score Display */}
      <DualScoreDisplay scores={scores} userAge={userAge} animate={true} />

      {/* Improvement Callout */}
      {improvement > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-800">
                Your skin could look up to {improvement} years younger
              </h4>
              <p className="text-sm text-green-700 mt-1">
                With a consistent anti-aging routine using the right products, you can achieve visible improvements in fine lines, texture, and radiance.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-medium text-[#1C4444] mb-6">Detailed Analysis</h3>

        {/* Skin Type */}
        {skinTypeInfo && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#1C4444] text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-[#1C4444]/60 text-sm">Your Skin Type</p>
              <p className="text-[#1C4444] font-medium text-lg">{skinTypeInfo.name}</p>
            </div>
          </div>
          <p className="text-[#1C4444]/70 text-sm pl-[52px]">
            {skinTypeInfo.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-3 pl-[52px]">
            {skinTypeInfo.characteristics.map((char, idx) => (
              <span
                key={idx}
                className="bg-[#1C4444]/10 text-[#1C4444] text-xs px-3 py-1 rounded-full"
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected Conditions */}
      <div>
        <h4 className="text-[#1C4444] font-medium mb-4">Detected Concerns</h4>

        {conditions.length === 0 ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">Your skin looks great!</p>
            </div>
            <p className="text-sm mt-1 text-green-700">
              No major concerns detected. Keep up your current routine and focus on prevention.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conditions.map((condition, idx) => {
              const conditionInfo = SKIN_CONDITIONS[condition.id as SkinConditionType]
              const confidencePercent = Math.round(condition.confidence * 100)

              return (
                <div key={idx} className="border border-[#1C4444]/10 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{conditionInfo?.icon || '📋'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-[#1C4444] font-medium">{condition.name}</h5>
                        <span className="text-xs text-[#1C4444]/50">
                          {confidencePercent}% confidence
                        </span>
                      </div>
                      <p className="text-[#1C4444]/60 text-sm">
                        {condition.description}
                      </p>

                      {/* Confidence bar */}
                      <div className="mt-3">
                        <div className="h-1.5 bg-[#1C4444]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1C4444] rounded-full transition-all duration-500"
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
      <div className="mt-8 pt-6 border-t border-[#1C4444]/10">
        <div className="flex items-center gap-2 text-[#1C4444]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <p className="text-sm font-medium">
            Analysis complete! See personalized recommendations below.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
