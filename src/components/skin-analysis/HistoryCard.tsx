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

export default function HistoryCard({ analysis, previousScore, isLatest }: HistoryCardProps) {
  const conditions = analysis.conditions || []
  const scores = calculateSkinScores(conditions)
  const date = new Date(analysis.createdAt)

  // Calculate trend based on quality score
  const trend = previousScore !== undefined ? scores.qualityScore - previousScore : 0

  // Get top condition for subtitle
  const topCondition = [...conditions]
    .sort((a, b) => b.confidence - a.confidence)[0]

  return (
    <Link href={`/skin-analysis/results/${analysis.id}`}>
      <div className="bg-white rounded-xl border border-[#1C4444]/8 hover:border-[#1C4444]/20 hover:shadow-luxury transition-all duration-300 group">
        <div className="p-4 flex items-center gap-4">
          {/* Thumbnail */}
          <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-[#F4EBE7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={analysis.originalImage}
              alt="Analysis"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[#1C4444] tracking-wide">
                {date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                })}
              </span>
              {isLatest && (
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                  Latest
                </span>
              )}
            </div>
            <p className="text-xs text-[#1C4444]/50 font-light truncate">
              {topCondition ? topCondition.name : 'Skin looking great'}
              {conditions.length > 1 && ` +${conditions.length - 1} more`}
            </p>
          </div>

          {/* Dual Scores */}
          <div className="flex items-center gap-4">
            {/* Skin Vitality */}
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                style={{ backgroundColor: getSkinAgeColor(scores.skinAge, 30) }}
              >
                {scores.skinAge}
              </div>
              <span className="text-[9px] text-[#1C4444]/40 mt-0.5 block font-light tracking-wide">Vitality</span>
            </div>

            {/* Skin Health */}
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                style={{ backgroundColor: getQualityColor(scores.qualityScore) }}
              >
                {scores.qualityScore}
              </div>
              <span className="text-[9px] text-[#1C4444]/40 mt-0.5 block font-light tracking-wide">Health</span>
            </div>

            {/* Trend indicator - subtle */}
            {trend !== 0 && (
              <div className={`text-xs font-medium ${trend > 0 ? 'text-[#1C4444]' : 'text-[#8B7355]'}`}>
                {trend > 0 ? '+' : ''}{trend}
              </div>
            )}

            {/* Arrow */}
            <svg className="w-4 h-4 text-[#1C4444]/20 group-hover:text-[#D4AF37] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
