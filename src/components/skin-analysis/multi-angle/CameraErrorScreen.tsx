'use client'

interface CameraErrorScreenProps {
  error: string
  onRetry: () => void
  onUploadFallback: () => void
}

export default function CameraErrorScreen({
  error,
  onRetry,
  onUploadFallback,
}: CameraErrorScreenProps) {
  return (
    <div className="text-center p-8 space-y-5">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div>
        <p className="text-red-700 font-medium mb-2">{error}</p>
        <p className="text-[#1C4444]/60 text-sm">
          Please allow camera access in your browser settings, or upload a photo instead.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onRetry}
          className="w-full py-3 px-6 bg-[#1C4444] text-white rounded-lg font-medium tracking-wide hover:bg-[#1C4444]/90 transition-colors uppercase text-sm"
        >
          Try Again
        </button>
        <button
          onClick={onUploadFallback}
          className="w-full py-3 px-6 border-2 border-[#1C4444]/20 text-[#1C4444] rounded-lg font-medium tracking-wide hover:border-[#1C4444]/40 hover:bg-[#1C4444]/5 transition-colors uppercase text-sm"
        >
          Upload Photo Instead
        </button>
      </div>
      <p className="text-[#1C4444]/40 text-xs">
        Your photos are analyzed securely.<br />
        We respect your privacy.
      </p>
    </div>
  )
}
