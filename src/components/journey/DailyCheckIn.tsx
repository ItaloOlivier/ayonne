'use client'

import { useState, useEffect } from 'react'

interface DailyCheckInProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CheckInData) => void
  userName: string
  currentStreak: number
}

interface CheckInData {
  feeling: 'great' | 'good' | 'okay' | 'not_great'
  changes: string[]
  notes?: string
}

const FEELINGS = [
  { value: 'great' as const, emoji: '✨', label: 'Glowing', color: 'from-emerald-400 to-emerald-500' },
  { value: 'good' as const, emoji: '😊', label: 'Good', color: 'from-teal-400 to-teal-500' },
  { value: 'okay' as const, emoji: '😐', label: 'Okay', color: 'from-amber-400 to-amber-500' },
  { value: 'not_great' as const, emoji: '😟', label: 'Not Great', color: 'from-rose-400 to-rose-500' },
]

const CHANGES = [
  { id: 'new_product', label: 'Started new product', icon: '🧴' },
  { id: 'diet', label: 'Diet changes', icon: '🥗' },
  { id: 'sleep', label: 'Sleep changes', icon: '😴' },
  { id: 'stress', label: 'Stress levels', icon: '💆' },
  { id: 'hydration', label: 'Hydration', icon: '💧' },
  { id: 'exercise', label: 'Exercise', icon: '🏃' },
]

