'use client'

import { useState, useRef, useCallback } from 'react'

interface TransformationCardProps {
  before: {
    imageUrl: string
    date: string
    skinAge: number
    healthScore: number
  }
  after: {
    imageUrl: string
    date: string
    skinAge: number
    healthScore: number
  }
  userName: string
  daysInJourney: number
  onShare?: () => void
}

export default function TransformationCard({
  before,
  after,
  userName,
  daysInJourney,
  onShare,
}: TransformationCardProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isSharing, setIsSharing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const skinAgeImprovement = before.skinAge - after.skinAge
  const healthImprovement = after.healthScore - before.healthScore

  const handleSliderChange = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  const handleShare = async () => {
    setIsSharing(true)

    // In production, this would generate an image and share
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Skin Transformation',
          text: `I improved my skin age by ${skinAgeImprovement} years in ${daysInJourney} days with Ayonne!`,
          url: 'https://ai.ayonne.skin',
        })
        onShare?.()
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `I improved my skin age by ${skinAgeImprovement} years in ${daysInJourney} days with Ayonne! Try it free: https://ai.ayonne.skin`
      )
    }

    setIsSharing(false)
  }

  return (
    <div className="bg-white rounded-3xl shadow-luxury-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1C4444] to-[#2a5858] px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#D4AF37] text-xs tracking-widest uppercase font-medium">
              My Transformation
            </p>
            <p className="text-white/80 text-sm mt-1">
              {daysInJourney} Days with Ayonne
            </p>
          </div>
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full border-2 border-white bg-[#D4AF37] flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {skinAgeImprovement > 0 ? `-${skinAgeImprovement}` : skinAgeImprovement}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Before/After Slider */}
      <div
        ref={containerRef}
        className="relative aspect-square cursor-ew-resize select-none"
        onMouseMove={(e) => e.buttons === 1 && handleSliderChange(e)}
        onMouseDown={handleSliderChange}
        onTouchMove={handleSliderChange}
        onTouchStart={handleSliderChange}
      >
        {/* After image (full width, underneath) */}
        <div className="absolute inset-0">
          <img
            src={after.imageUrl}
            alt="After"
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* After label */}
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-full">
            After
          </div>
        </div>

        {/* Before image (clipped by slider) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={before.imageUrl}
            alt="Before"
            className="w-full h-full object-cover"
            style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
            draggable={false}
          />
          {/* Before label */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-[#1C4444] text-white text-xs font-medium rounded-full">
            Before
          </div>
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        {/* Drag hint */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full pointer-events-none">
          Drag to compare
        </div>
      </div>

      {/* Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Skin Age */}
          <div className="text-center p-4 bg-[#F4EBE7] rounded-xl">
            <p className="text-xs text-[#1C4444]/60 uppercase tracking-wide mb-2">Skin Age</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg text-[#1C4444]/50 line-through">{before.skinAge}</span>
              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-2xl font-light text-[#1C4444]">{after.skinAge}</span>
            </div>
            {skinAgeImprovement > 0 && (
              <p className="text-emerald-600 text-sm font-medium mt-1">
                {skinAgeImprovement} years younger
              </p>
            )}
          </div>

          {/* Health Score */}
          <div className="text-center p-4 bg-[#F4EBE7] rounded-xl">
            <p className="text-xs text-[#1C4444]/60 uppercase tracking-wide mb-2">Health Score</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg text-[#1C4444]/50">{before.healthScore}</span>
              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-2xl font-light text-[#1C4444]">{after.healthScore}</span>
            </div>
            {healthImprovement > 0 && (
              <p className="text-emerald-600 text-sm font-medium mt-1">
                +{healthImprovement} points
              </p>
            )}
          </div>
        </div>

        {/* Share buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full py-4 bg-[#1C4444] text-white rounded-xl font-medium hover:bg-[#2d5a5a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSharing ? (
              <span>Sharing...</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share My Transformation</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <SocialButton icon="instagram" onClick={() => {}} />
            <SocialButton icon="tiktok" onClick={() => {}} />
            <SocialButton icon="whatsapp" onClick={() => {}} />
            <SocialButton icon="copy" onClick={() => {
              navigator.clipboard.writeText('https://ai.ayonne.skin')
            }} />
          </div>
        </div>

        {/* Incentive */}
        <div className="mt-4 p-3 bg-[#D4AF37]/10 rounded-xl text-center">
          <p className="text-sm text-[#1C4444]">
            <span className="font-medium">Share for +10% off</span>
            <span className="text-[#1C4444]/60"> your next order</span>
          </p>
        </div>
      </div>

      {/* Footer branding */}
      <div className="px-6 py-4 bg-[#F4EBE7] flex items-center justify-center gap-2">
        <span className="text-xs text-[#1C4444]/60">Powered by</span>
        <span className="text-sm text-[#1C4444] font-medium tracking-wider">AYONNE</span>
      </div>
    </div>
  )
}

// Social share button
function SocialButton({
  icon,
  onClick,
}: {
  icon: 'instagram' | 'tiktok' | 'whatsapp' | 'copy'
  onClick: () => void
}) {
  const icons = {
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    tiktok: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
    ),
    whatsapp: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    copy: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  }

  const colors = {
    instagram: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    tiktok: 'bg-black',
    whatsapp: 'bg-[#25D366]',
    copy: 'bg-gray-600',
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl text-white ${colors[icon]} hover:opacity-90 transition-opacity flex items-center justify-center`}
    >
      {icons[icon]}
    </button>
  )
}

// Compact version for results page
export function TransformationPreview({
  skinAgeImprovement,
  healthImprovement,
  daysInJourney,
  onViewFull,
}: {
  skinAgeImprovement: number
  healthImprovement: number
  daysInJourney: number
  onViewFull: () => void
}) {
  return (
    <button
      onClick={onViewFull}
      className="w-full p-4 bg-gradient-to-r from-[#1C4444] to-[#2a5858] rounded-2xl text-left group hover:shadow-luxury-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#D4AF37] text-xs tracking-widest uppercase font-medium">
            Your Transformation
          </p>
          <p className="text-white text-lg mt-1">
            {skinAgeImprovement > 0 && (
              <span className="font-light">{skinAgeImprovement} years younger</span>
            )}
            {skinAgeImprovement > 0 && healthImprovement > 0 && (
              <span className="text-white/40 mx-2">•</span>
            )}
            {healthImprovement > 0 && (
              <span className="font-light">+{healthImprovement} health score</span>
            )}
          </p>
          <p className="text-white/60 text-sm mt-1">
            {daysInJourney} days with Ayonne
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}
