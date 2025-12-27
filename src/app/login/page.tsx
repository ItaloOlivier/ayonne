'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Cookie is set automatically by the API
      // Redirect to skin analysis page
      router.push('/skin-analysis')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
            Welcome Back
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-3 tracking-tight">
            Sign In to Your Account
          </h2>
          <p className="text-[#1C4444]/55 leading-relaxed">
            Access your skin analysis history and personalized recommendations
          </p>
        </div>

        {/* Login Form */}
        <div className="card-luxury p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-elegant-fade-in">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1C4444] mb-2.5 tracking-wide">
                Email
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1C4444] mb-2.5 tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 border border-[#1C4444]/15 rounded-xl focus:outline-none focus:border-[#1C4444] focus:ring-2 focus:ring-[#1C4444]/10 transition-all duration-300 bg-white/50"
                placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#1C4444]/8" />
            <span className="text-[#1C4444]/40 text-sm tracking-wide">or</span>
            <div className="flex-1 h-px bg-[#1C4444]/8" />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-[#1C4444]/55 text-sm mb-4">
              Don&apos;t have an account?
            </p>
            <Link
              href="/skin-analysis"
              className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-all duration-300"
            >
              Start Free Skin Analysis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#1C4444]/50 hover:text-[#1C4444] transition-all duration-300 text-sm tracking-wide"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
