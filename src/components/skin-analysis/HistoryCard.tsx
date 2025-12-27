'use client'

import { useState } from 'react'
import Link from 'next/link'
import { calculateSkinScores, getQualityColor, getSkinAgeColor, getSkinAgeAccessibleLabel, getQualityAccessibleLabel } from '@/lib/skin-analysis/scoring'

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
  onDelete?: (id: string) => Promise<void>
}

export default function HistoryCard({ analysis, previousScore, isLatest, onDelete }: HistoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const conditions = analysis.conditions || []
  const scores = calculateSkinScores(conditions)
  const date = new Date(analysis.createdAt)

  // Calculate trend based on quality score
  const trend = previousScore !== undefined ? scores.qualityScore - previousScore : 0

  // Get top condition for subtitle
  const topCondition = [...conditions]
    .sort((a, b) => b.confidence - a.confidence)[0]

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(analysis.id)
    } catch (error) {
      console.error('Failed to delete:', error)
      setIsDeleting(false)
    }
    setShowConfirm(false)
  }

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(true)
  }

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }

  return (
    <div className="relative group">
      {/* Delete confirmation overlay */}
      {showConfirm && (
        <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3 animate-elegant-fade-in">
          <p className="text-sm text-[#1C4444]/70">Delete this analysis?</p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={handleCancelClick}
            disabled={isDeleting}
            className="px-4 py-1.5 bg-[#1C4444]/10 text-[#1C4444] text-sm rounded-lg hover:bg-[#1C4444]/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

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
                role="img"
                aria-label={getSkinAgeAccessibleLabel(scores.skinAge, 30)}
                title={`Skin vitality: ${scores.skinAge} years`}
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
                role="img"
                aria-label={getQualityAccessibleLabel(scores.qualityScore)}
                title={`Health score: ${scores.qualityScore}/100 - ${scores.qualityLabel}`}
              >
                {scores.qualityScore}
              </div>
              <span className="text-[9px] text-[#1C4444]/40 mt-0.5 block font-light tracking-wide">Health</span>
            </div>

            {/* Trend indicator - subtle */}
            {trend !== 0 && (
              <div
                className={`text-xs font-medium ${trend > 0 ? 'text-[#1C4444]' : 'text-[#8B7355]'}`}
                title={trend > 0 ? `Improved by ${trend} points since last analysis` : `Declined by ${Math.abs(trend)} points since last analysis`}
                aria-label={trend > 0 ? `Improvement: plus ${trend} points` : `Change: minus ${Math.abs(trend)} points`}
              >
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

      {/* Delete button - always visible on mobile, hover on desktop */}
      {onDelete && (
        <button
          onClick={handleConfirmClick}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 md:bg-white/0 hover:bg-red-50 text-[#1C4444]/40 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-5"
          aria-label="Delete analysis"
          title="Delete this analysis"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
