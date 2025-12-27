import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AnalysisResults from '@/components/skin-analysis/AnalysisResults'
import ProductRecommendations from '@/components/skin-analysis/ProductRecommendations'
import SkincareAdvice from '@/components/skin-analysis/SkincareAdvice'
import ResultsClientWrapper from '@/components/skin-analysis/ResultsClientWrapper'
import { SkinType } from '@/lib/skin-analysis/conditions'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getAnalysis(id: string) {
  try {
    const analysis = await prisma.skinAnalysis.findUnique({
      where: { id },
    })

    return analysis
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return null
  }
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params
  const analysis = await getAnalysis(id)

  if (!analysis) {
    notFound()
  }

  if (analysis.status === 'PROCESSING') {
    return (
      <div className="min-h-screen bg-[#F4EBE7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1C4444] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-normal text-[#1C4444] mb-2">Analyzing Your Skin...</h1>
          <p className="text-[#1C4444]/60">This may take up to 30 seconds</p>
        </div>
      </div>
    )
  }

  if (analysis.status === 'FAILED') {
    return (
      <div className="min-h-screen bg-[#F4EBE7] py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-normal text-[#1C4444] mb-2">Analysis Failed</h1>
            <p className="text-[#1C4444]/60 mb-6">
              {analysis.errorMessage || 'We couldn\'t analyze your image. Please try again with a different photo.'}
            </p>
            <Link href="/skin-analysis" className="btn-primary inline-block">
              Try Again
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const conditions = (analysis.conditions as Array<{
    id: string
    name: string
    confidence: number
    description: string
  }>) || []

  const recommendations = (analysis.recommendations as Array<{
    productId: string
    productName: string
    productSlug: string
    productImage: string | null
    productPrice: number
    productSalePrice: number | null
    reason: string
    relevanceScore: number
  }>) || []

  const advice = (analysis.advice as Array<{
    title: string
    tip: string
    priority: 'high' | 'medium' | 'low'
  }>) || []

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Header */}
      <section className="py-8 md:py-12 border-b border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <Link
                href="/skin-analysis"
                className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                New Analysis
              </Link>

              <div className="text-right">
                <p className="text-sm text-[#1C4444]/50">
                  Analysis completed
                </p>
                <p className="text-xs text-[#1C4444]/40">
                  {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-normal text-[#1C4444] mt-6 text-center">
              Your Skin Analysis Results
            </h1>
          </div>
        </div>
      </section>

      {/* Results Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Row 1: Photo + Analysis Side by Side on larger screens */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Your Photo */}
              <div className="bg-white rounded-xl p-6">
                <h3 className="text-lg font-medium text-[#1C4444] mb-4">Your Photo</h3>
                <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-[#F4EBE7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={analysis.originalImage}
                    alt="Your uploaded photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Skin Analysis Results */}
              <AnalysisResults
                skinType={analysis.skinType as SkinType | null}
                conditions={conditions}
              />
            </div>

            {/* Product Recommendations */}
            <ProductRecommendations recommendations={recommendations} />

            {/* Skincare Advice */}
            <SkincareAdvice advice={advice} />

            {/* Come back tomorrow CTA */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-[#1C4444]">Track Your Progress</h3>
                  <p className="text-[#1C4444]/60 text-sm">
                    Come back tomorrow to analyze your skin again and track improvements over time.
                  </p>
                </div>
                <Link
                  href="/"
                  className="btn-secondary whitespace-nowrap"
                >
                  Browse Products
                </Link>
              </div>
            </div>

            {/* Try Again CTA */}
            <div className="text-center py-8">
              <p className="text-[#1C4444]/50 text-sm mb-2">
                You can perform one skin analysis per day
              </p>
              <Link
                href="/skin-analysis"
                className="inline-flex items-center gap-2 text-[#1C4444] hover:text-[#1C4444]/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Back to Skin Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Install App Prompt */}
      <ResultsClientWrapper />
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: 'Your Skin Analysis Results',
    description: 'View your personalized skin analysis results and product recommendations.',
  }
}
