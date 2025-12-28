'use client'

import { useState, useEffect, useCallback } from 'react'
import InstallPrompt from './InstallPrompt'
import CelebrationAnimation from './CelebrationAnimation'
import { RecentPurchasePopup } from './SocialProof'
import { ReferralBanner } from '@/components/growth'
import ChallengeJoin from '@/components/growth/ChallengeJoin'
import ChallengeProgress from '@/components/growth/ChallengeProgress'

interface ResultsClientWrapperProps {
  improvement?: number
  isNewUser?: boolean
  analysisId?: string
}

interface ChallengeStatus {
  enrolled: boolean
  canJoin?: boolean
  status?: string
  checkpoint?: {
    day: number
    badge?: string
    rewardCode?: string
    rewardPercent?: number
  }
}

export default function ResultsClientWrapper({
  improvement = 0,
  isNewUser = false,
  analysisId,
}: ResultsClientWrapperProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<'confetti' | 'score_up' | 'achievement'>('confetti')
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const [showChallengeJoin, setShowChallengeJoin] = useState(false)
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus | null>(null)
  const [checkpointCompleted, setCheckpointCompleted] = useState<{
    day: number
    badge?: string
    rewardCode?: string
    rewardPercent?: number
  } | null>(null)

  // Fetch challenge status
  const fetchChallengeStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/challenge/status')
      const data = await res.json()
      if (data.success) {
        setChallengeStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch challenge status:', error)
    }
  }, [])

  // Record analysis for challenge progress
  const recordAnalysis = useCallback(async () => {
    if (!analysisId) return

    try {
      const res = await fetch('/api/challenge/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })
      const data = await res.json()

      if (data.success && data.checkpoint) {
        setCheckpointCompleted(data.checkpoint)
        // Show celebration for checkpoint completion
        setCelebrationType('achievement')
        setCelebrationMessage(`${data.checkpoint.badge || 'Checkpoint'} unlocked!`)
        setShowCelebration(true)
      }
    } catch (error) {
      console.error('Failed to record challenge analysis:', error)
    }
  }, [analysisId])

  useEffect(() => {
    // Store analysisId for ProductRecommendations to use for spin wheel
    if (analysisId) {
      sessionStorage.setItem('ayonne_current_analysis', analysisId)
    }

    // Fetch challenge status
    fetchChallengeStatus()
  }, [analysisId, fetchChallengeStatus])

  // Record analysis for challenge if enrolled
  useEffect(() => {
    if (challengeStatus?.enrolled && challengeStatus?.status === 'ACTIVE' && analysisId) {
      recordAnalysis()
    }
  }, [challengeStatus?.enrolled, challengeStatus?.status, analysisId, recordAnalysis])

  useEffect(() => {
    // Don't show other celebrations if checkpoint was just completed
    if (checkpointCompleted) return

    // Show celebration for first-time users
    if (isNewUser) {
      setCelebrationType('achievement')
      setCelebrationMessage('Welcome to Ayonne!')
      setShowCelebration(true)
      return
    }

    // Show celebration for significant improvements
    if (improvement >= 10) {
      setCelebrationType('confetti')
      setCelebrationMessage(`Amazing! +${improvement} points!`)
      setShowCelebration(true)
    } else if (improvement >= 5) {
      setCelebrationType('score_up')
      setCelebrationMessage(`Great progress! +${improvement} points`)
      setShowCelebration(true)
    }
  }, [improvement, isNewUser, checkpointCompleted])

  const handleChallengeJoinSuccess = () => {
    setShowChallengeJoin(false)
    fetchChallengeStatus()
    // Show celebration
    setCelebrationType('achievement')
    setCelebrationMessage('Challenge Started!')
    setShowCelebration(true)
  }

  return (
    <>
      {/* Celebration animation for improvements */}
      {showCelebration && (
        <CelebrationAnimation
          type={celebrationType}
          message={celebrationMessage}
          onComplete={() => setShowCelebration(false)}
        />
      )}

      {/* Challenge section - shown in results page */}
      <div className="container mx-auto px-4 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Challenge Progress or Join CTA */}
          <ChallengeProgress
            compact={challengeStatus?.enrolled}
            onJoinClick={() => setShowChallengeJoin(true)}
          />

          {/* Checkpoint completion notification */}
          {checkpointCompleted && checkpointCompleted.rewardCode && (
            <div className="mt-4 bg-[#D4AF37]/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1C4444]">
                    Challenge Reward Unlocked!
                  </p>
                  <p className="text-xs text-[#1C4444]/60">
                    Day {checkpointCompleted.day} - {checkpointCompleted.rewardPercent}% off
                  </p>
                </div>
                <code className="text-[#D4AF37] font-mono font-medium">
                  {checkpointCompleted.rewardCode}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Join Modal */}
      {showChallengeJoin && analysisId && (
        <ChallengeJoin
          analysisId={analysisId}
          onSuccess={handleChallengeJoinSuccess}
          onClose={() => setShowChallengeJoin(false)}
        />
      )}

      {/* Referral Banner - sticky at bottom */}
      <ReferralBanner variant="sticky" />

      {/* Recent purchase notifications */}
      <RecentPurchasePopup />

      {/* Install prompt */}
      <InstallPrompt />
    </>
  )
}
