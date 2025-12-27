'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/skin-analysis/ImageUpload'

export default function SkinAnalysisPage() {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleImageSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // Upload image and start analysis
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/skin-analysis/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      // Redirect to results page
      router.push(`/skin-analysis/results/${data.analysisId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Header */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Link
              href="/"
              className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] mb-6 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-[#1C4444] mb-4">
              AI Skin Analysis
            </h1>
            <p className="text-lg text-[#1C4444]/70 mb-2">
              Discover your skin&apos;s unique needs with our AI-powered analysis
            </p>
            <p className="text-[#1C4444]/50">
              Upload a clear, well-lit selfie and we&apos;ll analyze your skin type,
              detect concerns, and show you what your skin could look like in 20 years.
            </p>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-lg mx-auto">
            <ImageUpload
              onImageSelect={handleImageSelect}
              isLoading={isAnalyzing}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {selectedFile && !isAnalyzing && (
              <button
                onClick={handleAnalyze}
                className="w-full mt-6 btn-primary text-center"
              >
                Analyze My Skin
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
                Your photos are analyzed securely and not stored permanently.
                <br />
                We respect your privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-normal text-[#1C4444] text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-2xl font-light">
                1
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2">Upload Your Selfie</h3>
              <p className="text-[#1C4444]/60 text-sm">
                Take a clear photo in good lighting for the most accurate analysis
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-2xl font-light">
                2
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2">AI Analyzes Your Skin</h3>
              <p className="text-[#1C4444]/60 text-sm">
                Our AI detects skin type, conditions, and simulates aging
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-2xl font-light">
                3
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2">Get Personalized Advice</h3>
              <p className="text-[#1C4444]/60 text-sm">
                Receive product recommendations tailored to your unique skin needs
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
