'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SkinForecastView from '@/components/skin-analysis/SkinForecast'
import { SkinForecast } from '@/lib/skin-analysis/forecast'

interface ForecastResponse {
  success: boolean
  forecast: SkinForecast
  latestAnalysisDate: string
  skinType: string | null
  error?: string
  message?: string
}

export default function SkinForecastPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ForecastResponse | null>(null)

  useEffect(() => {
    async function fetchForecast() {
      try {
        const response = await fetch('/api/skin-analysis/forecast')
        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view your skin forecast')
          } else if (response.status === 404) {
            setError(result.message || 'No analyses found')
          } else {
            setError(result.error || 'Failed to load forecast')
          }
          return
        }

        setData(result)
      } catch (err) {
        setError('Failed to load forecast. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EBE7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1C4444]/70">Generating your skin forecast...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4EBE7]">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl p-8">
              <div className="text-6xl mb-4">🔮</div>
              <h1 className="text-2xl font-medium text-[#1C4444] mb-2">
                Your Skin Forecast
              </h1>
              <p className="text-[#1C4444]/70 mb-6">{error}</p>

              {error.includes('log in') ? (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/skin-analysis"
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    Start Analysis (Guest)
                  </Link>
                </div>
              ) : (
                <Link
                  href="/skin-analysis"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <span>📷</span> Get Your First Analysis
                </Link>
              )}
            </div>

            <div className="mt-8 text-left bg-white rounded-xl p-6">
              <h3 className="font-medium text-[#1C4444] mb-4 flex items-center gap-2">
                <span>✨</span> What You&apos;ll Get
              </h3>
              <ul className="space-y-3 text-sm text-[#1C4444]/70">
                <li className="flex items-start gap-3">
                  <span className="text-lg">📈</span>
                  <div>
                    <p className="font-medium text-[#1C4444]">90-Day Projections</p>
                    <p>See how your skin age and health will improve</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">⏰</span>
                  <div>
                    <p className="font-medium text-[#1C4444]">Condition Clearance</p>
                    <p>Know when acne, dark spots, and dryness will clear</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-medium text-[#1C4444]">Personalized Warnings</p>
                    <p>Seasonal alerts and product interaction cautions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="font-medium text-[#1C4444]">Smart Recommendations</p>
                    <p>Actionable tips to accelerate your progress</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.forecast) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Header */}
      <section className="py-8 md:py-12 border-b border-[#1C4444]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/skin-analysis/history"
              className="inline-flex items-center gap-2 text-[#1C4444]/60 hover:text-[#1C4444] text-sm mb-4"
            >
              ← Back to History
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1C4444]/10 rounded-full text-xs text-[#1C4444] mb-2">
                  <span>🔮</span>
                  <span>AI-Powered Predictions</span>
                </div>
                <h1 className="text-3xl font-medium text-[#1C4444]">
                  Your Skin Forecast
                </h1>
                <p className="text-[#1C4444]/60 mt-1">
                  Personalized 90-day predictions based on your skin history
                </p>
              </div>
              <div className="text-sm text-[#1C4444]/60">
                <p>Last analysis: {new Date(data.latestAnalysisDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</p>
                {data.skinType && (
                  <p className="capitalize">Skin type: {data.skinType}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forecast Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <SkinForecastView forecast={data.forecast} skinType={data.skinType} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 border-t border-[#1C4444]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-medium text-[#1C4444] mb-4 text-center">
              How Your Forecast Works
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-[#1C4444] text-sm mb-1">Historical Analysis</h4>
                <p className="text-xs text-[#1C4444]/60">
                  We analyze your past skin analyses to identify trends
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🧬</div>
                <h4 className="font-medium text-[#1C4444] text-sm mb-1">Condition Science</h4>
                <p className="text-xs text-[#1C4444]/60">
                  Each condition has known improvement rates with proper care
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-[#1C4444] text-sm mb-1">Personalized Factors</h4>
                <p className="text-xs text-[#1C4444]/60">
                  Your consistency and skin type affect your unique forecast
                </p>
              </div>
            </div>
            <p className="text-center text-xs text-[#1C4444]/50 mt-4">
              Forecasts improve with more analyses. Analyze weekly for best predictions.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
