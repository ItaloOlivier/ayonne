'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CUSTOMER_STORAGE_KEY = 'ayonne_customer_id'
const CUSTOMER_DATA_KEY = 'ayonne_customer_data'

interface CustomerData {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phone: string | null
  createdAt: string
  analysisCount: number
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

  useEffect(() => {
    // Check if user is logged in
    const customerId = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    const customerData = localStorage.getItem(CUSTOMER_DATA_KEY)

    if (!customerId) {
      router.push('/login')
      return
    }

    if (customerData) {
      setCustomer(JSON.parse(customerData))
    }

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
      <div className="min-h-screen bg-[#F4EBE7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Header */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center text-[#1C4444]/60 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-normal text-[#1C4444] mb-2">
              My Account
            </h1>
            <p className="text-[#1C4444]/60">
              Manage your profile and view your skin analysis history
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium text-[#1C4444] mb-1">
                    Profile Information
                  </h2>
                  <p className="text-[#1C4444]/60 text-sm">
                    Your account details
                  </p>
                </div>
                <div className="w-16 h-16 bg-[#1C4444] text-white rounded-full flex items-center justify-center text-2xl font-light">
                  {customer?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-[#1C4444]/50 mb-1">Name</label>
                  <p className="text-[#1C4444] font-medium">
                    {customer?.firstName} {customer?.lastName || ''}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-[#1C4444]/50 mb-1">Email</label>
                  <p className="text-[#1C4444] font-medium">
                    {customer?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-[#1C4444]/50 mb-1">Phone</label>
                  <p className="text-[#1C4444] font-medium">
                    {customer?.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-[#1C4444]/50 mb-1">Member Since</label>
                  <p className="text-[#1C4444] font-medium">
                    {customer?.createdAt ? formatDate(customer.createdAt) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-medium text-[#1C4444] mb-6">
                Your Skin Journey
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-[#F4EBE7] rounded-lg">
                  <p className="text-3xl font-light text-[#1C4444] mb-1">
                    {analyses.length}
                  </p>
                  <p className="text-sm text-[#1C4444]/60">Total Analyses</p>
                </div>
                <div className="text-center p-4 bg-[#F4EBE7] rounded-lg">
                  <p className="text-3xl font-light text-[#1C4444] mb-1">
                    {analyses[0]?.skinType || '-'}
                  </p>
                  <p className="text-sm text-[#1C4444]/60">Current Skin Type</p>
                </div>
                <div className="text-center p-4 bg-[#F4EBE7] rounded-lg">
                  <p className="text-3xl font-light text-[#1C4444] mb-1">
                    {analyses[0]?.conditions?.length || 0}
                  </p>
                  <p className="text-sm text-[#1C4444]/60">Active Concerns</p>
                </div>
                <div className="text-center p-4 bg-[#F4EBE7] rounded-lg">
                  <p className="text-3xl font-light text-[#1C4444] mb-1">
                    {analyses.length > 0 ? formatDate(analyses[0].createdAt).split(',')[0] : '-'}
                  </p>
                  <p className="text-sm text-[#1C4444]/60">Last Analysis</p>
                </div>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="bg-white rounded-xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium text-[#1C4444] mb-1">
                    Recent Analyses
                  </h2>
                  <p className="text-[#1C4444]/60 text-sm">
                    Your most recent skin analyses
                  </p>
                </div>
                <Link
                  href="/skin-analysis/history"
                  className="text-[#1C4444] hover:text-[#1C4444]/70 text-sm font-medium"
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
                      className="block p-4 border border-[#1C4444]/10 rounded-lg hover:border-[#1C4444]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#1C4444]">
                            {analysis.skinType ? `${analysis.skinType.charAt(0).toUpperCase() + analysis.skinType.slice(1)} Skin` : 'Analysis'}
                          </p>
                          <p className="text-sm text-[#1C4444]/60">
                            {formatDate(analysis.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.conditions?.slice(0, 2).map((c: { id: string; name: string }) => (
                            <span
                              key={c.id}
                              className="text-xs bg-[#F4EBE7] text-[#1C4444] px-2 py-1 rounded"
                            >
                              {c.name}
                            </span>
                          ))}
                          <svg className="w-5 h-5 text-[#1C4444]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#1C4444]/60 mb-4">No analyses yet</p>
                  <Link
                    href="/skin-analysis"
                    className="inline-flex items-center gap-2 btn-primary"
                  >
                    Start Your First Analysis
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/skin-analysis"
                className="bg-[#1C4444] text-white rounded-xl p-6 hover:bg-[#1C4444]/90 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg mb-1">New Analysis</h3>
                    <p className="text-white/70 text-sm">
                      Take a new photo to track your progress
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </Link>

              <Link
                href="/skin-analysis/history"
                className="bg-white border-2 border-[#1C4444] text-[#1C4444] rounded-xl p-6 hover:bg-[#1C4444] hover:text-white transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg mb-1">View Progress</h3>
                    <p className="opacity-70 text-sm">
                      See how your skin has improved
                    </p>
                  </div>
                  <svg className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
