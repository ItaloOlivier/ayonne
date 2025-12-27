'use client'

import Link from 'next/link'
import SkinHealthScore, { calculateHealthScore } from './SkinHealthScore'

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
  const score = calculateHealthScore(conditions)
  const date = new Date(analysis.createdAt)

  const topConditions = [...conditions]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)

  return (
    <Link href={`/skin-analysis/results/${analysis.id}`}>
      <div className="bg-white rounded-xl border border-[#1C4444]/10 hover:border-[#1C4444]/30 hover:shadow-md transition-all overflow-hidden">
        <div className="flex">
          {/* Thumbnail */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-[#F4EBE7] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={analysis.originalImage}
              alt="Analysis photo"
              className="w-full h-full object-cover"
            />
            {isLatest && (
              <div className="absolute top-1 left-1 bg-[#1C4444] text-white text-[10px] px-1.5 py-0.5 rounded">
                Latest
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
            <div>
              {/* Date and skin type */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#1C4444]/60">
                  {date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                  })}
                </span>
                {analysis.skinType && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${skinTypeColors[analysis.skinType] || 'bg-gray-100 text-gray-800'}`}>
                    {skinTypeLabels[analysis.skinType] || analysis.skinType}
                  </span>
                )}
              </div>

              {/* Conditions */}
              <div className="flex flex-wrap gap-1">
                {topConditions.length > 0 ? (
                  topConditions.map(condition => (
                    <span
                      key={condition.id}
                      className="text-xs bg-[#F4EBE7] text-[#1C4444] px-2 py-0.5 rounded"
                    >
                      {condition.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#1C4444]/50">No conditions detected</span>
                )}
                {conditions.length > 3 && (
                  <span className="text-xs text-[#1C4444]/50">+{conditions.length - 3} more</span>
                )}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="pr-3 sm:pr-4 flex items-center">
            <SkinHealthScore score={score} previousScore={previousScore} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  )
}
