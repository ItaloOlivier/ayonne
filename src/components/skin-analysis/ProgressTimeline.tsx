'use client'

import { useState } from 'react'
import HistoryCard from './HistoryCard'
import { calculateHealthScore } from './SkinHealthScore'

interface DetectedCondition {
  id: string
  name: string
  confidence: number
  description: string
}

interface Analysis {
  id: string
  originalImage: string
  skinType: string | null
  conditions: unknown
  createdAt: string
}

interface ProgressTimelineProps {
  analyses: Analysis[]
  hasMore: boolean
  onLoadMore: () => void
  isLoading?: boolean
}

export default function ProgressTimeline({
  analyses,
  hasMore,
  onLoadMore,
  isLoading,
}: ProgressTimelineProps) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F4EBE7] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#1C4444]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#1C4444] mb-2">No Analysis History</h3>
        <p className="text-[#1C4444]/60 text-sm">
          Complete your first skin analysis to start tracking your progress.
        </p>
      </div>
    )
  }

  // Calculate scores for each analysis to show trends
  const analysesWithScores = analyses.map((analysis, index) => {
    const conditions = (analysis.conditions as DetectedCondition[]) || []
    const score = calculateHealthScore(conditions)

    // Get previous score for comparison (next item in array since sorted desc)
    let previousScore: number | undefined
    if (index < analyses.length - 1) {
      const prevConditions = (analyses[index + 1].conditions as DetectedCondition[]) || []
      previousScore = calculateHealthScore(prevConditions)
    }

    return {
      ...analysis,
      conditions,
      score,
      previousScore,
    }
  })

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#1C4444]/10" />

        {/* Timeline items */}
        <div className="space-y-4">
          {analysesWithScores.map((analysis, index) => (
            <div key={analysis.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className={`absolute left-2 top-6 w-4 h-4 rounded-full border-2 ${
                index === 0
                  ? 'bg-[#1C4444] border-[#1C4444]'
                  : 'bg-white border-[#1C4444]/30'
              }`} />

              {/* Card */}
              <HistoryCard
                analysis={analysis}
                previousScore={analysis.previousScore}
                isLatest={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2 text-[#1C4444] border border-[#1C4444]/30 rounded-lg hover:bg-[#1C4444]/5 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Load More
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
