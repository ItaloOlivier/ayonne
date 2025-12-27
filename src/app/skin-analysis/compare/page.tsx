'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { calculateSkinScores, getQualityColor, getSkinAgeColor } from '@/lib/skin-analysis/scoring'

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
  conditions: DetectedCondition[]
  createdAt: string
}

function ComparePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)

  // Get pre-selected IDs from URL params
  const leftId = searchParams.get('left')
  const rightId = searchParams.get('right')

  useEffect(() => {
    // Check auth and fetch all analyses
    const fetchData = async () => {
      try {
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
          router.push('/login?redirect=/skin-analysis/compare')
          return
        }

        const response = await fetch('/api/skin-analysis/history?limit=50')
        const data = await response.json()

        if (data.error === 'Unauthorized') {
          router.push('/login?redirect=/skin-analysis/compare')
          return
        }

        if (data.analyses) {
          setAnalyses(data.analyses)

          // Set initial selections from URL params or defaults
          if (data.analyses.length >= 2) {
            if (leftId && data.analyses.find((a: Analysis) => a.id === leftId)) {
              setSelectedLeft(leftId)
            } else {
              setSelectedLeft(data.analyses[0].id)
            }

            if (rightId && data.analyses.find((a: Analysis) => a.id === rightId)) {
              setSelectedRight(rightId)
            } else {
              setSelectedRight(data.analyses[data.analyses.length - 1].id)
            }
          } else if (data.analyses.length === 1) {
            setSelectedLeft(data.analyses[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching analyses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, leftId, rightId])

  const leftAnalysis = useMemo(() =>
    analyses.find(a => a.id === selectedLeft) || null,
    [analyses, selectedLeft]
  )

  const rightAnalysis = useMemo(() =>
    analyses.find(a => a.id === selectedRight) || null,
    [analyses, selectedRight]
  )

  const leftScores = useMemo(() => {
    if (!leftAnalysis) return null
    return calculateSkinScores(leftAnalysis.conditions || [])
  }, [leftAnalysis])

  const rightScores = useMemo(() => {
    if (!rightAnalysis) return null
    return calculateSkinScores(rightAnalysis.conditions || [])
  }, [rightAnalysis])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calculate differences
  const healthDiff = leftScores && rightScores
    ? rightScores.qualityScore - leftScores.qualityScore
    : 0
  const vitalityDiff = leftScores && rightScores
    ? leftScores.skinAge - rightScores.skinAge // Positive = improvement (got younger)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#1C4444]/50 text-sm tracking-wide">Loading analyses...</p>
        </div>
      </div>
    )
  }

  if (analyses.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95">
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <Link
                href="/skin-analysis/history"
                className="inline-flex items-center text-[#1C4444]/50 hover:text-[#1C4444] mb-8 transition-all duration-300 tracking-wide text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to History
              </Link>

              <div className="card-luxury p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#1C4444]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#1C4444] mb-3 tracking-wide">Need More Analyses</h3>
                <p className="text-[#1C4444]/50 mb-8 max-w-md mx-auto">
                  Complete at least two skin analyses to compare your progress over time.
                </p>
                <Link
                  href="/skin-analysis"
                  className="inline-flex items-center gap-3 bg-[#1C4444] text-white px-8 py-4 rounded-xl hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg btn-luxury"
                >
                  Start New Analysis
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#1C4444]/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/[0.03] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <section className="py-8 md:py-12 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link
              href="/skin-analysis/history"
              className="inline-flex items-center text-[#1C4444]/50 hover:text-[#1C4444] mb-6 transition-all duration-300 tracking-wide text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to History
            </Link>

            <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] mb-2">
              Progress Comparison
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-2 tracking-tight">
              Compare Your Analyses
            </h1>
            <p className="text-[#1C4444]/55 leading-relaxed">
              See how your skin has changed between analyses
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="pb-16 md:pb-24 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Selection Dropdowns */}
            <div className="card-luxury p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Selection */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1C4444]/50 mb-2">
                    Earlier Analysis
                  </label>
                  <select
                    value={selectedLeft || ''}
                    onChange={(e) => setSelectedLeft(e.target.value)}
                    className="w-full border border-[#1C4444]/15 rounded-lg px-4 py-3 text-[#1C4444] bg-white focus:outline-none focus:border-[#1C4444]/30 transition-colors"
                  >
                    {analyses.map((analysis) => (
                      <option
                        key={analysis.id}
                        value={analysis.id}
                        disabled={analysis.id === selectedRight}
                      >
                        {formatDate(analysis.createdAt)} - {analysis.skinType || 'Unknown'} Skin
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right Selection */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1C4444]/50 mb-2">
                    Later Analysis
                  </label>
                  <select
                    value={selectedRight || ''}
                    onChange={(e) => setSelectedRight(e.target.value)}
                    className="w-full border border-[#1C4444]/15 rounded-lg px-4 py-3 text-[#1C4444] bg-white focus:outline-none focus:border-[#1C4444]/30 transition-colors"
                  >
                    {analyses.map((analysis) => (
                      <option
                        key={analysis.id}
                        value={analysis.id}
                        disabled={analysis.id === selectedLeft}
                      >
                        {formatDate(analysis.createdAt)} - {analysis.skinType || 'Unknown'} Skin
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            {leftScores && rightScores && (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Health Change */}
                <div className="card-luxury p-6 text-center">
                  <p className="text-xs uppercase tracking-widest text-[#1C4444]/50 mb-2">
                    Health Score Change
                  </p>
                  <div className={`text-4xl font-light ${
                    healthDiff > 0 ? 'text-[#1C4444]' : healthDiff < 0 ? 'text-[#8B7355]' : 'text-[#1C4444]/50'
                  }`}>
                    {healthDiff > 0 ? '+' : ''}{healthDiff}
                  </div>
                  <p className="text-sm text-[#1C4444]/60 mt-1">
                    {healthDiff > 0 ? 'Improvement' : healthDiff < 0 ? 'Decline' : 'No change'}
                  </p>
                </div>

                {/* Vitality Change */}
                <div className="card-luxury p-6 text-center">
                  <p className="text-xs uppercase tracking-widest text-[#1C4444]/50 mb-2">
                    Skin Vitality Change
                  </p>
                  <div className={`text-4xl font-light ${
                    vitalityDiff > 0 ? 'text-[#1C4444]' : vitalityDiff < 0 ? 'text-[#8B7355]' : 'text-[#1C4444]/50'
                  }`}>
                    {vitalityDiff > 0 ? '-' : vitalityDiff < 0 ? '+' : ''}{Math.abs(vitalityDiff)} yrs
                  </div>
                  <p className="text-sm text-[#1C4444]/60 mt-1">
                    {vitalityDiff > 0 ? 'Looking younger' : vitalityDiff < 0 ? 'Looking older' : 'No change'}
                  </p>
                </div>

                {/* Days Between */}
                <div className="card-luxury p-6 text-center">
                  <p className="text-xs uppercase tracking-widest text-[#1C4444]/50 mb-2">
                    Time Between
                  </p>
                  <div className="text-4xl font-light text-[#1C4444]">
                    {leftAnalysis && rightAnalysis
                      ? Math.abs(Math.round((new Date(rightAnalysis.createdAt).getTime() - new Date(leftAnalysis.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
                      : 0}
                  </div>
                  <p className="text-sm text-[#1C4444]/60 mt-1">Days</p>
                </div>
              </div>
            )}

            {/* Side by Side Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Analysis Card */}
              <div className="card-luxury overflow-hidden">
                {leftAnalysis ? (
                  <>
                    {/* Image */}
                    <div className="relative aspect-square bg-[#F4EBE7]">
                      {leftAnalysis.originalImage ? (
                        <Image
                          src={leftAnalysis.originalImage}
                          alt="Earlier analysis"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-16 h-16 text-[#1C4444]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <p className="text-xs font-medium text-[#1C4444]">{formatDate(leftAnalysis.createdAt)}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-6">
                      {/* Skin Type */}
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-widest text-[#1C4444]/50 mb-1">Skin Type</p>
                        <p className="text-lg font-medium text-[#1C4444] capitalize">
                          {leftAnalysis.skinType || 'Unknown'}
                        </p>
                      </div>

                      {leftScores && (
                        <>
                          {/* Scores */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Vitality */}
                            <div className="text-center p-4 bg-[#F4EBE7]/50 rounded-xl">
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-light mx-auto mb-2"
                                style={{ backgroundColor: getSkinAgeColor(leftScores.skinAge, 30) }}
                              >
                                {leftScores.skinAge}
                              </div>
                              <p className="text-xs text-[#1C4444]/50">Skin Vitality</p>
                            </div>

                            {/* Health */}
                            <div className="text-center p-4 bg-[#F4EBE7]/50 rounded-xl">
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-light mx-auto mb-2"
                                style={{ backgroundColor: getQualityColor(leftScores.qualityScore) }}
                              >
                                {leftScores.qualityScore}
                              </div>
                              <p className="text-xs text-[#1C4444]/50">Health Score</p>
                            </div>
                          </div>

                          {/* Conditions */}
                          <div>
                            <p className="text-xs uppercase tracking-widest text-[#1C4444]/50 mb-3">Detected Concerns</p>
                            <div className="flex flex-wrap gap-2">
                              {leftAnalysis.conditions?.slice(0, 5).map((condition) => (
                                <span
                                  key={condition.id}
                                  className="px-3 py-1.5 bg-[#F4EBE7] text-[#1C4444] text-xs rounded-full"
                                >
                                  {condition.name}
                                </span>
                              ))}
                              {(!leftAnalysis.conditions || leftAnalysis.conditions.length === 0) && (
                                <span className="text-sm text-[#1C4444]/50">No concerns detected</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* View Details Link */}
                      <Link
                        href={`/skin-analysis/results/${leftAnalysis.id}`}
                        className="block text-center text-sm text-[#1C4444] hover:text-[#D4AF37] transition-colors"
                      >
                        View Full Analysis
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-[#1C4444]/50">Select an analysis</p>
                  </div>
                )}
              </div>

              {/* Right Analysis Card */}
              <div className="card-luxury overflow-hidden">
                {rightAnalysis ? (
                  <>
                    {/* Image */}
                    <div className="relative aspect-square bg-[#F4EBE7]">
                      {rightAnalysis.originalImage ? (
                        <Image
                          src={rightAnalysis.originalImage}
                          alt="Later analysis"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-16 h-16 text-[#1C4444]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <p className="text-xs font-medium text-[#1C4444]">{formatDate(rightAnalysis.createdAt)}</p>
                      </div>
                      {/* Improvement Badge */}
                      {healthDiff > 0 && (
                        <div className="absolute top-4 right-4 bg-[#1C4444] text-white px-3 py-1.5 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span className="text-xs font-medium">Improved</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-6">
                      {/* Skin Type */}
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-widest text-[#1C4444]/50 mb-1">Skin Type</p>
                        <p className="text-lg font-medium text-[#1C4444] capitalize">
                          {rightAnalysis.skinType || 'Unknown'}
                        </p>
                      </div>

                      {rightScores && (
                        <>
                          {/* Scores */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Vitality */}
                            <div className="text-center p-4 bg-[#F4EBE7]/50 rounded-xl relative">
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-light mx-auto mb-2"
                                style={{ backgroundColor: getSkinAgeColor(rightScores.skinAge, 30) }}
                              >
                                {rightScores.skinAge}
                              </div>
                              <p className="text-xs text-[#1C4444]/50">Skin Vitality</p>
                              {vitalityDiff !== 0 && (
                                <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  vitalityDiff > 0 ? 'bg-[#1C4444] text-white' : 'bg-[#8B7355] text-white'
                                }`}>
                                  {vitalityDiff > 0 ? '-' : '+'}{Math.abs(vitalityDiff)}
                                </div>
                              )}
                            </div>

                            {/* Health */}
                            <div className="text-center p-4 bg-[#F4EBE7]/50 rounded-xl relative">
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-light mx-auto mb-2"
                                style={{ backgroundColor: getQualityColor(rightScores.qualityScore) }}
                              >
                                {rightScores.qualityScore}
                              </div>
                              <p className="text-xs text-[#1C4444]/50">Health Score</p>
                              {healthDiff !== 0 && (
                                <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  healthDiff > 0 ? 'bg-[#1C4444] text-white' : 'bg-[#8B7355] text-white'
                                }`}>
                                  {healthDiff > 0 ? '+' : ''}{healthDiff}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Conditions */}
                          <div>
                            <p className="text-xs uppercase tracking-widest text-[#1C4444]/50 mb-3">Detected Concerns</p>
                            <div className="flex flex-wrap gap-2">
                              {rightAnalysis.conditions?.slice(0, 5).map((condition) => (
                                <span
                                  key={condition.id}
                                  className="px-3 py-1.5 bg-[#F4EBE7] text-[#1C4444] text-xs rounded-full"
                                >
                                  {condition.name}
                                </span>
                              ))}
                              {(!rightAnalysis.conditions || rightAnalysis.conditions.length === 0) && (
                                <span className="text-sm text-[#1C4444]/50">No concerns detected</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* View Details Link */}
                      <Link
                        href={`/skin-analysis/results/${rightAnalysis.id}`}
                        className="block text-center text-sm text-[#1C4444] hover:text-[#D4AF37] transition-colors"
                      >
                        View Full Analysis
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-[#1C4444]/50">Select an analysis</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Comparison */}
            {leftScores && rightScores && (
              <div className="card-luxury p-8 mt-8">
                <h3 className="text-lg font-medium text-[#1C4444] mb-6 tracking-wide text-center">
                  Category Comparison
                </h3>
                <div className="space-y-6">
                  {Object.keys(leftScores.categories).map((category) => {
                    const leftVal = leftScores.categories[category as keyof typeof leftScores.categories]
                    const rightVal = rightScores.categories[category as keyof typeof rightScores.categories]
                    const diff = rightVal - leftVal

                    return (
                      <div key={category} className="flex items-center gap-4">
                        <span className="w-20 text-sm text-[#1C4444]/60 capitalize text-right">
                          {category}
                        </span>

                        {/* Left Bar */}
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-[#1C4444]/50 w-8 text-right">{leftVal}</span>
                          <div className="flex-1 h-2 bg-[#F4EBE7] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1C4444]/40 rounded-full transition-all duration-500"
                              style={{ width: `${leftVal}%` }}
                            />
                          </div>
                        </div>

                        {/* Diff indicator */}
                        <div className={`w-12 text-center text-xs font-medium ${
                          diff > 0 ? 'text-[#1C4444]' : diff < 0 ? 'text-[#8B7355]' : 'text-[#1C4444]/30'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff !== 0 ? diff : '-'}
                        </div>

                        {/* Right Bar */}
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#F4EBE7] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${rightVal}%`,
                                backgroundColor: getQualityColor(rightVal)
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#1C4444]/50 w-8">{rightVal}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="text-center mt-8">
              <Link
                href="/skin-analysis"
                className="inline-flex items-center gap-3 bg-[#1C4444] text-white px-8 py-4 rounded-xl hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg hover:-translate-y-0.5 btn-luxury"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ComparePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#1C4444]/50 text-sm tracking-wide">Loading...</p>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageLoading />}>
      <ComparePageContent />
    </Suspense>
  )
}
