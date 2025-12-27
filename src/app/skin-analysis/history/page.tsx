'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProgressTimeline from '@/components/skin-analysis/ProgressTimeline'
import TrendChart from '@/components/skin-analysis/TrendChart'
import SkinHealthScore, { calculateHealthScore } from '@/components/skin-analysis/SkinHealthScore'

const CUSTOMER_STORAGE_KEY = 'ayonne_customer_id'

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
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [period, setPeriod] = useState<Period>('month')

  // Get customer ID from localStorage
  useEffect(() => {
    const storedId = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    if (!storedId) {
      router.push('/skin-analysis')
      return
    }
    setCustomerId(storedId)
  }, [router])

  // Fetch history
  const fetchHistory = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!customerId) return

    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      const response = await fetch(
        `/api/skin-analysis/history?customerId=${customerId}&page=${pageNum}&limit=10`
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
  }, [customerId])

  // Fetch trends
  const fetchTrends = useCallback(async () => {
    if (!customerId) return

    try {
      const response = await fetch(
        `/api/skin-analysis/trends?customerId=${customerId}&period=${period}`
      )
      const data = await response.json()

      if (response.ok) {
        setTrends(data)
      }
    } catch (err) {
      console.error('Failed to fetch trends:', err)
    }
  }, [customerId, period])

  // Initial fetch
  useEffect(() => {
    if (customerId) {
      fetchHistory(1)
      fetchTrends()
    }
  }, [customerId, fetchHistory, fetchTrends])

  // Refetch trends when period changes
  useEffect(() => {
    if (customerId) {
      fetchTrends()
    }
  }, [period, customerId, fetchTrends])

  const handleLoadMore = () => {
    fetchHistory(page + 1, true)
  }

  // Calculate current and previous scores for the header
  const latestScore = analyses.length > 0
    ? calculateHealthScore((analyses[0].conditions as DetectedCondition[]) || [])
    : 0
  const previousScore = analyses.length > 1
    ? calculateHealthScore((analyses[1].conditions as DetectedCondition[]) || [])
    : undefined

  if (isLoading && !customerId) {
    return (
      <div className="min-h-screen bg-[#F4EBE7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Header */}
      <section className="py-8 md:py-12 border-b border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/skin-analysis"
              className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] mb-6 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Skin Analysis
            </Link>

            <h1 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-2">
              Your Skin Progress
            </h1>
            <p className="text-[#1C4444]/60">
              Track your skin health journey over time
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#1C4444]/60">Loading your history...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">
                  {error}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Overview Cards */}
                {analyses.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Score Card */}
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-lg font-medium text-[#1C4444] mb-4 text-center">
                        Current Skin Health
                      </h3>
                      <div className="flex justify-center">
                        <SkinHealthScore
                          score={latestScore}
                          previousScore={previousScore}
                          size="lg"
                        />
                      </div>
                      {trends && trends.overallImprovement !== 0 && (
                        <p className={`text-center mt-4 text-sm ${
                          trends.overallImprovement > 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {trends.overallImprovement > 0 ? '↑' : '↓'} {Math.abs(trends.overallImprovement)} points
                          since first analysis
                        </p>
                      )}
                    </div>

                    {/* Trend Chart Card */}
                    <div className="bg-white rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-[#1C4444]">
                          Score Trend
                        </h3>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value as Period)}
                          className="text-sm border border-[#1C4444]/20 rounded px-2 py-1 text-[#1C4444] bg-white"
                        >
                          <option value="week">Last Week</option>
                          <option value="month">Last Month</option>
                          <option value="3months">Last 3 Months</option>
                          <option value="all">All Time</option>
                        </select>
                      </div>
                      {trends && trends.scores.length > 0 ? (
                        <TrendChart data={trends.scores} height={180} />
                      ) : (
                        <div className="flex items-center justify-center h-32 text-[#1C4444]/50 text-sm">
                          Not enough data to show trends
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats Summary */}
                {trends && trends.analysisCount > 0 && (
                  <div className="bg-white rounded-xl p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-semibold text-[#1C4444]">
                          {trends.analysisCount}
                        </p>
                        <p className="text-sm text-[#1C4444]/60">
                          {trends.analysisCount === 1 ? 'Analysis' : 'Analyses'}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-[#1C4444]">
                          {latestScore}
                        </p>
                        <p className="text-sm text-[#1C4444]/60">Current Score</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-semibold ${
                          trends.overallImprovement >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {trends.overallImprovement >= 0 ? '+' : ''}{trends.overallImprovement}
                        </p>
                        <p className="text-sm text-[#1C4444]/60">Improvement</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-medium text-[#1C4444] mb-6">
                    Analysis History
                  </h3>
                  <ProgressTimeline
                    analyses={analyses}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    isLoading={isLoadingMore}
                  />
                </div>

                {/* CTA */}
                {analyses.length > 0 && (
                  <div className="text-center py-4">
                    <Link
                      href="/skin-analysis"
                      className="inline-flex items-center gap-2 bg-[#1C4444] text-white px-6 py-3 rounded-lg hover:bg-[#1C4444]/90 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      New Analysis
                    </Link>
                    <p className="text-sm text-[#1C4444]/50 mt-2">
                      You can perform one analysis per day
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
