'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Checkpoint {
  day: number
  completed: boolean
  completedAt: string | null
  badgeEarned: string | null
  rewardCode: string | null
  healthScore: number | null
  skinAge: number | null
}

interface ChallengeStatus {
  enrolled: boolean
  canJoin?: boolean
  status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  dayInChallenge?: number
  daysRemaining?: number
  progressPercent?: number
  completedCheckpoints?: number
  totalCheckpoints?: number
  checkpoints?: Checkpoint[]
  baselineHealthScore?: number
  baselineSkinAge?: number
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

interface ChallengeProgressProps {
  compact?: boolean
  onJoinClick?: () => void
}

const CHECKPOINT_LABELS: Record<number, { label: string; icon: string }> = {
  1: { label: 'Start', icon: '🌱' },
  7: { label: 'Week 1', icon: '⭐' },
  14: { label: 'Midpoint', icon: '🔥' },
  21: { label: 'Push', icon: '💪' },
  30: { label: 'Transform', icon: '✨' },
}

export default function ChallengeProgress({ compact = false, onJoinClick }: ChallengeProgressProps) {
  const [status, setStatus] = useState<ChallengeStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/challenge/status')
      const data = await res.json()
      if (data.success) {
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch challenge status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-[#1C4444]/5 rounded-2xl p-6">
        <div className="h-6 bg-[#1C4444]/10 rounded w-1/3 mb-4" />
        <div className="h-4 bg-[#1C4444]/10 rounded w-2/3" />
      </div>
    )
  }

  if (!status?.enrolled) {
    return <ChallengeInvite onJoin={onJoinClick} canJoin={status?.canJoin ?? true} />
  }

  if (compact) {
    return <CompactProgress status={status} />
  }

  return <FullProgress status={status} onRefresh={fetchStatus} />
}

function ChallengeInvite({ onJoin, canJoin }: { onJoin?: () => void; canJoin: boolean }) {
  return (
    <div className="bg-gradient-to-br from-[#1C4444] to-[#2D5A5A] rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">✨</span>
          <h3 className="text-lg font-medium">30-Day Glow Challenge</h3>
        </div>

        <p className="text-white/80 text-sm mb-4">
          Transform your skin in 30 days. Track your progress, earn rewards, and see real results.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs">25% off on completion</span>
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs">Exclusive badges</span>
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs">Progress tracking</span>
        </div>

        {canJoin ? (
          <button
            onClick={onJoin}
            className="w-full bg-[#D4AF37] text-[#1C4444] py-3 rounded-xl font-medium hover:bg-[#E5C048] transition-colors"
          >
            Start My Challenge
          </button>
        ) : (
          <Link
            href="/challenge"
            className="block w-full bg-white/10 text-center py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            View Challenge Details
          </Link>
        )}
      </div>
    </div>
  )
}

function CompactProgress({ status }: { status: ChallengeStatus }) {
  const progressPercent = status.progressPercent || 0

  return (
    <Link href="/challenge" className="block">
      <div className="bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="font-medium text-sm">Glow Challenge</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            Day {status.dayInChallenge}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/70">
          <span>
            {status.completedCheckpoints}/{status.totalCheckpoints} checkpoints
          </span>
          {status.nextCheckpoint && (
            <span>
              Next: {status.nextCheckpoint.label} in {status.nextCheckpoint.daysUntil}d
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function FullProgress({ status, onRefresh }: { status: ChallengeStatus; onRefresh: () => void }) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const handleShare = async () => {
    setShareLoading(true)
    try {
      const res = await fetch('/api/challenge/share', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        onRefresh()
        // Copy share link
        const shareUrl = `${window.location.origin}/challenge?ref=transformation`
        await navigator.clipboard.writeText(shareUrl)
        alert(`Earned ${data.rewardPercent}% off! Share link copied.`)
      }
    } catch (error) {
      console.error('Share failed:', error)
    } finally {
      setShareLoading(false)
      setShowShareModal(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-medium">30-Day Glow Challenge</h2>
            <p className="text-white/70 text-sm">
              {status.status === 'COMPLETED'
                ? 'Challenge Complete!'
                : `Day ${status.dayInChallenge} of 30`}
            </p>
          </div>
          {status.status === 'ACTIVE' && (
            <div className="text-right">
              <div className="text-2xl font-light">{status.daysRemaining}</div>
              <div className="text-xs text-white/70">days left</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D4AF37] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${status.progressPercent || 0}%` }}
          />
        </div>
      </div>

      {/* Checkpoints timeline */}
      <div className="p-6">
        <div className="flex justify-between relative mb-8">
          {/* Connection line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#1C4444]/10" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-[#D4AF37] transition-all duration-500"
            style={{ width: `${status.progressPercent || 0}%` }}
          />

          {status.checkpoints?.map((checkpoint) => {
            const config = CHECKPOINT_LABELS[checkpoint.day]
            const isCompleted = checkpoint.completed
            const isCurrent =
              !isCompleted &&
              status.nextCheckpoint?.day === checkpoint.day

            return (
              <div key={checkpoint.day} className="relative flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    isCompleted
                      ? 'bg-[#D4AF37] text-[#1C4444]'
                      : isCurrent
                      ? 'bg-[#1C4444] text-white ring-4 ring-[#1C4444]/20'
                      : 'bg-[#1C4444]/10 text-[#1C4444]/40'
                  }`}
                >
                  {isCompleted ? config.icon : checkpoint.day}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    isCompleted ? 'text-[#1C4444]' : 'text-[#1C4444]/50'
                  }`}
                >
                  {config.label}
                </span>
                {checkpoint.badgeEarned && (
                  <span className="text-xs text-[#D4AF37] font-medium mt-1">
                    {checkpoint.badgeEarned}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Improvement stats */}
        {status.improvement && (status.improvement.healthScore !== 0 || status.improvement.skinAge !== 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1C4444]/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-light text-[#1C4444]">
                {status.improvement.healthScore > 0 ? '+' : ''}
                {status.improvement.healthScore}
              </div>
              <div className="text-xs text-[#1C4444]/60">Health Score</div>
            </div>
            <div className="bg-[#1C4444]/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-light text-[#1C4444]">
                {status.improvement.skinAge > 0 ? '-' : '+'}
                {Math.abs(status.improvement.skinAge)} yrs
              </div>
              <div className="text-xs text-[#1C4444]/60">Skin Age</div>
            </div>
          </div>
        )}

        {/* Badges earned */}
        {status.badges && status.badges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[#1C4444] mb-3">Badges Earned</h3>
            <div className="flex flex-wrap gap-2">
              {status.badges.map((badge, i) => (
                <span
                  key={i}
                  className="bg-[#D4AF37]/10 text-[#9A8428] px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                >
                  <span>{CHECKPOINT_LABELS[badge.day]?.icon}</span>
                  {badge.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next checkpoint CTA */}
        {status.status === 'ACTIVE' && status.nextCheckpoint && (
          <div className="bg-[#F4EBE7] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1C4444]">
                  Next: {status.nextCheckpoint.label}
                </p>
                <p className="text-xs text-[#1C4444]/60">
                  {status.nextCheckpoint.daysUntil !== null && status.nextCheckpoint.daysUntil > 0
                    ? `Due in ${status.nextCheckpoint.daysUntil} days`
                    : 'Due today!'}
                </p>
              </div>
              <Link
                href="/skin-analysis"
                className="bg-[#1C4444] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2D5A5A] transition-colors"
              >
                Analyze Now
              </Link>
            </div>
          </div>
        )}

        {/* Completion rewards */}
        {status.status === 'COMPLETED' && (
          <div className="space-y-3">
            {status.completionRewardCode && (
              <div className="bg-[#D4AF37]/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1C4444]">25% Off Reward</p>
                  <code className="text-[#D4AF37] font-mono">{status.completionRewardCode}</code>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(status.completionRewardCode!)}
                  className="text-[#1C4444]/60 hover:text-[#1C4444]"
                >
                  Copy
                </button>
              </div>
            )}

            {!status.transformationShared && (
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
              >
                <span>Share Transformation</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">+10% off</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-[#1C4444] mb-4">
              Share Your Transformation
            </h3>
            <p className="text-[#1C4444]/70 text-sm mb-6">
              Share your glow journey and earn an extra 10% off your next purchase!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 border border-[#1C4444]/20 py-2 rounded-lg text-[#1C4444]"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={shareLoading}
                className="flex-1 bg-[#1C4444] text-white py-2 rounded-lg disabled:opacity-50"
              >
                {shareLoading ? 'Sharing...' : 'Share & Earn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
