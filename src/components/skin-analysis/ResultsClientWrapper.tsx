'use client'

import { useState, useEffect } from 'react'
import InstallPrompt from './InstallPrompt'
import CelebrationAnimation from './CelebrationAnimation'
import { RecentPurchasePopup } from './SocialProof'
import { SpinWheel, ReferralBanner } from '@/components/growth'

interface ResultsClientWrapperProps {
  improvement?: number
  isNewUser?: boolean
  analysisId?: string
}

export default function ResultsClientWrapper({
  improvement = 0,
  isNewUser = false,
  analysisId,
}: ResultsClientWrapperProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<'confetti' | 'score_up' | 'achievement'>('confetti')
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [spinChecked, setSpinChecked] = useState(false)
  const [wonDiscount, setWonDiscount] = useState<{
    code: string
    discountPercent: number
    expiresAt: string
  } | null>(null)

  useEffect(() => {
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
  }, [improvement, isNewUser])

  // Check if user can spin after celebration ends or on mount
  useEffect(() => {
    if (spinChecked || !analysisId) return

    const checkSpinAvailability = async () => {
      try {
        const response = await fetch('/api/spin/available')
        const data = await response.json()

        if (data.success && data.canSpin) {
          // Delay showing spin wheel to let celebration finish
          const delay = showCelebration ? 3500 : 1000
          setTimeout(() => {
            setShowSpinWheel(true)
          }, delay)
        }
      } catch {
        // Silently fail
      } finally {
        setSpinChecked(true)
      }
    }

    checkSpinAvailability()
  }, [analysisId, spinChecked, showCelebration])

  const handleSpinComplete = (prize: { code: string; discountPercent: number; expiresAt: string }) => {
    setWonDiscount(prize)
    // Store in localStorage for ProductRecommendations to pick up
    localStorage.setItem('ayonne_discount', JSON.stringify(prize))
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

      {/* Spin Wheel Modal */}
      {showSpinWheel && analysisId && !wonDiscount && (
        <SpinWheel
          analysisId={analysisId}
          onComplete={handleSpinComplete}
          onClose={() => setShowSpinWheel(false)}
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
