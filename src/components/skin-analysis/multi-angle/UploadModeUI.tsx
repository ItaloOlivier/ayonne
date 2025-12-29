'use client'

import { CapturedImage, CaptureStep, AngleConfig } from './types'
import ProgressThumbnails from './ProgressThumbnails'

interface UploadModeUIProps {
  currentConfig: AngleConfig
  capturedImages: Map<string, CapturedImage>
  currentStep: CaptureStep
  onUploadClick: () => void
  onTryCameraAgain: () => void
  onCancel: () => void
}

export default function UploadModeUI({
  currentConfig,
  capturedImages,
  currentStep,
  onUploadClick,
  onTryCameraAgain,
  onCancel,
}: UploadModeUIProps) {
  return (
    <div className="text-center space-y-6 animate-elegant-fade-in">
      <div className="card-luxury p-8 space-y-6">
        {/* Upload icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#1C4444]/10 to-[#1C4444]/5 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Instruction */}
        <div>
          <p className="text-lg text-[#1C4444] mb-2 tracking-wide">
            Upload your {currentConfig.label.toLowerCase()}
          </p>
          <p className="text-[#1C4444]/60 text-sm">
            {currentConfig.instruction}
          </p>
        </div>

        {/* Tips */}
        <div className="bg-[#F4EBE7]/50 rounded-lg p-4">
          <ul className="space-y-3">
            {currentConfig.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-[#1C4444]/70 text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-[#1C4444]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={onUploadClick}
        className="btn-primary btn-luxury w-full py-4 text-sm tracking-widest"
      >
        Choose Photo
      </button>

      <button
        onClick={onTryCameraAgain}
        className="text-[#1C4444]/70 hover:text-[#1C4444] text-sm tracking-wide transition-colors"
      >
        Try Camera Again
      </button>

      <button
        onClick={onCancel}
        className="text-[#1C4444]/50 hover:text-[#1C4444] text-sm tracking-wide transition-colors"
      >
        Cancel
      </button>

      {/* Progress thumbnails */}
      <div className="pt-4">
        <ProgressThumbnails
          capturedImages={capturedImages}
          currentStep={currentStep}
          useGoldRing={true}
        />
      </div>
    </div>
  )
}
