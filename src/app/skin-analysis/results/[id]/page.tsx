import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AnalysisResults from '@/components/skin-analysis/AnalysisResults'
import ProductRecommendations from '@/components/skin-analysis/ProductRecommendations'
import SkincareAdvice from '@/components/skin-analysis/SkincareAdvice'
import ResultsClientWrapper from '@/components/skin-analysis/ResultsClientWrapper'
import SkinHealthScore from '@/components/skin-analysis/SkinHealthScore'
import SocialProof from '@/components/skin-analysis/SocialProof'
import DataExpiryWarning from '@/components/skin-analysis/DataExpiryWarning'
import { SkinType, DetectedCondition } from '@/lib/skin-analysis/conditions'
import { calculateHealthScore } from '@/lib/skin-analysis/health-score'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getAnalysis(id: string) {
  try {
    const analysis = await prisma.skinAnalysis.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    })

    return analysis
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return null
  }
}

async function getCustomerStats(customerId: string) {
  try {
    const analyses = await prisma.skinAnalysis.findMany({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        conditions: true,
        createdAt: true,
      },
    })

    if (analyses.length <= 1) return null

    const scores = analyses.map(a => {
      const conditions = (a.conditions as unknown as DetectedCondition[]) || []
      return calculateHealthScore(conditions)
    })

    return {
      totalAnalyses: analyses.length,
      firstScore: scores[0] || 0,
      previousScore: scores.length > 1 ? scores[scores.length - 2] : scores[0],
      currentStreak: calculateStreak(analyses.map(a => a.createdAt.toISOString())),
    }
  } catch {
    return null
  }
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const sorted = [...dates]
    .map(d => new Date(d).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = Math.floor(
      (new Date(sorted[i]).getTime() - new Date(sorted[i + 1]).getTime()) / 86400000
    )
    if (diff === 1) streak++
    else break
  }

  return streak
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
    productShopifySlug?: string | null
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

  // Calculate health score
  const currentScore = calculateHealthScore(conditions as DetectedCondition[])

  // Get customer stats for returning users
  const customerStats = analysis.customerId
    ? await getCustomerStats(analysis.customerId)
    : null

  const improvement = customerStats
    ? currentScore - customerStats.previousScore
    : 0

  return (
    <div className="min-h-screen bg-[#F4EBE7]">
      {/* Social Proof Banner - Live Activity */}
      <SocialProof variant="banner" />

      {/* Header */}
      <section className="py-6 md:py-8 border-b border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/skin-analysis"
                  className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  New Analysis
                </Link>
                <Link
                  href="/skin-analysis/history"
                  className="inline-flex items-center text-[#1C4444]/60 hover:text-[#1C4444] transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  My Progress
                </Link>
              </div>

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
          </div>
        </div>
      </section>

      {/* Results Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Score Hero Section */}
            <div className="bg-white rounded-2xl p-8 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1C4444]/5 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-[#1C4444]/5 to-transparent rounded-full translate-x-1/4 translate-y-1/4" />

              <div className="relative z-10">
                {/* Greeting for returning users */}
                {analysis.customer && (
                  <p className="text-[#1C4444]/60 mb-2">
                    {analysis.customer.firstName}&apos;s Results
                  </p>
                )}

                <h1 className="text-2xl md:text-3xl font-normal text-[#1C4444] mb-6">
                  Your Skin Health Score
                </h1>

                <div className="flex justify-center mb-6">
                  <SkinHealthScore
                    score={currentScore}
                    size="lg"
                    animate={true}
                  />
                </div>

                {/* Improvement indicator */}
                {improvement !== 0 && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                    improvement > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <svg
                      className={`w-5 h-5 ${improvement < 0 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="font-medium">
                      {improvement > 0 ? '+' : ''}{improvement} points since last analysis
                    </span>
                  </div>
                )}

                {/* Score message */}
                <p className="text-[#1C4444]/70 max-w-md mx-auto">
                  {currentScore >= 80
                    ? 'Excellent! Your skin is in great condition. Keep up your current routine!'
                    : currentScore >= 60
                    ? 'Good progress! A few targeted products can help address your remaining concerns.'
                    : currentScore >= 40
                    ? 'Your skin has some areas that need attention. Our recommendations can help.'
                    : 'Let\'s work on improving your skin health with a personalized routine.'}
                </p>

                {/* Stats for returning users */}
                {customerStats && (
                  <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-[#1C4444]/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#1C4444]">{customerStats.totalAnalyses}</div>
                      <div className="text-xs text-[#1C4444]/60">Total Analyses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{customerStats.currentStreak}🔥</div>
                      <div className="text-xs text-[#1C4444]/60">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+{currentScore - customerStats.firstScore}</div>
                      <div className="text-xs text-[#1C4444]/60">Total Improvement</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Data Expiry Warning for Guest Users */}
            <DataExpiryWarning
              createdAt={analysis.createdAt.toISOString()}
              isGuest={!analysis.customerId}
            />

            {/* Row: Photo + Analysis Side by Side */}
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

            {/* Limited Time Offer Banner */}
            {recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white rounded-xl p-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-2xl animate-pulse" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '150ms' }} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                      <span className="animate-bounce text-2xl">⚡</span>
                      <h3 className="text-lg font-bold">PERSONALIZED FOR YOU</h3>
                    </div>
                    <p className="text-sm opacity-90">
                      Products matched to your exact skin concerns
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>AI-matched products</span>
                  </div>
                </div>
              </div>
            )}

            {/* Product Recommendations */}
            <ProductRecommendations recommendations={recommendations} />

            {/* Skincare Advice */}
            <SkincareAdvice advice={advice} />

            {/* Track Progress CTA */}
            <div className="bg-gradient-to-r from-[#1C4444] to-[#2d6a6a] text-white rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium">Track Your Progress</h3>
                  <p className="text-white/80 text-sm">
                    Analyze daily to see improvements and unlock achievements!
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/skin-analysis/history"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1C4444] rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View My Progress
                  </Link>
                </div>
              </div>
            </div>

            {/* Achievement Teaser */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-medium text-[#1C4444]">Keep Going!</h3>
                <span className="px-2 py-1 bg-[#1C4444]/10 text-[#1C4444] text-xs rounded-full">
                  Unlock achievements
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#F4EBE7] rounded-lg">
                  <div className="text-2xl mb-2">🔥</div>
                  <p className="text-sm font-medium text-[#1C4444]">7-Day Streak</p>
                  <p className="text-xs text-[#1C4444]/60">
                    {customerStats?.currentStreak
                      ? `${7 - customerStats.currentStreak} more days`
                      : 'Analyze 7 days in a row'}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#F4EBE7] rounded-lg">
                  <div className="text-2xl mb-2">⭐</div>
                  <p className="text-sm font-medium text-[#1C4444]">Glow Up</p>
                  <p className="text-xs text-[#1C4444]/60">
                    Improve 10+ points
                  </p>
                </div>
                <div className="text-center p-4 bg-[#F4EBE7] rounded-lg">
                  <div className="text-2xl mb-2">💎</div>
                  <p className="text-sm font-medium text-[#1C4444]">Flawless</p>
                  <p className="text-xs text-[#1C4444]/60">
                    Reach 90+ score
                  </p>
                </div>
              </div>
            </div>

            {/* Try Again CTA */}
            <div className="text-center py-4">
              <p className="text-[#1C4444]/50 text-sm mb-2">
                Come back tomorrow for your next analysis
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

      {/* Client-side features: Install prompt, celebrations, purchase popups, spin wheel */}
      <ResultsClientWrapper
        improvement={improvement}
        isNewUser={!customerStats}
        analysisId={analysis.id}
      />
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: 'Your Skin Analysis Results',
    description: 'View your personalized skin analysis results and product recommendations.',
  }
}
