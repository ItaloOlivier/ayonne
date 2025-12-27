'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StreakCounter, { calculateStreak } from './StreakCounter'
import AchievementBadges, { Achievement, computeAchievements } from './AchievementBadges'
import SkinHealthScore from './SkinHealthScore'

interface DashboardData {
  customer: {
    firstName: string
    lastName: string | null
  }
  stats: {
    totalAnalyses: number
    currentScore: number
    firstScore: number
    bestScore: number
    lastAnalysisDate: string | null
  }
  analysisDates: string[]
  recentConditions: Array<{
    id: string
    name: string
    trend: 'improving' | 'stable' | 'worsening'
  }>
  goals: Array<{
    id: string
    name: string
    progress: number
    target: number
  }>
}

interface PersonalizedDashboardProps {
  data: DashboardData
}

export default function PersonalizedDashboard({ data }: PersonalizedDashboardProps) {
  const [greeting, setGreeting] = useState('')
  const [motivationalMessage, setMotivationalMessage] = useState('')

  const streak = calculateStreak(data.analysisDates)
  const achievements = computeAchievements({
    analysisCount: data.stats.totalAnalyses,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    currentScore: data.stats.currentScore,
    firstScore: data.stats.firstScore,
    analysisTimes: data.analysisDates,
  })

  const improvement = data.stats.currentScore - data.stats.firstScore

  useEffect(() => {
    // Time-based greeting
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    // Motivational messages based on user progress
    const messages = [
      improvement > 10 ? `Amazing progress! Your skin has improved ${improvement} points!` : null,
      streak.current >= 7 ? `You're on fire! ${streak.current} day streak!` : null,
      data.stats.totalAnalyses === 1 ? 'Great start! Track your skin daily for best results.' : null,
      data.stats.currentScore >= 80 ? 'Your skin is glowing! Keep up the great work!' : null,
      improvement > 0 ? 'Your skincare routine is working. Keep it up!' : null,
      'Every day is a step towards healthier skin.',
    ].filter(Boolean)

    setMotivationalMessage(messages[0] || messages[messages.length - 1] || '')
  }, [improvement, streak.current, data.stats.totalAnalyses, data.stats.currentScore])

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#1C4444] to-[#2d6a6a] text-white rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium mb-1">
              {greeting}, {data.customer.firstName}!
            </h2>
            <p className="text-white/80">{motivationalMessage}</p>
          </div>
          <Link
            href="/skin-analysis"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#1C4444] rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            New Analysis
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Score */}
        <div className="bg-white rounded-xl p-4 text-center">
          <SkinHealthScore
            score={data.stats.currentScore}
            size="sm"
            showLabel={false}
          />
          <p className="text-sm text-[#1C4444]/60 mt-2">Current Score</p>
          {improvement > 0 && (
            <p className="text-xs text-green-600 mt-1">+{improvement} from start</p>
          )}
        </div>

        {/* Streak */}
        <StreakCounter
          currentStreak={streak.current}
          longestStreak={streak.longest}
          lastAnalysisDate={streak.lastDate}
          size="sm"
        />

        {/* Total Analyses */}
        <div className="bg-white rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-[#1C4444]">{data.stats.totalAnalyses}</div>
          <p className="text-sm text-[#1C4444]/60 mt-1">Total Analyses</p>
        </div>

        {/* Best Score */}
        <div className="bg-white rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-[#1C4444]">{data.stats.bestScore}</div>
          <p className="text-sm text-[#1C4444]/60 mt-1">Best Score</p>
        </div>
      </div>

      {/* Progress Goals */}
      {data.goals.length > 0 && (
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-medium text-[#1C4444] mb-4">Your Goals</h3>
          <div className="space-y-4">
            {data.goals.map(goal => {
              const progressPercent = Math.min(100, (goal.progress / goal.target) * 100)
              const isComplete = progressPercent >= 100

              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#1C4444]">{goal.name}</span>
                    <span className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-[#1C4444]/60'}`}>
                      {isComplete ? 'Complete!' : `${goal.progress}/${goal.target}`}
                    </span>
                  </div>
                  <div className="h-2 bg-[#1C4444]/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-green-500' : 'bg-[#1C4444]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Condition Trends */}
      {data.recentConditions.length > 0 && (
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-medium text-[#1C4444] mb-4">Skin Condition Trends</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recentConditions.map(condition => (
              <div
                key={condition.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#F4EBE7]"
              >
                <span className="text-sm text-[#1C4444]">{condition.name}</span>
                <TrendIndicator trend={condition.trend} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-[#1C4444]">Achievements</h3>
          <span className="text-sm text-[#1C4444]/60">
            {achievements.filter(a => a.unlockedAt).length} unlocked
          </span>
        </div>
        <AchievementBadges achievements={achievements} showLocked={true} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/skin-analysis/history"
          className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[#1C4444]">View History</p>
            <p className="text-xs text-[#1C4444]/60">See all analyses</p>
          </div>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[#1C4444]">Shop Products</p>
            <p className="text-xs text-[#1C4444]/60">Browse skincare</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Trend indicator component
function TrendIndicator({ trend }: { trend: 'improving' | 'stable' | 'worsening' }) {
  const config = {
    improving: { color: 'text-green-600 bg-green-100', icon: '↗', label: 'Improving' },
    stable: { color: 'text-blue-600 bg-blue-100', icon: '→', label: 'Stable' },
    worsening: { color: 'text-amber-600 bg-amber-100', icon: '↘', label: 'Needs attention' },
  }

  const { color, icon, label } = config[trend]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

// Daily reminder component
export function DailyReminder({ lastAnalysisDate }: { lastAnalysisDate: string | null }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const today = new Date().toDateString()
  const lastDate = lastAnalysisDate ? new Date(lastAnalysisDate).toDateString() : null

  // Don't show if already analyzed today
  if (lastDate === today) return null

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">⏰</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-900">Time for your daily skin check!</p>
          <p className="text-sm text-amber-700 mt-1">
            Track your skin daily to see improvements and maintain your streak.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Link
              href="/skin-analysis"
              className="inline-flex items-center gap-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Analyze Now
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-amber-700 hover:text-amber-900"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
