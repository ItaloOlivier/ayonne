'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MultiAngleUpload, { CapturedImage } from '@/components/skin-analysis/MultiAngleUpload'
import SignupForm from '@/components/skin-analysis/SignupForm'
import AnalysisProgress from '@/components/skin-analysis/AnalysisProgress'

type Step = 'capture' | 'signup' | 'analyzing'

export default function SkinAnalysisPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('capture')
  const [error, setError] = useState<string | null>(null)
  const [multiAngleImages, setMultiAngleImages] = useState<CapturedImage[]>([])
  const [storedCustomerId, setStoredCustomerIdState] = useState<string | null>(null)
  const [isCheckingUser, setIsCheckingUser] = useState(true)

  // Check for existing user on mount via cookie-based auth
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.customer) {
          setStoredCustomerIdState(data.customer.id)
        } else {
          setStoredCustomerIdState(null)
        }
      })
      .catch(() => {
        setStoredCustomerIdState(null)
      })
      .finally(() => {
        setIsCheckingUser(false)
      })
  }, [])

  const handleMultiAngleComplete = (images: CapturedImage[]) => {
    setMultiAngleImages(images)

    // If user already has an account, go straight to analyzing
    if (storedCustomerId) {
      runAnalysis(storedCustomerId, images)
    } else {
      setStep('signup')
    }
  }

  const runAnalysis = async (customerId: string, images?: CapturedImage[]) => {
    const imagesToUse = images || multiAngleImages
    if (imagesToUse.length !== 3) return

    setStep('analyzing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('customerId', customerId)

      const frontImage = imagesToUse.find(img => img.angle === 'front')
      const leftImage = imagesToUse.find(img => img.angle === 'left')
      const rightImage = imagesToUse.find(img => img.angle === 'right')

      if (!frontImage || !leftImage || !rightImage) {
        throw new Error('Missing required images for analysis')
      }

      formData.append('frontImage', frontImage.file)
      formData.append('leftImage', leftImage.file)
      formData.append('rightImage', rightImage.file)

      const response = await fetch('/api/skin-analysis/analyze-multi', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(data.error || 'You have already used the skin analyzer today. Please try again tomorrow.')
        }
        throw new Error(data.error || 'Analysis failed')
      }

      // Redirect to results page
      router.push(`/skin-analysis/results/${data.analysisId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('capture')
    }
  }

  const handleSignupSuccess = async (customerId: string) => {
    // Cookie is set automatically by the register API
    setStoredCustomerIdState(customerId)

    // Run the analysis
    runAnalysis(customerId)
  }

  const handleCancelSignup = () => {
    setStep('capture')
  }

  const handleStartOver = () => {
    setMultiAngleImages([])
    setError(null)
    setStep('capture')
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
            {step === 'capture' && (
              <p className="text-[#1C4444]/50">
                Capture photos from three angles for a comprehensive and accurate analysis.
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

            {/* Step 1: Multi-angle capture */}
            {step === 'capture' && (
              <>
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <MultiAngleUpload
                  onImagesComplete={handleMultiAngleComplete}
                  isLoading={false}
                />

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
                {/* Show captured images */}
                {multiAngleImages.length === 3 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      {multiAngleImages.map((img) => (
                        <div key={img.angle} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#1C4444]/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.preview}
                            alt={`${img.angle} view`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-[#1C4444]/60 text-xs mt-2">3 photos ready for analysis</p>
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
              <>
                {/* Photo thumbnails */}
                {multiAngleImages.length === 3 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      {multiAngleImages.map((img) => (
                        <div key={img.angle} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#1C4444]/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.preview}
                            alt={`${img.angle} view`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-white/60" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 bg-[#1C4444] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-[#1C4444]/50 text-xs mt-2">Photos captured</p>
                  </div>
                )}

                {/* Progress indicator */}
                <AnalysisProgress isAnalyzing={true} />

                <button
                  onClick={handleStartOver}
                  className="mt-6 w-full text-[#1C4444]/50 hover:text-[#1C4444] text-sm transition-colors py-2"
                >
                  Cancel and start over
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works - only show on capture step */}
      {step === 'capture' && (
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
                <h3 className="font-medium text-[#1C4444] mb-2">Capture 3 Angles</h3>
                <p className="text-[#1C4444]/60 text-sm">
                  Take photos from front, left, and right for a complete skin assessment
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
                  Our AI examines all angles to detect skin type and conditions
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
