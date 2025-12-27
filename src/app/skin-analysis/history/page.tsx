'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProgressTimeline from '@/components/skin-analysis/ProgressTimeline'
import TrendChart from '@/components/skin-analysis/TrendChart'
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
  conditions: unknown
  createdAt: string
}

interface TrendData {
  scores: { date: string; score: number }[]
  overallImprovement: number
  analysisCount: number
  latestSkinType: string | null
}

type Period = 'week' | 'month' | '3months' | 'all'

export default function HistoryPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [period, setPeriod] = useState<Period>('month')

  // Check if user is authenticated via cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          router.push('/login?redirect=/skin-analysis/history')
        }
      } catch {
        setIsAuthenticated(false)
        router.push('/login?redirect=/skin-analysis/history')
      }
    }
    checkAuth()
  }, [router])

  // Fetch history
  const fetchHistory = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!isAuthenticated) return

    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      const response = await fetch(
        `/api/skin-analysis/history?page=${pageNum}&limit=10`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history')
      }

      if (append) {
        setAnalyses(prev => [...prev, ...data.analyses])
      } else {
        setAnalyses(data.analyses)
      }
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [isAuthenticated])

  // Fetch trends
  const fetchTrends = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const response = await fetch(
        `/api/skin-analysis/trends?period=${period}`
      )
      const data = await response.json()

      if (response.ok) {
        setTrends(data)
      }
    } catch (err) {
      console.error('Failed to fetch trends:', err)
    }
  }, [isAuthenticated, period])

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory(1)
      fetchTrends()
    }
  }, [isAuthenticated, fetchHistory, fetchTrends])

  // Refetch trends when period changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTrends()
    }
  }, [period, isAuthenticated, fetchTrends])

  const handleLoadMore = () => {
    fetchHistory(page + 1, true)
  }

  // Calculate dual scores using the same system as the analysis page
  const latestScores = useMemo(() => {
    if (analyses.length === 0) return null
    const conditions = (analyses[0].conditions as DetectedCondition[]) || []
    return calculateSkinScores(conditions)
  }, [analyses])

  const previousScores = useMemo(() => {
    if (analyses.length < 2) return null
    const conditions = (analyses[1].conditions as DetectedCondition[]) || []
    return calculateSkinScores(conditions)
  }, [analyses])

  // Calculate first analysis scores for improvement tracking
  const firstScores = useMemo(() => {
    if (analyses.length === 0) return null
    const firstAnalysis = analyses[analyses.length - 1]
    const conditions = (firstAnalysis.conditions as DetectedCondition[]) || []
    return calculateSkinScores(conditions)
  }, [analyses])

  // Calculate improvements
  const healthImprovement = latestScores && firstScores
    ? latestScores.qualityScore - firstScores.qualityScore
    : 0
  const vitalityImprovement = latestScores && firstScores
    ? firstScores.skinAge - latestScores.skinAge // Positive = improvement (lower age)
    : 0

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#1C4444]/50 text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#1C4444]/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/[0.03] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <section className="py-10 md:py-14 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/skin-analysis"
                className="inline-flex items-center text-[#1C4444]/50 hover:text-[#1C4444] transition-all duration-300 tracking-wide text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Skin Analysis
              </Link>

              {analyses.length >= 2 && (
                <Link
                  href="/skin-analysis/compare"
                  className="inline-flex items-center gap-2 text-[#1C4444] hover:text-[#D4AF37] transition-all duration-300 tracking-wide text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Compare Analyses
                </Link>
              )}
            </div>

            <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              Your Journey
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-3 tracking-tight">
              Skin Progress
            </h1>
            <p className="text-[#1C4444]/55 leading-relaxed">
              Track your skin vitality and health improvements over time
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 md:pb-28 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-3 border-[#1C4444] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#1C4444]/50 tracking-wide">Loading your history...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="card-luxury p-8 inline-block">
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            ) : analyses.length === 0 ? (
              <div className="card-luxury p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#1C4444]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#1C4444] mb-3 tracking-wide">No Analysis History</h3>
                <p className="text-[#1C4444]/50 mb-8 max-w-md mx-auto">
                  Complete your first skin analysis to start tracking your progress and see improvements over time.
                </p>
                <Link
                  href="/skin-analysis"
                  className="inline-flex items-center gap-3 bg-[#1C4444] text-white px-8 py-4 rounded-xl hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg btn-luxury"
                >
                  Start Your First Analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Dual Score Overview - Matching Analysis Page Design */}
                {latestScores && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Skin Vitality Card */}
                    <div className="card-luxury p-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xs font-medium text-[#1C4444]/40 uppercase tracking-[0.2em] mb-1">
                          Skin Vitality
                        </h3>
                        <p className="text-[#1C4444]/60 text-sm font-light">
                          Your skin&apos;s biological expression
                        </p>
                      </div>

                      {/* Vitality Display */}
                      <div className="flex items-center justify-center gap-6 mb-6">
                        {/* Current Vitality */}
                        <div className="text-center">
                          <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-light mx-auto mb-2 shadow-luxury transition-all duration-300"
                            style={{ backgroundColor: getSkinAgeColor(latestScores.skinAge, 30) }}
                          >
                            {latestScores.skinAge}
                          </div>
                          <p className="text-xs text-[#1C4444]/50 font-light tracking-wide">Current</p>
                        </div>

                        {/* Arrow */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-[1px] bg-gradient-to-r from-[#1C4444]/20 via-[#1C4444]/40 to-[#1C4444]/20 relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[5px] border-l-[#1C4444]/40 border-y-[3px] border-y-transparent" />
                          </div>
                          <span className="text-[10px] text-[#1C4444]/50 mt-1">potential</span>
                        </div>

                        {/* Achievable Vitality */}
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-light mx-auto mb-2 shadow-luxury bg-[#1C4444] ring-2 ring-offset-2 ring-[#D4AF37]/30">
                            {latestScores.achievableSkinAge}
                          </div>
                          <p className="text-xs text-[#1C4444] font-medium tracking-wide">Potential</p>
                        </div>
                      </div>

                      {/* Improvement indicator */}
                      {latestScores.skinAge > latestScores.achievableSkinAge && (
                        <div className="text-center pt-4 border-t border-[#1C4444]/8">
                          <p className="text-sm text-[#1C4444]/60">
                            <span className="text-[#D4AF37] font-medium">
                              {latestScores.skinAge - latestScores.achievableSkinAge} years
                            </span> improvement possible
                          </p>
                        </div>
                      )}

                      {/* Progress since first analysis */}
                      {vitalityImprovement !== 0 && analyses.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-[#1C4444]/5">
                          <div className={`flex items-center justify-center gap-2 text-sm ${
                            vitalityImprovement > 0 ? 'text-[#1C4444]' : 'text-[#8B7355]'
                          }`}>
                            {vitalityImprovement > 0 ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                            <span className="font-medium">
                              {Math.abs(vitalityImprovement)} years {vitalityImprovement > 0 ? 'younger' : 'older'}
                            </span>
                            <span className="text-[#1C4444]/50">since first analysis</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skin Health Card */}
                    <div className="card-luxury p-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xs font-medium text-[#1C4444]/40 uppercase tracking-[0.2em] mb-1">
                          Skin Health
                        </h3>
                        <p className="text-[#1C4444]/60 text-sm font-light">
                          Overall condition & balance
                        </p>
                      </div>

                      {/* Circular Score */}
                      <div className="flex justify-center mb-6">
                        <div className="relative w-28 h-28">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              fill="none"
                              stroke="#F4EBE7"
                              strokeWidth="6"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              fill="none"
                              stroke={getQualityColor(latestScores.qualityScore)}
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 42}
                              strokeDashoffset={(1 - latestScores.qualityScore / 100) * 2 * Math.PI * 42}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-light text-[#1C4444]">{latestScores.qualityScore}</span>
                            <span className="text-xs font-medium text-[#1C4444]/60 mt-0.5">
                              {latestScores.qualityLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category Breakdown */}
                      <div className="space-y-2.5">
                        {Object.entries(latestScores.categories).map(([category, score]) => (
                          <div key={category} className="flex items-center gap-3">
                            <span className="text-xs text-[#1C4444]/50 w-16 capitalize font-light tracking-wide">
                              {category}
                            </span>
                            <div className="flex-1 h-1.5 bg-[#F4EBE7] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${score}%`,
                                  backgroundColor: getQualityColor(score),
                                }}
                              />
                            </div>
                            <span className="text-xs text-[#1C4444]/60 w-6 text-right font-light">{score}</span>
                          </div>
                        ))}
                      </div>

                      {/* Progress since first analysis */}
                      {healthImprovement !== 0 && analyses.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-[#1C4444]/5">
                          <div className={`flex items-center justify-center gap-2 text-sm ${
                            healthImprovement > 0 ? 'text-[#1C4444]' : 'text-[#8B7355]'
                          }`}>
                            {healthImprovement > 0 ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                            <span className="font-medium">
                              {healthImprovement > 0 ? '+' : ''}{healthImprovement} points
                            </span>
                            <span className="text-[#1C4444]/50">since first analysis</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats Summary */}
                {trends && trends.analysisCount > 0 && (
                  <div className="card-luxury p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div className="p-4 bg-gradient-to-br from-[#F4EBE7]/50 to-transparent rounded-xl">
                        <p className="text-3xl font-light text-[#1C4444] mb-1">
                          {trends.analysisCount}
                        </p>
                        <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">
                          {trends.analysisCount === 1 ? 'Analysis' : 'Analyses'}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-[#F4EBE7]/50 to-transparent rounded-xl">
                        <p className="text-3xl font-light text-[#1C4444] mb-1">
                          {latestScores?.skinAge || '-'}
                        </p>
                        <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">Skin Vitality</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-[#F4EBE7]/50 to-transparent rounded-xl">
                        <p className="text-3xl font-light text-[#1C4444] mb-1">
                          {latestScores?.qualityScore || '-'}
                        </p>
                        <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">Health Score</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-[#F4EBE7]/50 to-transparent rounded-xl">
                        <p className={`text-3xl font-light mb-1 ${
                          healthImprovement >= 0 ? 'text-[#1C4444]' : 'text-[#8B7355]'
                        }`}>
                          {healthImprovement >= 0 ? '+' : ''}{healthImprovement}
                        </p>
                        <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">Health Change</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trend Chart */}
                {trends && trends.scores.length > 1 && (
                  <div className="card-luxury p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-medium text-[#1C4444] tracking-wide">
                          Health Score Trend
                        </h3>
                        <p className="text-sm text-[#1C4444]/50">Track your skin health improvements</p>
                      </div>
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as Period)}
                        className="text-sm border border-[#1C4444]/15 rounded-lg px-4 py-2 text-[#1C4444] bg-white/50 focus:outline-none focus:border-[#1C4444]/30 transition-colors"
                      >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>
                    <TrendChart data={trends.scores} height={200} color="#1C4444" />
                  </div>
                )}

                {/* Timeline */}
                <div className="card-luxury p-8">
                  <h3 className="text-lg font-medium text-[#1C4444] mb-2 tracking-wide">
                    Analysis History
                  </h3>
                  <p className="text-sm text-[#1C4444]/50 mb-6">
                    View details of each analysis
                  </p>
                  <ProgressTimeline
                    analyses={analyses}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    isLoading={isLoadingMore}
                  />
                </div>

                {/* CTA */}
                <div className="text-center py-4">
                  <Link
                    href="/skin-analysis"
                    className="inline-flex items-center gap-3 bg-[#1C4444] text-white px-8 py-4 rounded-xl hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg hover:-translate-y-0.5 btn-luxury"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Analysis
                  </Link>
                  <p className="text-sm text-[#1C4444]/40 mt-3 tracking-wide">
                    You can perform one analysis per day
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
