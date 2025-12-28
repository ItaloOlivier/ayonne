'use client'

import { useState, useEffect } from 'react'

interface ReferralBannerProps {
  variant?: 'sticky' | 'inline'
  onShare?: () => void
}

export default function ReferralBanner({ variant = 'inline', onShare }: ReferralBannerProps) {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetchReferralCode()
  }, [])

  const fetchReferralCode = async () => {
    try {
      const response = await fetch('/api/referral/generate', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setReferralCode(data.code)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!referralCode) return
    const shareUrl = `https://ai.ayonne.skin?ref=${referralCode}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    onShare?.()
  }

  const shareViaWhatsApp = () => {
    if (!referralCode) return
    const shareUrl = `https://ai.ayonne.skin?ref=${referralCode}`
    const message = `Check out this free AI Skin Analysis! Use my link to get 10% off: ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    onShare?.()
  }

  if (loading || !referralCode || dismissed) {
    return null
  }

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white py-3 px-4 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base">
                Share with friends, you both save!
              </p>
              <p className="text-white/80 text-xs sm:text-sm">
                You get 15% off, they get 10% off
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={shareViaWhatsApp}
              className="hidden sm:flex items-center gap-1 px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BD5A] transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Share
            </button>
            <button
              onClick={copyLink}
              className="px-3 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8962F] transition-colors text-sm font-medium"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className="bg-gradient-to-r from-[#F4EBE7] to-white border border-[#D4AF37]/30 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1C4444] rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#1C4444]">
            Share with a friend, you both save!
          </p>
          <p className="text-sm text-gray-600">
            You get 15% off, they get 10% off their first order
          </p>
        </div>
        <button
          onClick={copyLink}
          className="px-4 py-2 bg-[#1C4444] text-white rounded-lg hover:bg-[#2D5A5A] transition-colors font-medium text-sm flex-shrink-0"
        >
          {copied ? 'Link Copied!' : 'Share Now'}
        </button>
      </div>
    </div>
  )
}
