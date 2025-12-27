'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/skin-analysis/ImageUpload'
import SignupForm from '@/components/skin-analysis/SignupForm'

type Step = 'upload' | 'signup' | 'analyzing'

// Helper to get/set customer ID from localStorage
const CUSTOMER_STORAGE_KEY = 'ayonne_customer_id'
const CUSTOMER_DATA_KEY = 'ayonne_customer_data'

function getStoredCustomerId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CUSTOMER_STORAGE_KEY)
}

function setStoredCustomerId(customerId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOMER_STORAGE_KEY, customerId)
}

export default function SkinAnalysisPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [storedCustomerId, setStoredCustomerIdState] = useState<string | null>(null)
  const [isCheckingUser, setIsCheckingUser] = useState(true)

  // Check for existing user on mount
  useEffect(() => {
    const customerId = getStoredCustomerId()
    if (customerId) {
      // Verify the customer still exists
      fetch(`/api/skin-analysis/verify-customer?id=${customerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setStoredCustomerIdState(customerId)
          } else {
            // Clear invalid customer ID
            localStorage.removeItem(CUSTOMER_STORAGE_KEY)
          }
        })
        .catch(() => {
          // On error, keep the ID but let the analysis endpoint validate it
          setStoredCustomerIdState(customerId)
        })
        .finally(() => {
          setIsCheckingUser(false)
        })
    } else {
      setIsCheckingUser(false)
    }
  }, [])

  const handleImageSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleProceedToSignup = () => {
    if (!selectedFile) return

    // If user already has an account, go straight to analyzing
    if (storedCustomerId) {
      runAnalysis(storedCustomerId)
    } else {
      setStep('signup')
    }
  }

  const runAnalysis = async (customerId: string) => {
    if (!selectedFile) return

    setStep('analyzing')
    setError(null)

    try {
      // Upload image and start analysis
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('customerId', customerId)

      const response = await fetch('/api/skin-analysis/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // If daily limit reached, show specific error
        if (response.status === 429) {
          throw new Error(data.error || 'You have already used the skin analyzer today. Please try again tomorrow.')
        }
        throw new Error(data.error || 'Analysis failed')
      }

      // Redirect to results page
      router.push(`/skin-analysis/results/${data.analysisId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('upload')
    }
  }

  const handleSignupSuccess = async (customerId: string, customerData: { id: string; email: string; firstName: string; lastName: string | null; phone: string | null; createdAt: string; analysisCount: number }) => {
    // Store the customer ID and data for future visits
    setStoredCustomerId(customerId)
    setStoredCustomerIdState(customerId)
    localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customerData))

    // Run the analysis
    runAnalysis(customerId)
  }

  const handleCancelSignup = () => {
    setStep('upload')
  }

  const handleStartOver = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setError(null)
    setStep('upload')
  }

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Header */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/"
                className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>

              {storedCustomerId && (
                <Link
                  href="/skin-analysis/history"
                  className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  My Progress
                </Link>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-[#1C4444] mb-4">
              AI Skin Analysis
            </h1>
            <p className="text-lg text-[#1C4444]/70 mb-2">
              Discover your skin&apos;s unique needs with our AI-powered analysis
            </p>
            {step === 'upload' && (
              <p className="text-[#1C4444]/50">
                Take a clear, well-lit selfie and we&apos;ll analyze your skin type,
                detect concerns, and recommend personalized products.
              </p>
            )}
            {step === 'signup' && (
              <p className="text-[#1C4444]/50">
                Create an account to view your results and track your skin health over time.
              </p>
            )}
            {step === 'analyzing' && (
              <p className="text-[#1C4444]/50">
                Please wait while we analyze your skin...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-lg mx-auto">

            {/* Step 1: Upload */}
            {step === 'upload' && (
              <>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  isLoading={false}
                />

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {selectedFile && (
                  <button
                    onClick={handleProceedToSignup}
                    className="w-full mt-6 btn-primary text-center"
                  >
                    Continue to Get Results
                  </button>
                )}

                {/* Tips */}
                <div className="mt-8 p-6 bg-white rounded-xl">
                  <h3 className="font-medium text-[#1C4444] mb-4">
                    For best results:
                  </h3>
                  <ul className="space-y-2 text-[#1C4444]/70 text-sm">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#1C4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Use natural, even lighting (face a window or go outside)
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#1C4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Remove glasses and pull back hair
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#1C4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Keep a neutral expression and look straight at the camera
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#1C4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Avoid heavy makeup for accurate skin analysis
                    </li>
                  </ul>
                </div>

                {/* Privacy Note */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-[#1C4444]/50">
                    Your photos are analyzed securely.
                    <br />
                    We respect your privacy.
                  </p>
                </div>
              </>
            )}

            {/* Step 2: Signup */}
            {step === 'signup' && (
              <>
                {/* Show selected image thumbnail */}
                {imagePreview && (
                  <div className="mb-6">
                    <div className="relative aspect-video max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-[#1C4444]/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Your photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute bottom-2 left-2 bg-white/90 text-[#1C4444] text-xs px-2 py-1 rounded">
                        Photo ready for analysis
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <SignupForm
                  onSuccess={handleSignupSuccess}
                  onCancel={handleCancelSignup}
                />

                {/* Daily limit info */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-[#1C4444]/50">
                    Note: Each user can perform one skin analysis per day.
                  </p>
                </div>
              </>
            )}

            {/* Step 3: Analyzing */}
            {step === 'analyzing' && (
              <div className="bg-white rounded-xl p-8 text-center">
                {imagePreview && (
                  <div className="relative aspect-square max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-[#1C4444]/20 mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Analyzing"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[#1C4444] font-medium">Analyzing your skin...</p>
                        <p className="text-[#1C4444]/60 text-sm mt-1">This may take 15-30 seconds</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[#1C4444]/60 text-sm">
                  Our AI is examining your skin type, detecting conditions, and preparing personalized recommendations.
                </p>

                <button
                  onClick={handleStartOver}
                  className="mt-6 text-[#1C4444]/50 hover:text-[#1C4444] text-sm transition-colors"
                >
                  Cancel and start over
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works - only show on upload step */}
      {step === 'upload' && (
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-2xl font-light">
                  1
                </div>
                <h3 className="font-medium text-[#1C4444] mb-2">Take Your Selfie</h3>
                <p className="text-[#1C4444]/60 text-sm">
                  Take a clear photo in good lighting for the most accurate analysis
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-2xl font-light">
                  2
                </div>
                <h3 className="font-medium text-[#1C4444] mb-2">Create Account</h3>
                <p className="text-[#1C4444]/60 text-sm">
                  Sign up to save your results and track progress over time
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-2xl font-light">
                  3
                </div>
                <h3 className="font-medium text-[#1C4444] mb-2">AI Analysis</h3>
                <p className="text-[#1C4444]/60 text-sm">
                  Our AI detects skin type and conditions
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-2xl font-light">
                  4
                </div>
                <h3 className="font-medium text-[#1C4444] mb-2">Get Recommendations</h3>
                <p className="text-[#1C4444]/60 text-sm">
                  Receive personalized product recommendations
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
