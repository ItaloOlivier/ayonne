'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// Types
interface SkinStoryData {
  user: {
    firstName: string
    memberSince: string
    skinType?: string
  }
  journey: {
    chapter: 1 | 2 | 3
    chapterProgress: number // 0-100
    daysInJourney: number
  }
  scores: {
    skinAge: number
    achievableSkinAge: number
    healthScore: number
    previousHealthScore?: number
  }
  streak: {
    current: number
    longest: number
    atRisk: boolean
  }
  rewards: {
    activeDiscounts: Array<{
      code: string
      percentage: number
      expiresAt: string
    }>
    nextReward: {
      name: string
      progress: number
      target: number
    }
    referralTier: 'bronze' | 'silver' | 'gold' | 'platinum'
    referralCount: number
  }
  nextAction: {
    type: 'analyze' | 'challenge' | 'share' | 'refer'
    label: string
    sublabel: string
  }
  forecast?: {
    projectedSkinAge: number
    daysToGoal: number
  }
}

interface MySkinStoryProps {
  data: SkinStoryData
}

export default function MySkinStory({ data }: MySkinStoryProps) {
  const [mounted, setMounted] = useState(false)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  if (!mounted) return <MySkinStorySkeleton />

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Elegant Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C4444] via-[#1C4444] to-[#2a5858]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        </div>

        <div className="relative px-6 pt-8 pb-12">
          {/* Greeting */}
          <div className="animate-elegant-fade-in">
            <p className="text-white/60 text-sm tracking-widest uppercase mb-1">
              {greeting}
            </p>
            <h1 className="text-white text-2xl font-light">
              {data.user.firstName}
            </h1>
          </div>

          {/* Chapter Progress */}
          <div className="mt-8 animate-elegant-fade-in" style={{ animationDelay: '100ms' }}>
            <ChapterIndicator
              chapter={data.journey.chapter}
              progress={data.journey.chapterProgress}
              daysInJourney={data.journey.daysInJourney}
            />
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable Feed */}
      <main className="relative -mt-4 rounded-t-3xl bg-[#F4EBE7] pt-6 pb-24">
        <div className="px-6 space-y-6">

          {/* Today's Card */}
          <section className="animate-elegant-fade-in" style={{ animationDelay: '200ms' }}>
            <TodayCard
              scores={data.scores}
              streak={data.streak}
              nextAction={data.nextAction}
            />
          </section>

          {/* Forecast Widget */}
          {data.forecast && (
            <section className="animate-elegant-fade-in" style={{ animationDelay: '300ms' }}>
              <ForecastWidget forecast={data.forecast} currentAge={data.scores.skinAge} />
            </section>
          )}

          {/* Reward Path */}
          <section className="animate-elegant-fade-in" style={{ animationDelay: '400ms' }}>
            <RewardPath rewards={data.rewards} />
          </section>

          {/* Quick Actions */}
          <section className="animate-elegant-fade-in" style={{ animationDelay: '500ms' }}>
            <QuickActions />
          </section>

        </div>
      </main>
    </div>
  )
}

