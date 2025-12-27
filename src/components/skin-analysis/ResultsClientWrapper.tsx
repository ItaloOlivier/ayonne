'use client'

import { useState, useEffect } from 'react'
import InstallPrompt from './InstallPrompt'
import CelebrationAnimation from './CelebrationAnimation'
import { RecentPurchasePopup } from './SocialProof'

interface ResultsClientWrapperProps {
  improvement?: number
  isNewUser?: boolean
}

export default function ResultsClientWrapper({ improvement = 0, isNewUser = false }: ResultsClientWrapperProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<'confetti' | 'score_up' | 'achievement'>('confetti')
  const [celebrationMessage, setCelebrationMessage] = useState('')

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

      {/* Recent purchase notifications */}
      <RecentPurchasePopup />

      {/* Install prompt */}
      <InstallPrompt />
    </>
  )
}
