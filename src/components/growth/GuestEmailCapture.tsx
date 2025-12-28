'use client'

import { useState } from 'react'

interface GuestEmailCaptureProps {
  onSuccess?: (discountCode: string, discountPercent: number) => void
  onSignup?: () => void
  blurredContent?: React.ReactNode
}

export default function GuestEmailCapture({
  onSuccess,
  onSignup,
  blurredContent,
}: GuestEmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    discountCode: string
    discountPercent: number
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/guest/convert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!data.success) {
        if (data.error === 'email_exists') {
          setError('This email already has an account. Please log in.')
        } else {
          setError(data.message || 'Something went wrong')
        }
        return
      }

      setSuccess({
        discountCode: data.discountCode,
        discountPercent: data.discountPercent,
      })

      onSuccess?.(data.discountCode, data.discountPercent)
    } catch {
      setError('Failed to save email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    if (!success) return
    try {
      await navigator.clipboard.writeText(success.discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = success.discountCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-[#1C4444] to-[#2D5A5A] rounded-2xl p-6 text-white">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-1">You're in!</h3>
          <p className="text-white/80">Here's your exclusive discount</p>
        </div>

        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <p className="text-sm text-white/60 mb-2 text-center">Your discount code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white text-[#1C4444] rounded-lg px-4 py-3 font-mono font-bold text-center text-lg">
              {success.discountCode}
            </code>
            <button
              onClick={copyCode}
              className="px-4 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold hover:bg-[#B8962F] transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/80 text-sm mb-4">
          Get {success.discountPercent}% off your first order at ayonne.skin
        </p>

        <div className="flex gap-3">
          <a
            href="https://ayonne.skin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-[#D4AF37] text-white rounded-lg font-semibold text-center hover:bg-[#B8962F] transition-colors"
          >
            Shop Now
          </a>
          {onSignup && (
            <button
              onClick={onSignup}
              className="flex-1 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              Create Account
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Blurred background content */}
      {blurredContent && (
        <div className="blur-sm opacity-50 pointer-events-none select-none">
          {blurredContent}
        </div>
      )}

      {/* Overlay form */}
      <div className={`${blurredContent ? 'absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm' : ''}`}>
        <div className="bg-white rounded-2xl shadow-luxury p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#1C4444]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-[#1C4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1C4444] mb-2">
              Unlock Your Full Results
            </h3>
            <p className="text-gray-600 text-sm">
              Enter your email to see your personalized recommendations
              <span className="block font-medium text-[#D4AF37] mt-1">
                + Get 10% off your first order!
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                loading || !email
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#1C4444] text-white hover:bg-[#2D5A5A]'
              }`}
            >
              {loading ? 'Unlocking...' : 'Unlock Results + Get 10% Off'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            We'll never spam you. Unsubscribe anytime.
          </p>

          {onSignup && (
            <div className="mt-4 text-center">
              <button
                onClick={onSignup}
                className="text-sm text-[#1C4444] hover:underline"
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
