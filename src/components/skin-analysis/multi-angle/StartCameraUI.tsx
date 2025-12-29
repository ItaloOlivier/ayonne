'use client'

import { AngleConfig } from './types'

interface StartCameraUIProps {
  currentConfig: AngleConfig
  onStartCamera: () => void
  onCancel: () => void
}

export default function StartCameraUI({
  currentConfig,
  onStartCamera,
  onCancel,
}: StartCameraUIProps) {
  return (
    <div className="text-center space-y-6 animate-elegant-fade-in">
      <div className="card-luxury p-8 space-y-6">
        {/* Elegant camera icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#1C4444]/10 to-[#1C4444]/5 flex items-center justify-center animate-gentle-glow">
          <svg className="w-10 h-10 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>

        {/* Instruction */}
        <div>
          <p className="text-lg text-[#1C4444] mb-2 tracking-wide">{currentConfig.instruction}</p>
        </div>

        {/* Tips with elegant styling */}
        <div className="bg-[#F4EBE7]/50 rounded-lg p-4">
          <ul className="space-y-3">
            {currentConfig.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-[#1C4444]/70 text-sm animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
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
        onClick={onStartCamera}
        className="btn-primary btn-luxury w-full py-4 text-sm tracking-widest"
      >
        Open Camera
      </button>

      <button
        onClick={onCancel}
        className="text-[#1C4444]/50 hover:text-[#1C4444] text-sm tracking-wide transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
