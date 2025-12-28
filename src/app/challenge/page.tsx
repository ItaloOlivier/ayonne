'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ChallengeProgress from '@/components/growth/ChallengeProgress'
import TransformationReveal from '@/components/growth/TransformationReveal'

interface ChallengeData {
  enrolled: boolean
  canJoin?: boolean
  status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  dayInChallenge?: number
  daysRemaining?: number
  progressPercent?: number
  completedCheckpoints?: number
  totalCheckpoints?: number
  checkpoints?: Array<{
    day: number
    completed: boolean
    completedAt: string | null
    badgeEarned: string | null
    rewardCode: string | null
    healthScore: number | null
    skinAge: number | null
  }>
  baselineAnalysisId?: string
  baselineHealthScore?: number
  baselineSkinAge?: number
  finalAnalysisId?: string
  finalHealthScore?: number
  finalSkinAge?: number
  improvement?: {
    healthScore: number
    skinAge: number
  }
  nextCheckpoint?: {
    day: number
    dueDate: string
    daysUntil: number | null
    label: string
  } | null
  badges?: Array<{
    name: string
    day: number
    earnedAt: string
  }>
  completionRewardCode?: string | null
  shareRewardCode?: string | null
  transformationShared?: boolean
}

const CHALLENGE_MILESTONES = [
  {
    day: 1,
    title: 'Day 1: Your Starting Point',
    description: 'Take your first analysis to establish your baseline scores.',
    reward: null,
    badge: 'Challenge Started',
  },
  {
    day: 7,
    title: 'Day 7: First Check-in',
    description: 'See your first week of progress. Most people notice subtle improvements!',
    reward: '10% off',
    badge: 'Week Warrior',
  },
  {
    day: 14,
    title: 'Day 14: Midpoint',
    description: 'Halfway there! Your skin is adapting to your new routine.',
    reward: '15% off',
    badge: 'Halfway Hero',
  },
  {
    day: 21,
    title: 'Day 21: The Push',
    description: 'This is where the magic happens. The biggest improvements often come now.',
    reward: null,
    badge: 'Glow Getter',
  },
  {
    day: 30,
    title: 'Day 30: Transformation',
    description: 'Your final analysis reveals your complete transformation!',
    reward: '25% off',
    badge: 'Glow Master',
  },
]

