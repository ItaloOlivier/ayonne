'use client'

import { useState, useEffect } from 'react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

interface ReferralTier {
  count: number
  discountPercent: number
  label: string
  bonus?: string
}

interface ReferralStats {
  code: string
  shareUrl: string
  totalReferrals: number
  tier: {
    current: ReferralTier | null
    next: ReferralTier | null
    progress: number
    referralsToNext: number
  }
  referrals: Array<{
    name: string
    status: string
    date: string
    completedAt: string | null
  }>
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopyToClipboard()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/referral/generate')
      const data = await response.json()

      if (data.success) {
        setStats(data)
      } else {
        setError('Failed to load referral stats')
      }
    } catch {
      setError('Failed to load referral stats')
    } finally {
      setLoading(false)
    }
  }

  const shareVia = (platform: 'whatsapp' | 'email' | 'sms') => {
    if (!stats) return

    const message = `Check out Ayonne's AI Skin Analyzer! Get a free personalized skin analysis and ${stats.tier.current?.discountPercent || 10}% off your first order with my link: ${stats.shareUrl}`

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        break
      case 'email':
        window.open(
          `mailto:?subject=${encodeURIComponent('Try this AI Skin Analyzer!')}&body=${encodeURIComponent(message)}`,
          '_blank'
        )
        break
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
        break
    }
  }

  if (loading) {
    return (
      <div className="card-luxury p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="card-luxury p-6 text-center text-gray-500">
        {error || 'Unable to load referral program'}
      </div>
    )
  }

  const TIERS: ReferralTier[] = [
    { count: 1, discountPercent: 10, label: 'Bronze' },
    { count: 3, discountPercent: 20, label: 'Silver' },
    { count: 5, discountPercent: 25, label: 'Gold', bonus: 'Free Sample' },
    { count: 10, discountPercent: 30, label: 'Platinum', bonus: 'Free Product' },
  ]

  return (
    <div className="card-luxury p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#1C4444] mb-1">
            Share & Earn Rewards
          </h3>
          <p className="text-gray-600 text-sm">
            Invite friends and you both save!
          </p>
        </div>
        {stats.tier.current && (
          <div className="bg-[#D4AF37] text-white px-3 py-1 rounded-full text-sm font-semibold">
            {stats.tier.current.label}
          </div>
        )}
      </div>

      {/* Referral Link */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-500 mb-2">Your referral code</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 font-mono text-[#1C4444] text-center font-bold">
            {stats.code}
          </code>
          <button
            onClick={() => stats && copy(stats.shareUrl)}
            className={`px-4 py-3 rounded-lg font-semibold transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-[#1C4444] text-white hover:bg-[#2D5A5A]'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => shareVia('whatsapp')}
          className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20BD5A] transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="text-sm font-medium">WhatsApp</span>
        </button>
        <button
          onClick={() => shareVia('email')}
          className="flex items-center justify-center gap-2 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">Email</span>
        </button>
        <button
          onClick={() => shareVia('sms')}
          className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">SMS</span>
        </button>
      </div>

      {/* Tier Progress */}
      <div className="bg-gradient-to-r from-[#F4EBE7] to-white rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            {stats.totalReferrals} referral{stats.totalReferrals !== 1 ? 's' : ''}
          </span>
          {stats.tier.next && (
            <span className="text-sm text-[#D4AF37] font-medium">
              {stats.tier.referralsToNext} more to {stats.tier.next.label}!
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D4AF37] to-[#B8962F] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(stats.tier.progress * 100, 100)}%` }}
          />
        </div>

        {/* Tier markers */}
        <div className="flex justify-between text-xs">
          {TIERS.map((tier) => (
            <div
              key={tier.count}
              className={`text-center ${
                stats.totalReferrals >= tier.count
                  ? 'text-[#D4AF37] font-semibold'
                  : 'text-gray-400'
              }`}
            >
              <div className="font-medium">{tier.count}</div>
              <div>{tier.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reward Info */}
      <div className="flex items-center gap-3 p-3 bg-[#1C4444]/5 rounded-lg">
        <div className="w-10 h-10 bg-[#1C4444] rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-[#1C4444]">
            You get {stats.tier.current?.discountPercent || 10}% off
          </p>
          <p className="text-sm text-gray-600">
            Your friend gets 10% off their first order
          </p>
        </div>
      </div>

      {/* Recent Referrals */}
      {stats.referrals.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-[#1C4444] mb-3">Recent Referrals</h4>
          <div className="space-y-2">
            {stats.referrals.slice(0, 5).map((referral, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {referral.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700">{referral.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    referral.status === 'REWARDED'
                      ? 'bg-green-100 text-green-700'
                      : referral.status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {referral.status === 'REWARDED'
                    ? 'Rewarded'
                    : referral.status === 'COMPLETED'
                    ? 'Completed'
                    : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