export default function DailyCheckIn({
  isOpen,
  onClose,
  onComplete,
  userName,
  currentStreak,
}: DailyCheckInProps) {
  const [step, setStep] = useState<'feeling' | 'changes' | 'complete'>('feeling')
  const [feeling, setFeeling] = useState<CheckInData['feeling'] | null>(null)
  const [changes, setChanges] = useState<string[]>([])
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('feeling')
      setFeeling(null)
      setChanges([])
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  const handleFeelingSelect = (value: CheckInData['feeling']) => {
    setFeeling(value)
    setTimeout(() => setStep('changes'), 300)
  }

  const handleChangeToggle = (id: string) => {
    setChanges(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    if (feeling) {
      setStep('complete')
      setTimeout(() => {
        onComplete({ feeling, changes })
        handleClose()
      }, 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all duration-300 ${
          isClosing ? 'translate-y-full sm:scale-95 sm:translate-y-0' : 'translate-y-0 sm:scale-100'
        }`}
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pb-8">
          {step === 'feeling' && (
            <FeelingStep
              userName={userName}
              currentStreak={currentStreak}
              onSelect={handleFeelingSelect}
            />
          )}

          {step === 'changes' && (
            <ChangesStep
              feeling={feeling!}
              changes={changes}
              onToggle={handleChangeToggle}
              onSubmit={handleSubmit}
              onBack={() => setStep('feeling')}
            />
          )}

          {step === 'complete' && (
            <CompleteStep streak={currentStreak + 1} />
          )}
        </div>
      </div>
    </div>
  )
}

// Step 1: How is your skin feeling?
function FeelingStep({
  userName,
  currentStreak,
  onSelect,
}: {
  userName: string
  currentStreak: number
  onSelect: (feeling: CheckInData['feeling']) => void
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="animate-elegant-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4EBE7] rounded-full text-xs text-[#1C4444]/60 mb-4">
          <span>Daily Check-in</span>
          {currentStreak > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#1C4444]/30" />
              <span className="text-orange-500">🔥 {currentStreak} day streak</span>
            </>
          )}
        </div>
        <h2 className="text-2xl text-[#1C4444] font-light mb-2">
          {greeting}, {userName}
        </h2>
        <p className="text-[#1C4444]/60">
          How is your skin feeling today?
        </p>
      </div>

      {/* Feeling options */}
      <div className="grid grid-cols-2 gap-3">
        {FEELINGS.map((f) => (
          <button
            key={f.value}
            onClick={() => onSelect(f.value)}
            className="group p-5 rounded-2xl border-2 border-[#1C4444]/10 hover:border-[#1C4444]/30 transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">
              {f.emoji}
            </div>
            <p className="text-[#1C4444] font-medium">{f.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 2: Any changes?
function ChangesStep({
  feeling,
  changes,
  onToggle,
  onSubmit,
  onBack,
}: {
  feeling: CheckInData['feeling']
  changes: string[]
  onToggle: (id: string) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const feelingData = FEELINGS.find(f => f.value === feeling)!

  return (
    <div className="animate-elegant-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${feelingData.color} text-white text-sm mb-4`}>
          <span className="text-lg">{feelingData.emoji}</span>
          <span>Feeling {feelingData.label}</span>
        </div>

        <h2 className="text-xl text-[#1C4444] font-light mb-2">
          Any recent changes?
        </h2>
        <p className="text-sm text-[#1C4444]/60">
          Select all that apply (optional)
        </p>
      </div>

      {/* Change options */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {CHANGES.map((change) => {
          const isSelected = changes.includes(change.id)
          return (
            <button
              key={change.id}
              onClick={() => onToggle(change.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#1C4444] bg-[#1C4444]/5'
                  : 'border-[#1C4444]/10 hover:border-[#1C4444]/30'
              }`}
            >
              <span className="text-xl">{change.icon}</span>
              <span className={`text-sm ${isSelected ? 'text-[#1C4444] font-medium' : 'text-[#1C4444]/70'}`}>
                {change.label}
              </span>
              {isSelected && (
                <svg className="w-4 h-4 ml-auto text-[#1C4444]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Submit button */}
      <button
        onClick={onSubmit}
        className="w-full py-4 bg-[#1C4444] text-white rounded-xl font-medium hover:bg-[#2d5a5a] transition-colors"
      >
        Complete Check-in
      </button>

      <p className="text-center text-xs text-[#1C4444]/40 mt-3">
        +5 streak points
      </p>
    </div>
  )
}

// Step 3: Complete!
function CompleteStep({ streak }: { streak: number }) {
  return (
    <div className="animate-bounce-in text-center py-8">
      {/* Success animation */}
      <div className="relative inline-block mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {/* Sparkles */}
        <div className="absolute -top-2 -right-2 animate-sparkle">✨</div>
        <div className="absolute -bottom-1 -left-2 animate-sparkle" style={{ animationDelay: '200ms' }}>✨</div>
      </div>

      <h2 className="text-2xl text-[#1C4444] font-light mb-2">
        Check-in Complete!
      </h2>

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm mb-4">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.526 1.394-4.792 3.5-6.217-.056.366-.086.74-.086 1.122 0 2.126.813 4.065 2.143 5.52.274.3.664.41 1.024.29.36-.12.645-.42.748-.79.103-.37.042-.77-.16-1.09A5.965 5.965 0 0111 12c0-.878.188-1.715.526-2.469.341-.758.832-1.437 1.444-1.994.615.557 1.104 1.237 1.445 1.995.338.754.526 1.59.526 2.469 0 .987-.238 1.918-.661 2.739-.203.32-.264.72-.16 1.09.103.37.388.67.748.79.36.12.75.01 1.024-.29A7.945 7.945 0 0017 12c0-.382-.03-.756-.086-1.122C18.606 12.208 20 14.474 20 17c0 3.866-3.134 7-7 7z"/>
        </svg>
        <span>{streak} Day Streak!</span>
      </div>

      <p className="text-sm text-[#1C4444]/60">
        Tracking your skin daily helps us give you better insights.
      </p>
    </div>
  )
}

// Hook to trigger daily check-in
export function useDailyCheckIn() {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null)

  useEffect(() => {
    // Check localStorage for last check-in
    const stored = localStorage.getItem('lastDailyCheckIn')
    setLastCheckIn(stored)

    // Show check-in if not done today
    const today = new Date().toDateString()
    if (stored !== today) {
      // Delay showing to let page load first
      const timer = setTimeout(() => setShowCheckIn(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const completeCheckIn = () => {
    const today = new Date().toDateString()
    localStorage.setItem('lastDailyCheckIn', today)
    setLastCheckIn(today)
  }

  return {
    showCheckIn,
    setShowCheckIn,
    completeCheckIn,
    hasCheckedInToday: lastCheckIn === new Date().toDateString(),
  }
}
