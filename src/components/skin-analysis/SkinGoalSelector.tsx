'use client'

import { useState } from 'react'
import { SkinGoal, SKIN_GOAL_INFO, SKIN_GOAL_MULTIPLIERS } from '@/lib/skin-analysis/scoring'

interface SkinGoalSelectorProps {
  currentGoal?: SkinGoal
  onGoalChange: (goal: SkinGoal) => void
  isLoading?: boolean
  variant?: 'onboarding' | 'settings'
}

export default function SkinGoalSelector({
  currentGoal = 'AGE_GRACEFULLY',
  onGoalChange,
  isLoading = false,
  variant = 'settings',
}: SkinGoalSelectorProps) {
  const [selectedGoal, setSelectedGoal] = useState<SkinGoal>(currentGoal)

  const handleSelect = (goal: SkinGoal) => {
    setSelectedGoal(goal)
    onGoalChange(goal)
  }

  const goals: SkinGoal[] = ['AGE_NORMALLY', 'AGE_GRACEFULLY', 'STAY_YOUNG_FOREVER']

  return (
    <div className={variant === 'onboarding' ? 'space-y-6' : 'space-y-4'}>
      {variant === 'onboarding' && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-medium text-[#1C4444] mb-2">
            What's your skincare goal?
          </h2>
          <p className="text-[#1C4444]/60">
            This helps us tailor your skin analysis to your ambitions
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {goals.map((goal) => {
          const info = SKIN_GOAL_INFO[goal]
          const isSelected = selectedGoal === goal
          const multiplier = SKIN_GOAL_MULTIPLIERS[goal]

          return (
            <button
              key={goal}
              onClick={() => handleSelect(goal)}
              disabled={isLoading}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-md'
                  : 'border-[#1C4444]/10 hover:border-[#1C4444]/30 hover:bg-[#F4EBE7]/50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isSelected ? 'bg-[#D4AF37]/20' : 'bg-[#1C4444]/5'
                }`}>
                  {info.emoji}
                </div>

                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${isSelected ? 'text-[#1C4444]' : 'text-[#1C4444]/80'}`}>
                      {info.label}
                    </h3>
                    {goal === 'AGE_GRACEFULLY' && (
                      <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#9A8428] text-xs rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>

                  <p className={`text-sm ${isSelected ? 'text-[#1C4444]/70' : 'text-[#1C4444]/50'}`}>
                    {info.description}
                  </p>

                  {/* Intensity indicator */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-[#1C4444]/40">Scoring intensity:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`w-4 h-1.5 rounded-full ${
                            level <= (multiplier - 0.5)
                              ? isSelected ? 'bg-[#D4AF37]' : 'bg-[#1C4444]/40'
                              : 'bg-[#1C4444]/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#1C4444]/40">{info.tagline}</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Info note */}
      <div className="bg-[#F4EBE7] rounded-xl p-4 mt-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1C4444]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[#1C4444]/70">
              <strong className="text-[#1C4444]">How this works:</strong> Your goal adjusts how
              strictly we score your skin. More ambitious goals mean higher standards,
              so the same skin conditions will result in lower scores - pushing you to improve.
            </p>
            <p className="text-xs text-[#1C4444]/50 mt-2">
              You can change your goal anytime in settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact version for displaying current goal
export function SkinGoalBadge({ goal, size = 'md' }: { goal: SkinGoal; size?: 'sm' | 'md' }) {
  const info = SKIN_GOAL_INFO[goal]

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F4EBE7] rounded-full text-xs text-[#1C4444]/70">
        <span>{info.emoji}</span>
        <span>{info.label}</span>
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4EBE7] rounded-lg">
      <span className="text-base">{info.emoji}</span>
      <div>
        <p className="text-sm font-medium text-[#1C4444]">{info.label}</p>
        <p className="text-xs text-[#1C4444]/50">{info.tagline}</p>
      </div>
    </div>
  )
}
