'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ReferralDashboard, DiscountBadge } from '@/components/growth'
import SkinGoalSelector from '@/components/skin-analysis/SkinGoalSelector'
import { SkinGoal, SKIN_GOAL_INFO } from '@/lib/skin-analysis/scoring'

const CUSTOMER_STORAGE_KEY = 'ayonne_customer_id'
const CUSTOMER_DATA_KEY = 'ayonne_customer_data'

type ImageStorageConsent = 'ALLOWED' | 'DENIED' | 'NOT_SET'

interface CustomerData {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phone: string | null
  createdAt: string
  analysisCount: number
  skinGoal?: SkinGoal
  imageStorageConsent?: ImageStorageConsent
}

interface SkinAnalysis {
  id: string
  skinType: string | null
  conditions: Array<{ id: string; name: string; confidence: number }>
  createdAt: string
  status: string
}

export default function AccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [skinGoal, setSkinGoal] = useState<SkinGoal>('AGE_GRACEFULLY')
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)
  const [showGoalSelector, setShowGoalSelector] = useState(false)
  const [imageConsent, setImageConsent] = useState<ImageStorageConsent>('NOT_SET')
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const customerId = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    const customerData = localStorage.getItem(CUSTOMER_DATA_KEY)

    if (!customerId) {
      router.push('/login')
      return
    }

    if (customerData) {
      const parsed = JSON.parse(customerData)
      setCustomer(parsed)
      if (parsed.skinGoal) {
        setSkinGoal(parsed.skinGoal)
      }
    }

    // Fetch current skin goal from server
    fetch('/api/account/skin-goal')
      .then(res => res.json())
      .then(data => {
        if (data.skinGoal) {
          setSkinGoal(data.skinGoal)
        }
      })
      .catch(console.error)

    // Fetch current image consent from server
    fetch('/api/account/image-consent')
      .then(res => res.json())
      .then(data => {
        if (data.imageStorageConsent) {
          setImageConsent(data.imageStorageConsent)
        }
      })
      .catch(console.error)

    // Fetch analysis history
    fetch(`/api/skin-analysis/history?customerId=${customerId}&limit=5`)
      .then(res => res.json())
      .then(data => {
        if (data.analyses) {
          setAnalyses(data.analyses)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [router])

  const handleGoalChange = async (newGoal: SkinGoal) => {
    setIsUpdatingGoal(true)
    try {
      const response = await fetch('/api/account/skin-goal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinGoal: newGoal }),
      })

      if (response.ok) {
        setSkinGoal(newGoal)
        // Update local storage
        if (customer) {
          const updatedCustomer = { ...customer, skinGoal: newGoal }
          localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(updatedCustomer))
          setCustomer(updatedCustomer)
        }
        setShowGoalSelector(false)
      }
    } catch (error) {
      console.error('Failed to update skin goal:', error)
    } finally {
      setIsUpdatingGoal(false)
    }
  }

  const handleConsentChange = async (newConsent: ImageStorageConsent) => {
    setIsUpdatingConsent(true)
    try {
      const response = await fetch('/api/account/image-consent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageStorageConsent: newConsent }),
      })

      if (response.ok) {
        setImageConsent(newConsent)
      }
    } catch (error) {
      console.error('Failed to update image consent:', error)
    } finally {
      setIsUpdatingConsent(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY)
    localStorage.removeItem(CUSTOMER_DATA_KEY)
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#1C4444]/50 text-sm tracking-wide">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95">
      {/* Header */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/"
              className="inline-flex items-center text-[#1C4444]/50 hover:text-[#1C4444] transition-all duration-300 tracking-wide text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center text-[#1C4444]/50 hover:text-red-500 transition-all duration-300 tracking-wide text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              Your Profile
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-3 tracking-tight">
              My Account
            </h1>
            <p className="text-[#1C4444]/55 leading-relaxed">
              Manage your profile and view your skin analysis history
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Card */}
            <div className="card-luxury p-8 md:p-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-medium text-[#1C4444] mb-2 tracking-wide">
                    Profile Information
                  </h2>
                  <p className="text-[#1C4444]/50 text-sm">
                    Your account details
                  </p>
                </div>
                <div className="w-18 h-18 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center text-2xl font-light shadow-luxury">
                  {customer?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1C4444]/40 mb-2">Name</label>
                  <p className="text-[#1C4444] font-medium text-lg">
                    {customer?.firstName} {customer?.lastName || ''}
                  </p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1C4444]/40 mb-2">Email</label>
                  <p className="text-[#1C4444] font-medium text-lg">
                    {customer?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1C4444]/40 mb-2">Phone</label>
                  <p className="text-[#1C4444] font-medium text-lg">
                    {customer?.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1C4444]/40 mb-2">Member Since</label>
                  <p className="text-[#1C4444] font-medium text-lg">
                    {customer?.createdAt ? formatDate(customer.createdAt) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Skincare Goal Card */}
            <div className="card-luxury p-8 md:p-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium text-[#1C4444] mb-2 tracking-wide">
                    Your Skincare Goal
                  </h2>
                  <p className="text-[#1C4444]/50 text-sm">
                    This affects how strictly we score your skin analysis
                  </p>
                </div>
                {!showGoalSelector && (
                  <button
                    onClick={() => setShowGoalSelector(true)}
                    className="text-[#D4AF37] hover:text-[#1C4444] text-sm font-medium tracking-wide transition-all duration-300"
                  >
                    Change
                  </button>
                )}
              </div>

              {showGoalSelector ? (
                <div className="space-y-4">
                  <SkinGoalSelector
                    currentGoal={skinGoal}
                    onGoalChange={handleGoalChange}
                    isLoading={isUpdatingGoal}
                    variant="settings"
                  />
                  <button
                    onClick={() => setShowGoalSelector(false)}
                    className="w-full py-3 text-[#1C4444]/60 hover:text-[#1C4444] text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 rounded-xl border border-[#D4AF37]/20">
                  <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-3xl">
                    {SKIN_GOAL_INFO[skinGoal]?.emoji || '✨'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1C4444] text-lg">
                      {SKIN_GOAL_INFO[skinGoal]?.label || 'Age Gracefully'}
                    </p>
                    <p className="text-sm text-[#1C4444]/60 mt-1">
                      {SKIN_GOAL_INFO[skinGoal]?.description || 'Balanced scoring for healthy skin'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Settings Card */}
            <div className="card-luxury p-8 md:p-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium text-[#1C4444] mb-2 tracking-wide">
                    Privacy Settings
                  </h2>
                  <p className="text-[#1C4444]/50 text-sm">
                    Control how your data is stored
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#1C4444]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                {/* Image Storage Toggle */}
                <div className="p-5 bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 rounded-xl border border-[#1C4444]/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-[#1C4444]">Photo Storage</span>
                        {imageConsent === 'ALLOWED' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Enabled</span>
                        )}
                        {imageConsent === 'DENIED' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Disabled</span>
                        )}
                        {imageConsent === 'NOT_SET' && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Not Set</span>
                        )}
                      </div>
                      <p className="text-sm text-[#1C4444]/60">
                        {imageConsent === 'ALLOWED'
                          ? 'Your analysis photos are saved to track skin progress over time.'
                          : 'Your photos are analyzed but not stored. Progress tracking features are limited.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imageConsent === 'ALLOWED'}
                        onChange={(e) => handleConsentChange(e.target.checked ? 'ALLOWED' : 'DENIED')}
                        disabled={isUpdatingConsent}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-[#1C4444]/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1C4444]/10 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C4444] ${isUpdatingConsent ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>

                  {imageConsent !== 'ALLOWED' && (
                    <div className="mt-4 pt-4 border-t border-[#1C4444]/10">
                      <p className="text-xs text-[#1C4444]/50 flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>
                          Without photo storage enabled, you cannot: view analysis history photos, compare before/after images, or use the Skin Forecast feature with face aging preview.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Data Management Links */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="/api/auth/export-data"
                    className="text-sm text-[#1C4444]/60 hover:text-[#1C4444] flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export My Data
                  </a>
                  <a
                    href="/policies/privacy-policy"
                    className="text-sm text-[#1C4444]/60 hover:text-[#1C4444] flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card-luxury p-8 md:p-10">
              <h2 className="text-xl font-medium text-[#1C4444] mb-8 tracking-wide">
                Your Skin Journey
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="text-center p-6 bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 rounded-xl border border-[#1C4444]/5">
                  <p className="text-3xl font-light text-[#1C4444] mb-2">
                    {analyses.length}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">Total Analyses</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 rounded-xl border border-[#1C4444]/5">
                  <p className="text-3xl font-light text-[#1C4444] mb-2">
                    {analyses[0]?.skinType || '-'}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">Skin Type</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 rounded-xl border border-[#1C4444]/5">
                  <p className="text-3xl font-light text-[#1C4444] mb-2">
                    {analyses[0]?.conditions?.length || 0}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">Concerns</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-[#F4EBE7] to-[#F4EBE7]/80 rounded-xl border border-[#1C4444]/5">
                  <p className="text-3xl font-light text-[#1C4444] mb-2">
                    {analyses.length > 0 ? formatDate(analyses[0].createdAt).split(',')[0] : '-'}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#1C4444]/50">Last Analysis</p>
                </div>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="card-luxury p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-medium text-[#1C4444] mb-2 tracking-wide">
                    Recent Analyses
                  </h2>
                  <p className="text-[#1C4444]/50 text-sm">
                    Your most recent skin analyses
                  </p>
                </div>
                <Link
                  href="/skin-analysis/history"
                  className="text-[#1C4444] hover:text-[#D4AF37] text-sm font-medium tracking-wide transition-all duration-300"
                >
                  View All
                </Link>
              </div>

              {analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.slice(0, 5).map((analysis) => (
                    <Link
                      key={analysis.id}
                      href={`/skin-analysis/results/${analysis.id}`}
                      className="block p-5 border border-[#1C4444]/8 rounded-xl hover:border-[#1C4444]/20 hover:shadow-luxury transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#1C4444] tracking-wide">
                            {analysis.skinType ? `${analysis.skinType.charAt(0).toUpperCase() + analysis.skinType.slice(1)} Skin` : 'Analysis'}
                          </p>
                          <p className="text-sm text-[#1C4444]/50 mt-1">
                            {formatDate(analysis.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {analysis.conditions?.slice(0, 2).map((c: { id: string; name: string }) => (
                            <span
                              key={c.id}
                              className="text-xs bg-[#F4EBE7] text-[#1C4444] px-3 py-1.5 rounded-full"
                            >
                              {c.name}
                            </span>
                          ))}
                          <svg className="w-5 h-5 text-[#1C4444]/30 group-hover:text-[#D4AF37] transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#1C4444]/50 mb-6">No analyses yet</p>
                  <Link
                    href="/skin-analysis"
                    className="inline-flex items-center gap-3 bg-[#1C4444] text-white px-8 py-4 rounded-xl hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg btn-luxury"
                  >
                    Start Your First Analysis
                  </Link>
                </div>
              )}
            </div>

            {/* Referral Program */}
            <ReferralDashboard />

            {/* Available Discounts */}
            <div className="flex items-center justify-center">
              <DiscountBadge showCode size="lg" />
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/skin-analysis"
                className="bg-gradient-to-br from-[#1C4444] to-[#1C4444]/95 text-white rounded-2xl p-8 hover:shadow-luxury-lg transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg mb-2 tracking-wide">New Analysis</h3>
                    <p className="text-white/60 text-sm">
                      Take a new photo to track your progress
                    </p>
                  </div>
                  <svg className="w-10 h-10 text-white/40 group-hover:text-[#D4AF37] transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </Link>

              <Link
                href="/skin-analysis/history"
                className="bg-white border-2 border-[#1C4444]/15 text-[#1C4444] rounded-2xl p-8 hover:border-[#1C4444] hover:shadow-luxury transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg mb-2 tracking-wide">View Progress</h3>
                    <p className="text-[#1C4444]/50 text-sm">
                      See how your skin has improved
                    </p>
                  </div>
                  <svg className="w-10 h-10 text-[#1C4444]/30 group-hover:text-[#D4AF37] transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
