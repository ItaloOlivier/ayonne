'use client'

import Link from 'next/link'
import { calculateSkinScores, getQualityColor, getSkinAgeColor } from '@/lib/skin-analysis/scoring'

interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

interface HistoryCardProps {
  analysis: {
    id: string
    originalImage: string
    skinType: string | null
    conditions: DetectedCondition[]
    createdAt: Date | string
  }
  previousScore?: number
  isLatest?: boolean
}

const skinTypeLabels: Record<string, string> = {
  oily: 'Oily',
  dry: 'Dry',
  combination: 'Combination',
  normal: 'Normal',
  sensitive: 'Sensitive',
}

const skinTypeColors: Record<string, string> = {
  oily: 'bg-amber-100 text-amber-800',
  dry: 'bg-blue-100 text-blue-800',
  combination: 'bg-purple-100 text-purple-800',
  normal: 'bg-green-100 text-green-800',
  sensitive: 'bg-pink-100 text-pink-800',
}

export default function HistoryCard({ analysis, previousScore, isLatest }: HistoryCardProps) {
  const conditions = analysis.conditions || []
  const scores = calculateSkinScores(conditions)
  const date = new Date(analysis.createdAt)

  const topConditions = [...conditions]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2) // Show only 2 on mobile to prevent crowding

  // Calculate trend based on quality score
  const trend = previousScore !== undefined ? scores.qualityScore - previousScore : 0
  const skinAgeImprovement = scores.skinAge - scores.achievableSkinAge

  return (
    <Link href={`/skin-analysis/results/${analysis.id}`}>
      <div className="bg-white rounded-xl border border-[#1C4444]/10 hover:border-[#1C4444]/30 hover:shadow-md transition-all overflow-hidden">
        {/* Mobile-first stacked layout */}
        <div className="p-3 sm:p-4">
          {/* Top row: Date, badge, skin type */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#1C4444]">
                {date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                })}
              </span>
              {isLatest && (
                <span className="bg-[#1C4444] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  Latest
                </span>
              )}
            </div>
            {analysis.skinType && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${skinTypeColors[analysis.skinType] || 'bg-gray-100 text-gray-800'}`}>
                {skinTypeLabels[analysis.skinType] || analysis.skinType}
              </span>
            )}
          </div>

          {/* Main content: Image + Score side by side */}
          <div className="flex gap-3 sm:gap-4">
            {/* Thumbnail - smaller and more compact */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F4EBE7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={analysis.originalImage}
                alt="Analysis photo"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Dual Score display - inline compact */}
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Skin Age */}
                <div className="text-center">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: getSkinAgeColor(scores.skinAge, 30) }}
                  >
                    {scores.skinAge}
                  </div>
                  <span className="text-[10px] text-[#1C4444]/50 mt-0.5 block">Age</span>
                </div>

                {/* Quality Score */}
                <div className="text-center">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: getQualityColor(scores.qualityScore) }}
                  >
                    {scores.qualityScore}
                  </div>
                  <span className="text-[10px] text-[#1C4444]/50 mt-0.5 block">Quality</span>
                </div>

                {/* Improvement indicator */}
                {skinAgeImprovement > 0 && (
                  <div className="text-center">
                    <div className="text-green-600 text-xs font-medium">
                      -{skinAgeImprovement} yrs
                    </div>
                    <span className="text-[10px] text-green-500">potential</span>
                  </div>
                )}
              </div>

              {/* Arrow indicator */}
              <svg className="w-5 h-5 text-[#1C4444]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Conditions - below the main content */}
          {topConditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#1C4444]/5">
              {topConditions.map(condition => (
                <span
                  key={condition.id}
                  className="text-xs bg-[#F4EBE7] text-[#1C4444]/80 px-2 py-1 rounded-md"
                >
                  {condition.name}
                </span>
              ))}
              {conditions.length > 2 && (
                <span className="text-xs text-[#1C4444]/40 px-2 py-1">
                  +{conditions.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
