'use client'

import { cn } from '@/lib/utils'
import { CapturedImage, CaptureStep, AngleConfig, STEPS_ORDER } from './types'

interface CaptureStepIndicatorProps {
  currentStep: Exclude<CaptureStep, 'review'>
  currentConfig: AngleConfig
  capturedImages: Map<string, CapturedImage>
}

export default function CaptureStepIndicator({
  currentStep,
  currentConfig,
  capturedImages,
}: CaptureStepIndicatorProps) {
  return (
    <div className="space-y-4">
      {/* Step label */}
      <div className="text-center">
        <p className="text-[#1C4444]/50 text-xs tracking-widest uppercase mb-1">
          Step {STEPS_ORDER.indexOf(currentStep) + 1} of 3
        </p>
        <h3 className="text-xl font-light text-[#1C4444] tracking-wide">{currentConfig.label}</h3>
      </div>

      {/* Premium step indicators */}
      <div className="flex items-center justify-center gap-3">
        {STEPS_ORDER.map((step, index) => {
          const isCompleted = capturedImages.has(step)
          const isCurrent = step === currentStep
          const isPending = !isCompleted && !isCurrent

          return (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stepper-dot',
                  isCompleted && 'stepper-dot-complete',
                  isCurrent && 'bg-[#1C4444] text-white stepper-dot-active',
                  isPending && 'bg-[#1C4444]/10 text-[#1C4444]/40'
                )}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {/* Connector line */}
              {index < STEPS_ORDER.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1 transition-all duration-300',
                    capturedImages.has(step) ? 'bg-[#D4AF37]' : 'bg-[#1C4444]/10'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
