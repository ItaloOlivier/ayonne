'use client'

import { useState, useEffect } from 'react'

interface AnalysisProgressProps {
  isAnalyzing: boolean
}

const steps = [
  { id: 'upload', label: 'Uploading images', duration: 3000 },
  { id: 'detect', label: 'Detecting skin type', duration: 6000 },
  { id: 'analyze', label: 'Analyzing concerns', duration: 12000 },
  { id: 'recommend', label: 'Generating recommendations', duration: 6000 },
]

export default function AnalysisProgress({ isAnalyzing }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Don't go past 95% - wait for actual completion
        if (prev >= 95) return 95
        // Slower progress as we get closer to the end
        const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5
        return Math.min(95, prev + increment)
      })
    }, 500)

    // Step progression
    let elapsed = 0
    const stepInterval = setInterval(() => {
      elapsed += 1000
      let totalDuration = 0
      for (let i = 0; i < steps.length; i++) {
        totalDuration += steps[i].duration
        if (elapsed < totalDuration) {
          setCurrentStep(i)
          break
        }
      }
      // Stay on last step if we've exceeded all durations
      if (elapsed >= totalDuration) {
        setCurrentStep(steps.length - 1)
      }
    }, 1000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
    }
  }, [isAnalyzing])

  if (!isAnalyzing) return null

  return (
    <div className="bg-white rounded-2xl p-8 md:p-10 shadow-luxury animate-elegant-fade-in">
      {/* Progress Circle */}
      <div className="flex justify-center mb-8">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#1C4444"
              strokeOpacity="0.1"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#1C4444"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-light text-[#1C4444]">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="text-center mb-8">
        <p className="text-lg font-medium text-[#1C4444] mb-2">
          {steps[currentStep]?.label || 'Processing...'}
        </p>
        <p className="text-sm text-[#1C4444]/50">
          Please wait while our AI analyzes your skin
        </p>
      </div>

      {/* Step Indicators */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isCurrent
                  ? 'bg-[#1C4444]/5'
                  : isCompleted
                  ? 'opacity-60'
                  : 'opacity-40'
              }`}
            >
              {/* Step indicator */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#1C4444] text-white'
                    : isCurrent
                    ? 'bg-[#D4AF37] text-white'
                    : 'bg-[#1C4444]/10 text-[#1C4444]/40'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <span
                className={`text-sm transition-colors duration-300 ${
                  isCurrent
                    ? 'text-[#1C4444] font-medium'
                    : isCompleted
                    ? 'text-[#1C4444]/70'
                    : 'text-[#1C4444]/40'
                }`}
              >
                {step.label}
                {isCompleted && (
                  <span className="ml-2 text-xs text-[#1C4444]/50">Complete</span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tip */}
      <div className="mt-8 p-4 bg-[#F4EBE7] rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1C4444] mb-1">Did you know?</p>
            <p className="text-xs text-[#1C4444]/60">
              Our AI analyzes over 12 different skin characteristics across all three angles for the most accurate results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
