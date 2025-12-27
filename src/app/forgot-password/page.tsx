'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 flex items-center justify-center py-16 px-4 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#1C4444]/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/[0.03] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-md w-full relative">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8">
            <h1 className="text-2xl font-normal tracking-[0.2em] text-[#1C4444]">AYONNE</h1>
          </Link>
          <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] mb-4">
            Password Recovery
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-3 tracking-tight">
            Reset Your Password
          </h2>
          <p className="text-[#1C4444]/55 leading-relaxed">
            Enter your email and we&apos;ll send you instructions to reset your password
          </p>
        </div>

        {/* Form */}
        <div className="card-luxury p-8 md:p-10">
          {success ? (
            <div className="text-center animate-elegant-fade-in">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-3">Check Your Email</h3>
              <p className="text-[#1C4444]/60 mb-6">
                If an account exists with <strong>{email}</strong>, you&apos;ll receive password reset instructions shortly.
              </p>
              <p className="text-sm text-[#1C4444]/50 mb-6">
                Don&apos;t see the email? Check your spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-elegant-fade-in">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1C4444] mb-2.5 tracking-wide">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 border border-[#1C4444]/15 rounded-xl focus:outline-none focus:border-[#1C4444] focus:ring-2 focus:ring-[#1C4444]/10 transition-all duration-300 bg-white/50"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1C4444] text-white py-4 rounded-xl font-medium tracking-wide hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg hover:-translate-y-0.5 flex items-center justify-center gap-3 btn-luxury"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>
          )}

          {!success && (
            <>
              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-[#1C4444]/8" />
                <span className="text-[#1C4444]/40 text-sm tracking-wide">or</span>
                <div className="flex-1 h-px bg-[#1C4444]/8" />
              </div>

              {/* Back to Login */}
              <div className="text-center">
                <p className="text-[#1C4444]/55 text-sm mb-4">
                  Remember your password?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#1C4444]/50 hover:text-[#1C4444] transition-all duration-300 text-sm tracking-wide"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