// Chapter Progress Indicator
function ChapterIndicator({
  chapter,
  progress,
  daysInJourney
}: {
  chapter: 1 | 2 | 3
  progress: number
  daysInJourney: number
}) {
  const chapters = [
    { num: 1, name: 'Discovery', description: 'Begin your journey' },
    { num: 2, name: 'Transformation', description: '30-day challenge' },
    { num: 3, name: 'Mastery', description: 'Maintain your glow' },
  ]

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[#D4AF37] text-xs tracking-widest uppercase font-medium">
            Your Skin Story
          </p>
          <h2 className="text-white text-lg mt-1">
            Chapter {chapter}: {chapters[chapter - 1].name}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs">Day</p>
          <p className="text-white text-2xl font-light">{daysInJourney}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Chapter dots */}
      <div className="flex justify-between mt-4">
        {chapters.map((ch) => (
          <div key={ch.num} className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                ch.num < chapter
                  ? 'bg-[#D4AF37]'
                  : ch.num === chapter
                    ? 'bg-white ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#1C4444]'
                    : 'bg-white/30'
              }`}
            />
            <p className={`text-xs mt-2 ${ch.num <= chapter ? 'text-white' : 'text-white/40'}`}>
              {ch.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Today's Status Card
function TodayCard({
  scores,
  streak,
  nextAction
}: {
  scores: SkinStoryData['scores']
  streak: SkinStoryData['streak']
  nextAction: SkinStoryData['nextAction']
}) {
  const improvement = scores.previousHealthScore
    ? scores.healthScore - scores.previousHealthScore
    : 0

  return (
    <div className="bg-white rounded-2xl shadow-luxury overflow-hidden">
      {/* Scores Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#1C4444]/60 text-xs tracking-widest uppercase">
            Your Skin Today
          </h3>
          {streak.current > 0 && (
            <StreakBadge current={streak.current} atRisk={streak.atRisk} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Skin Age */}
          <div className="text-center">
            <div className="relative inline-block">
              <VitalityRing age={scores.skinAge} achievable={scores.achievableSkinAge} />
            </div>
            <p className="text-[#1C4444]/60 text-sm mt-3">Skin Vitality</p>
            <p className="text-[#1C4444] text-xs mt-1">
              {scores.achievableSkinAge < scores.skinAge && (
                <span className="text-[#D4AF37]">
                  → {scores.achievableSkinAge} achievable
                </span>
              )}
            </p>
          </div>

          {/* Health Score */}
          <div className="text-center">
            <div className="relative inline-block">
              <HealthRing score={scores.healthScore} />
            </div>
            <p className="text-[#1C4444]/60 text-sm mt-3">Skin Health</p>
            {improvement !== 0 && (
              <p className={`text-xs mt-1 ${improvement > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {improvement > 0 ? '+' : ''}{improvement} from last
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider with gold accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

      {/* Action Button */}
      <Link
        href={nextAction.type === 'analyze' ? '/skin-analysis' : `/${nextAction.type}`}
        className="block p-5 hover:bg-[#F4EBE7]/50 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#1C4444] font-medium">{nextAction.label}</p>
            <p className="text-[#1C4444]/60 text-sm">{nextAction.sublabel}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#1C4444] flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  )
}

// Vitality Ring (Skin Age)
function VitalityRing({ age, achievable }: { age: number; achievable: number }) {
  const improvement = age - achievable
  const progressPercent = Math.min(100, Math.max(0, 100 - (age - 20) * 2))

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="#F4EBE7"
          strokeWidth="6"
        />
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="url(#vitalityGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progressPercent * 2.64} 264`}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="vitalityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1C4444" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-light text-[#1C4444]">{age}</span>
        {improvement > 0 && (
          <span className="text-xs text-[#D4AF37] -mt-1">-{improvement} possible</span>
        )}
      </div>
    </div>
  )
}

// Health Score Ring
function HealthRing({ score }: { score: number }) {
  const color = score >= 80 ? '#1C4444' : score >= 60 ? '#2d6a6a' : score >= 40 ? '#8B7355' : '#A67C52'

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="#F4EBE7"
          strokeWidth="6"
        />
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${score * 2.64} 264`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-light text-[#1C4444]">{score}</span>
        <span className="text-xs text-[#1C4444]/60">/100</span>
      </div>
    </div>
  )
}

// Streak Badge
function StreakBadge({ current, atRisk }: { current: number; atRisk: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
      atRisk
        ? 'bg-amber-50 text-amber-700 animate-pulse'
        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
    }`}>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.526 1.394-4.792 3.5-6.217-.056.366-.086.74-.086 1.122 0 2.126.813 4.065 2.143 5.52.274.3.664.41 1.024.29.36-.12.645-.42.748-.79.103-.37.042-.77-.16-1.09A5.965 5.965 0 0111 12c0-.878.188-1.715.526-2.469.341-.758.832-1.437 1.444-1.994.615.557 1.104 1.237 1.445 1.995.338.754.526 1.59.526 2.469 0 .987-.238 1.918-.661 2.739-.203.32-.264.72-.16 1.09.103.37.388.67.748.79.36.12.75.01 1.024-.29A7.945 7.945 0 0017 12c0-.382-.03-.756-.086-1.122C18.606 12.208 20 14.474 20 17c0 3.866-3.134 7-7 7z"/>
      </svg>
      <span className="text-sm font-medium">{current}</span>
      {atRisk && <span className="text-xs">at risk!</span>}
    </div>
  )
}

// Forecast Widget
function ForecastWidget({
  forecast,
  currentAge
}: {
  forecast: SkinStoryData['forecast']
  currentAge: number
}) {
  if (!forecast) return null

  const improvement = currentAge - forecast.projectedSkinAge

  return (
    <div className="bg-gradient-to-br from-[#1C4444] to-[#2a5858] rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs tracking-widest uppercase text-white/60">90-Day Forecast</span>
          </div>
          <p className="text-sm text-white/80">
            On track to achieve
          </p>
          <p className="text-3xl font-light mt-1">
            <span className="text-[#D4AF37]">{forecast.projectedSkinAge}</span>
            <span className="text-lg text-white/60 ml-1">skin age</span>
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-sm">{improvement} years</span>
          </div>
          <p className="text-xs text-white/40 mt-2">{forecast.daysToGoal} days to go</p>
        </div>
      </div>

      <Link
        href="/skin-forecast"
        className="mt-4 block text-center py-2 border border-white/20 rounded-lg text-sm hover:bg-white/10 transition-colors"
      >
        View Full Forecast
      </Link>
    </div>
  )
}

