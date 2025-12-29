'use client'

import { cn } from '@/lib/utils'
import { CapturedImage, CaptureStep, ANGLE_CONFIGS, STEPS_ORDER } from './types'

interface ProgressThumbnailsProps {
  capturedImages: Map<string, CapturedImage>
  currentStep: CaptureStep
  /** Use gold ring for current (smart mode) vs teal ring (manual mode) */
  useGoldRing?: boolean
}

export default function ProgressThumbnails({
  capturedImages,
  currentStep,
  useGoldRing = true,
}: ProgressThumbnailsProps) {
  if (capturedImages.size === 0) return null

  return (
    <div className="flex justify-center gap-3">
      {STEPS_ORDER.map((angle, index) => {
        const image = capturedImages.get(angle)
        const isCurrent = angle === currentStep

        return (
          <div
            key={angle}
            className={cn(
              'relative w-14 h-14 rounded-xl overflow-hidden transition-all duration-300',
              image ? 'shadow-luxury' : '',
              isCurrent && !image && (useGoldRing
                ? 'ring-2 ring-[#D4AF37] ring-offset-2'
                : 'ring-2 ring-[#1C4444] ring-offset-2'
              )
            )}
          >
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.preview}
                  alt={ANGLE_CONFIGS[angle].label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </>
            ) : (
              <div className={cn(
                'w-full h-full flex items-center justify-center transition-colors',
                isCurrent
                  ? (useGoldRing ? 'bg-[#D4AF37]/20' : 'bg-[#1C4444]/10')
                  : 'bg-[#1C4444]/5'
              )}>
                <span className={cn(
                  'text-xs font-medium',
                  isCurrent
                    ? (useGoldRing ? 'text-[#D4AF37]' : 'text-[#1C4444]')
                    : 'text-[#1C4444]/30'
                )}>
                  {index + 1}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