export default function ChallengePage() {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTransformation, setShowTransformation] = useState(false)
  const [baselineImage, setBaselineImage] = useState<string>('')
  const [finalImage, setFinalImage] = useState<string>('')

  useEffect(() => {
    fetchChallengeData()
  }, [])

  const fetchChallengeData = async () => {
    try {
      const res = await fetch('/api/challenge/status')
      const data = await res.json()
      if (data.success) {
        setChallengeData(data)

        // Fetch images if completed
        if (data.status === 'COMPLETED' && data.baselineAnalysisId && data.finalAnalysisId) {
          fetchAnalysisImages(data.baselineAnalysisId, data.finalAnalysisId)
        }
      }
    } catch (error) {
      console.error('Failed to fetch challenge data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalysisImages = async (baselineId: string, finalId: string) => {
    try {
      const [baselineRes, finalRes] = await Promise.all([
        fetch(`/api/skin-analysis/${baselineId}`),
        fetch(`/api/skin-analysis/${finalId}`),
      ])

      const [baselineData, finalData] = await Promise.all([
        baselineRes.json(),
        finalRes.json(),
      ])

      if (baselineData.analysis?.originalImage) {
        setBaselineImage(baselineData.analysis.originalImage)
      }
      if (finalData.analysis?.originalImage) {
        setFinalImage(finalData.analysis.originalImage)
      }
    } catch (error) {
      console.error('Failed to fetch analysis images:', error)
    }
  }

  const handleShare = async () => {
    try {
      const res = await fetch('/api/challenge/share', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        fetchChallengeData()
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EBE7]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#1C4444]/10 rounded w-1/3" />
            <div className="h-64 bg-[#1C4444]/10 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-[#1C4444] mb-2">
            30-Day Glow Challenge
          </h1>
          <p className="text-[#1C4444]/70">
            Transform your skin in 30 days with personalized tracking and exclusive rewards
          </p>
        </div>

        {challengeData?.enrolled ? (
          // Enrolled view
          <div className="space-y-6">
            {/* Progress card */}
            <ChallengeProgress />

            {/* Completed challenge - view transformation */}
            {challengeData.status === 'COMPLETED' && (
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8962F] rounded-2xl p-6 text-center">
                <h2 className="text-xl font-medium text-[#1C4444] mb-2">
                  Congratulations, Glow Master!
                </h2>
                <p className="text-[#1C4444]/70 mb-4">
                  You completed the 30-day challenge. View your transformation!
                </p>
                <button
                  onClick={() => setShowTransformation(true)}
                  className="bg-[#1C4444] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2D5A5A] transition-colors"
                >
                  View My Transformation
                </button>
              </div>
            )}

            {/* Active challenge - milestone guide */}
            {challengeData.status === 'ACTIVE' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-medium text-[#1C4444] mb-4">
                  Your Journey
                </h2>

                <div className="space-y-4">
                  {CHALLENGE_MILESTONES.map((milestone) => {
                    const checkpoint = challengeData.checkpoints?.find(
                      (cp) => cp.day === milestone.day
                    )
                    const isCompleted = checkpoint?.completed
                    const isCurrent = challengeData.nextCheckpoint?.day === milestone.day
                    const isPast = (challengeData.dayInChallenge || 0) > milestone.day

                    return (
                      <div
                        key={milestone.day}
                        className={`flex gap-4 p-4 rounded-xl transition-colors ${
                          isCompleted
                            ? 'bg-[#D4AF37]/10'
                            : isCurrent
                            ? 'bg-[#1C4444]/5 ring-2 ring-[#1C4444]/20'
                            : 'bg-gray-50'
                        }`}
                      >
                        {/* Day indicator */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? 'bg-[#D4AF37] text-[#1C4444]'
                              : isCurrent
                              ? 'bg-[#1C4444] text-white'
                              : 'bg-[#1C4444]/10 text-[#1C4444]/40'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="font-medium">{milestone.day}</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3
                                className={`font-medium ${
                                  isCompleted || isCurrent
                                    ? 'text-[#1C4444]'
                                    : 'text-[#1C4444]/50'
                                }`}
                              >
                                {milestone.title}
                              </h3>
                              <p
                                className={`text-sm mt-1 ${
                                  isCompleted || isCurrent
                                    ? 'text-[#1C4444]/70'
                                    : 'text-[#1C4444]/40'
                                }`}
                              >
                                {milestone.description}
                              </p>
                            </div>

                            {milestone.reward && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                  isCompleted
                                    ? 'bg-[#D4AF37] text-[#1C4444]'
                                    : 'bg-[#1C4444]/10 text-[#1C4444]/50'
                                }`}
                              >
                                {milestone.reward}
                              </span>
                            )}
                          </div>

                          {/* Completed checkpoint info */}
                          {isCompleted && checkpoint && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {checkpoint.badgeEarned && (
                                <span className="text-xs bg-[#D4AF37]/20 text-[#9A8428] px-2 py-1 rounded-full">
                                  🏆 {checkpoint.badgeEarned}
                                </span>
                              )}
                              {checkpoint.healthScore !== null && (
                                <span className="text-xs bg-[#1C4444]/10 text-[#1C4444] px-2 py-1 rounded-full">
                                  Score: {checkpoint.healthScore}
                                </span>
                              )}
                              {checkpoint.rewardCode && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Code: {checkpoint.rewardCode}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Current checkpoint CTA */}
                          {isCurrent && !isCompleted && (
                            <Link
                              href="/skin-analysis"
                              className="inline-block mt-3 text-sm bg-[#1C4444] text-white px-4 py-2 rounded-lg hover:bg-[#2D5A5A] transition-colors"
                            >
                              Take Analysis Now
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tips section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-medium text-[#1C4444] mb-4">
                Tips for Success
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span>📸</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1C4444] text-sm">Consistent Lighting</h3>
                    <p className="text-xs text-[#1C4444]/60">
                      Take photos in the same spot with similar lighting for accurate comparisons.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span>⏰</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1C4444] text-sm">Same Time of Day</h3>
                    <p className="text-xs text-[#1C4444]/60">
                      Morning analyses (before makeup) give the most consistent results.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span>💧</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1C4444] text-sm">Stay Hydrated</h3>
                    <p className="text-xs text-[#1C4444]/60">
                      Drinking water improves skin health and shows in your scores.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span>🌙</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1C4444] text-sm">Quality Sleep</h3>
                    <p className="text-xs text-[#1C4444]/60">
                      7-8 hours of sleep helps your skin repair and regenerate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Not enrolled view
          <div className="space-y-8">
            {/* Hero section */}
            <div className="bg-gradient-to-br from-[#1C4444] to-[#2D5A5A] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative max-w-xl">
                <div className="text-[#D4AF37] text-xs tracking-[0.2em] uppercase mb-4">
                  Limited Time Challenge
                </div>
                <h2 className="text-3xl md:text-4xl font-light mb-4">
                  Transform Your Skin in 30 Days
                </h2>
                <p className="text-white/80 mb-6">
                  Join thousands who have achieved visible skin improvement with our guided
                  30-day program. Track your progress, earn rewards, and see real results.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="bg-white/10 px-4 py-2 rounded-full text-sm">
                    ✓ Weekly check-ins
                  </span>
                  <span className="bg-white/10 px-4 py-2 rounded-full text-sm">
                    ✓ Up to 35% in discounts
                  </span>
                  <span className="bg-white/10 px-4 py-2 rounded-full text-sm">
                    ✓ Exclusive badges
                  </span>
                </div>

                <Link
                  href="/skin-analysis"
                  className="inline-block bg-[#D4AF37] text-[#1C4444] px-8 py-4 rounded-xl font-medium hover:bg-[#E5C048] transition-colors"
                >
                  Start Your Challenge
                </Link>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-light text-[#1C4444] text-center mb-8">
                How It Works
              </h2>

              <div className="grid md:grid-cols-5 gap-4">
                {CHALLENGE_MILESTONES.map((milestone, i) => (
                  <div key={milestone.day} className="text-center relative">
                    {/* Connection line */}
                    {i < CHALLENGE_MILESTONES.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-[#1C4444]/10" />
                    )}

                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#1C4444] text-white flex items-center justify-center mx-auto mb-3 relative z-10">
                        {milestone.day}
                      </div>
                      <h3 className="font-medium text-[#1C4444] text-sm mb-1">
                        Day {milestone.day}
                      </h3>
                      <p className="text-xs text-[#1C4444]/60 mb-2">
                        {milestone.day === 1
                          ? 'Baseline'
                          : milestone.day === 30
                          ? 'Final'
                          : `Week ${Math.ceil(milestone.day / 7)}`}
                      </p>
                      {milestone.reward && (
                        <span className="text-xs bg-[#D4AF37]/10 text-[#9A8428] px-2 py-1 rounded-full">
                          {milestone.reward}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards breakdown */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏆</span>
                </div>
                <h3 className="font-medium text-[#1C4444] mb-2">Complete Challenge</h3>
                <p className="text-3xl font-light text-[#D4AF37] mb-2">25% OFF</p>
                <p className="text-sm text-[#1C4444]/60">
                  Finish all 30 days and earn your biggest discount
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📸</span>
                </div>
                <h3 className="font-medium text-[#1C4444] mb-2">Share Transformation</h3>
                <p className="text-3xl font-light text-[#D4AF37] mb-2">+10% OFF</p>
                <p className="text-sm text-[#1C4444]/60">
                  Share your before/after and stack another discount
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎁</span>
                </div>
                <h3 className="font-medium text-[#1C4444] mb-2">Refer a Friend</h3>
                <p className="text-3xl font-light text-[#D4AF37] mb-2">FREE</p>
                <p className="text-sm text-[#1C4444]/60">
                  Get a free product sample when a friend joins
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center py-8">
              <p className="text-[#1C4444]/60 mb-4">
                Ready to see what 30 days can do for your skin?
              </p>
              <Link
                href="/skin-analysis"
                className="inline-block bg-[#1C4444] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#2D5A5A] transition-colors"
              >
                Take Your First Analysis
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Transformation reveal modal */}
      {showTransformation &&
        challengeData?.status === 'COMPLETED' &&
        challengeData.completionRewardCode &&
        baselineImage &&
        finalImage && (
          <TransformationReveal
            baselineImage={baselineImage}
            finalImage={finalImage}
            baselineHealthScore={challengeData.baselineHealthScore || 0}
            finalHealthScore={challengeData.finalHealthScore || 0}
            baselineSkinAge={challengeData.baselineSkinAge || 0}
            finalSkinAge={challengeData.finalSkinAge || 0}
            completionRewardCode={challengeData.completionRewardCode}
            onShare={handleShare}
            onClose={() => setShowTransformation(false)}
            shareRewardEarned={challengeData.transformationShared}
            shareRewardCode={challengeData.shareRewardCode || undefined}
          />
        )}
    </div>
  )
}