// Reward Path
function RewardPath({ rewards }: { rewards: SkinStoryData['rewards'] }) {
  const tierColors = {
    bronze: 'from-amber-600 to-amber-700',
    silver: 'from-gray-400 to-gray-500',
    gold: 'from-[#D4AF37] to-[#B8960C]',
    platinum: 'from-purple-400 to-purple-600',
  }

  return (
    <div className="bg-white rounded-2xl shadow-luxury p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1C4444]/60 text-xs tracking-widest uppercase">
          Your Rewards
        </h3>
        <div className={`px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r ${tierColors[rewards.referralTier]}`}>
          {rewards.referralTier.charAt(0).toUpperCase() + rewards.referralTier.slice(1)} Tier
        </div>
      </div>

      {/* Active Discounts */}
      {rewards.activeDiscounts.length > 0 && (
        <div className="space-y-2 mb-4">
          {rewards.activeDiscounts.slice(0, 2).map((discount, i) => (
            <DiscountCard key={i} discount={discount} />
          ))}
        </div>
      )}

      {/* Next Reward Progress */}
      <div className="bg-[#F4EBE7] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#1C4444]">{rewards.nextReward.name}</span>
          <span className="text-xs text-[#1C4444]/60">
            {rewards.nextReward.progress}/{rewards.nextReward.target}
          </span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1C4444] to-[#D4AF37] rounded-full transition-all duration-500"
            style={{ width: `${(rewards.nextReward.progress / rewards.nextReward.target) * 100}%` }}
          />
        </div>
      </div>

      {/* Referral CTA */}
      <Link
        href="/account#referrals"
        className="mt-4 flex items-center justify-between p-3 border border-[#1C4444]/10 rounded-xl hover:border-[#D4AF37]/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F4EBE7] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1C4444]">Refer Friends</p>
            <p className="text-xs text-[#1C4444]/60">{rewards.referralCount} referrals • Earn up to 30% off</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-[#1C4444]/40 group-hover:text-[#D4AF37] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

// Discount Card
function DiscountCard({ discount }: { discount: SkinStoryData['rewards']['activeDiscounts'][0] }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const expires = new Date(discount.expiresAt)
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeLeft(`${days}d left`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`)
      } else {
        setTimeLeft(`${minutes}m left`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [discount.expiresAt])

  const isUrgent = timeLeft.includes('m left') && !timeLeft.includes('h')

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${
      isUrgent ? 'border-amber-300 bg-amber-50' : 'border-[#D4AF37]/30 bg-[#D4AF37]/5'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
          isUrgent ? 'bg-amber-500 animate-pulse' : 'bg-gradient-to-br from-[#D4AF37] to-[#B8960C]'
        }`}>
          {discount.percentage}%
        </div>
        <div>
          <p className="text-sm font-medium text-[#1C4444]">{discount.code}</p>
          <p className={`text-xs ${isUrgent ? 'text-amber-600 font-medium' : 'text-[#1C4444]/60'}`}>
            {timeLeft}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(discount.code)}
        className="px-3 py-1.5 text-xs font-medium text-[#1C4444] border border-[#1C4444]/20 rounded-lg hover:bg-[#1C4444] hover:text-white transition-colors"
      >
        Copy
      </button>
    </div>
  )
}

// Quick Actions Grid
function QuickActions() {
  const actions = [
    { href: '/skin-analysis', icon: CameraIcon, label: 'Analyze', color: 'bg-[#1C4444]' },
    { href: '/challenge', icon: TrophyIcon, label: 'Challenge', color: 'bg-[#D4AF37]' },
    { href: '/skin-analysis/history', icon: ChartIcon, label: 'Progress', color: 'bg-[#2d6a6a]' },
    { href: '/routine-checker', icon: BeakerIcon, label: 'Routine', color: 'bg-[#8B7355]' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-luxury hover:shadow-luxury-lg hover:-translate-y-1 transition-all"
        >
          <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
            <action.icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs text-[#1C4444]/80">{action.label}</span>
        </Link>
      ))}
    </div>
  )
}

// Icons
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )
}

// Loading Skeleton
function MySkinStorySkeleton() {
  return (
    <div className="min-h-screen bg-[#F4EBE7] animate-pulse">
      <div className="h-64 bg-[#1C4444]" />
      <div className="px-6 -mt-4 space-y-6">
        <div className="bg-white rounded-2xl h-64" />
        <div className="bg-white rounded-2xl h-40" />
        <div className="bg-white rounded-2xl h-48" />
      </div>
    </div>
  )
}
