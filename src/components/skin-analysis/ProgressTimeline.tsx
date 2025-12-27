'use client'

import HistoryCard from './HistoryCard'
import { calculateSkinScores } from '@/lib/skin-analysis/scoring'

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
  onDelete?: (id: string) => Promise<void>
}

export default function ProgressTimeline({
  analyses,
  hasMore,
  onLoadMore,
  isLoading,
  onDelete,
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
    const scores = calculateSkinScores(conditions)

    // Get previous quality score for comparison (next item in array since sorted desc)
    let previousScore: number | undefined
    if (index < analyses.length - 1) {
      const prevConditions = (analyses[index + 1].conditions as DetectedCondition[]) || []
      const prevScores = calculateSkinScores(prevConditions)
      previousScore = prevScores.qualityScore
    }

    return {
      ...analysis,
      conditions,
      scores,
      previousScore,
    }
  })

  return (
    <div className="space-y-3">
      {/* Analysis cards - clean list without timeline */}
      {analysesWithScores.map((analysis, index) => (
        <HistoryCard
          key={analysis.id}
          analysis={analysis}
          previousScore={analysis.previousScore}
          isLatest={index === 0}
          onDelete={onDelete}
        />
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[#1C4444] border border-[#1C4444]/20 rounded-lg hover:bg-[#1C4444]/5 transition-colors disabled:opacity-50"
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
