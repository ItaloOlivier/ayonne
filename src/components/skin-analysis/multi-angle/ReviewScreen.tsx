'use client'

import { CapturedImage, CaptureStep, ANGLE_CONFIGS, STEPS_ORDER } from './types'

interface ReviewScreenProps {
  capturedImages: Map<string, CapturedImage>
  isLoading?: boolean
  onRetake: (angle: Exclude<CaptureStep, 'review'>) => void
  onComplete: () => void
  onCancel: () => void
}

export default function ReviewScreen({
  capturedImages,
  isLoading,
  onRetake,
  onComplete,
  onCancel,
}: ReviewScreenProps) {
  return (
    <div className="space-y-8 animate-elegant-fade-in">
      {/* Success header with celebration */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center shadow-luxury animate-bounce-in">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-light text-[#1C4444] mb-2 tracking-wide">Beautifully Captured</h3>
        <p className="text-[#1C4444]/60 text-sm">
          Your photos are ready for our advanced AI analysis
        </p>
      </div>

      {/* Photo grid with luxury styling */}
      <div className="grid grid-cols-3 gap-4">
        {STEPS_ORDER.map((angle, index) => {
          const image = capturedImages.get(angle)
          const config = ANGLE_CONFIGS[angle]
          return (
            <div
              key={angle}
              className="relative animate-elegant-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square rounded-xl overflow-hidden shadow-luxury border border-[#1C4444]/10 group">
                {image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.preview}
                      alt={config.label}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Elegant overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C4444]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <button
                      onClick={() => onRetake(angle)}
                      disabled={isLoading}
                      className="absolute bottom-2 right-2 bg-white/95 hover:bg-white text-[#1C4444] p-2 rounded-full shadow-luxury opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-50"
                      aria-label={`Retake ${config.label}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    {/* Gold checkmark badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A227] flex items-center justify-center shadow-sm">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1C4444]/5">
                    <span className="text-[#1C4444]/30 text-xs">Missing</span>
                  </div>
                )}
              </div>
              <p className="text-center text-[#1C4444]/70 text-xs mt-2 font-medium tracking-wide">{config.label}</p>
            </div>
          )
        })}
      </div>

      {/* Premium action buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onComplete}
          disabled={isLoading || capturedImages.size < 3}
          className="w-full btn-primary btn-luxury py-4 text-sm tracking-widest disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Preparing Analysis...
            </span>
          ) : (
            'Begin My Skin Analysis'
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="w-full py-3 text-[#1C4444]/60 hover:text-[#1C4444] text-sm tracking-wide transition-colors disabled:opacity-50"
        >
          Start Over
        </button>
      </div>

      <p className="text-center text-[#1C4444]/40 text-xs tracking-wide">
        Our dermatologist-grade AI will analyze all three perspectives
      </p>
    </div>
  )
}
