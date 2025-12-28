import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Free Skin Age Test | How Old Does Your Skin Really Look?',
  description: 'Discover your true skin age with our free AI-powered skin age test. Upload a selfie and get instant results in 30 seconds. Join 50,000+ people who\'ve uncovered their skin\'s real age.',
  keywords: [
    'skin age test',
    'how old does my skin look',
    'skin age calculator',
    'biological skin age',
    'skin age analyzer',
    'free skin test',
    'AI skin analysis',
    'skin aging test',
    'real skin age',
    'skin health test',
  ],
  openGraph: {
    title: 'How Old Does Your Skin Really Look? | Free AI Skin Age Test',
    description: 'Take our free 30-second AI skin age test. Discover if your skin is aging faster or slower than you think.',
    url: 'https://ai.ayonne.skin/skin-age-test',
    type: 'website',
    images: [
      {
        url: '/og-skin-age-test.png',
        width: 1200,
        height: 630,
        alt: 'Ayonne AI Skin Age Test',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Skin Age Test | Ayonne AI',
    description: 'How old does your skin really look? Find out in 30 seconds with our free AI skin age test.',
  },
  alternates: {
    canonical: 'https://ai.ayonne.skin/skin-age-test',
  },
}

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Ayonne Skin Age Test',
  description: 'Free AI-powered skin age test that analyzes your photo to determine your biological skin age.',
  url: 'https://ai.ayonne.skin/skin-age-test',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '12847',
    bestRating: '5',
    worstRating: '1',
  },
}

const faqs = [
  {
    question: 'How does the skin age test work?',
    answer: 'Our AI analyzes your selfie using advanced computer vision to detect signs of aging like fine lines, wrinkles, dark spots, and skin texture. It compares these indicators against a database of thousands of skin profiles to estimate your biological skin age.',
  },
  {
    question: 'Is the skin age test accurate?',
    answer: 'Our AI has been trained on over 100,000 skin images and achieves 90%+ accuracy in detecting aging indicators. The test provides a reliable estimate of your skin\'s biological age compared to your chronological age.',
  },
  {
    question: 'What factors affect skin age?',
    answer: 'Sun exposure, smoking, diet, sleep, stress, skincare routine, and genetics all impact how fast your skin ages. Our test detects the visible results of these factors and recommends targeted solutions.',
  },
  {
    question: 'Can I improve my skin age?',
    answer: 'Yes! With the right skincare routine, many people see their skin age decrease by 5-10 years within 90 days. Our test provides personalized product recommendations based on your specific aging indicators.',
  },
  {
    question: 'Is the test really free?',
    answer: 'Yes, the skin age test is 100% free. No credit card required. You\'ll receive your skin age, a detailed analysis of aging indicators, and personalized anti-aging product recommendations.',
  },
]

export default function SkinAgeTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F4EBE7] to-white py-16 md:py-24">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#1C4444]/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <p className="text-[#9A8428] text-sm tracking-[0.2em] uppercase mb-4 animate-elegant-fade-in">
              Free AI-Powered Analysis
            </p>

            {/* H1 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1C4444] mb-6 leading-tight">
              How Old Does Your Skin{' '}
              <span className="relative">
                <span className="relative z-10">Really</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-[#D4AF37]/20 -z-0" />
              </span>{' '}
              Look?
            </h1>

            {/* H2 */}
            <p className="text-xl md:text-2xl text-[#1C4444]/70 mb-8 font-light">
              Free AI-Powered Skin Age Test in 30 Seconds
            </p>

            {/* Value props */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-[#1C4444]/60">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No App Download</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Instant Results</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Privacy Protected</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/skin-analysis"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white px-10 py-5 rounded-xl font-medium text-lg tracking-wide shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Discover Your Skin Age</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            {/* Social Proof */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1C4444] to-[#2D5A5A] border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                  >
                    {['S', 'M', 'J', 'A', 'R'][i - 1]}
                  </div>
                ))}
              </div>
              <p className="text-[#1C4444]/60 text-sm">
                Join <span className="font-semibold text-[#1C4444]">50,000+</span> people who&apos;ve discovered their true skin age
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-[#1C4444]/60 ml-1">4.8/5 from 12,847 tests</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Discover Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              What You&apos;ll Discover
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Our AI analyzes multiple aging indicators to give you a complete picture of your skin&apos;s health
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="card-luxury p-8 text-center hover:border-[#D4AF37]/30">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-3">Your Skin Age</h3>
              <p className="text-[#1C4444]/60 text-sm leading-relaxed">
                Find out if your skin is aging faster or slower than your actual age. Most people are surprised by the results!
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-luxury p-8 text-center hover:border-[#D4AF37]/30">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1C4444]/20 to-[#1C4444]/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-3">Aging Indicators</h3>
              <p className="text-[#1C4444]/60 text-sm leading-relaxed">
                See exactly what&apos;s aging your skin: fine lines, wrinkles, dark spots, sun damage, loss of elasticity, and more.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-luxury p-8 text-center hover:border-[#D4AF37]/30">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-3">Improvement Potential</h3>
              <p className="text-[#1C4444]/60 text-sm leading-relaxed">
                Discover how many years younger your skin could look with the right routine. Average improvement: 5-8 years.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20 bg-[#F4EBE7]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
              How the Skin Age Test Works
            </h2>
            <p className="text-[#1C4444]/60 max-w-2xl mx-auto">
              Get your results in 3 simple steps — no app download required
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-3xl font-light shadow-luxury">
                1
              </div>
              <h3 className="text-lg font-medium text-[#1C4444] mb-2">Take a Selfie</h3>
              <p className="text-[#1C4444]/60 text-sm">
                Use your phone or webcam. Good lighting, no makeup works best.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-3xl font-light shadow-luxury">
                2
              </div>
              <h3 className="text-lg font-medium text-[#1C4444] mb-2">AI Analysis</h3>
              <p className="text-[#1C4444]/60 text-sm">
                Our AI scans for 12+ aging indicators in just 30 seconds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1C4444] text-white flex items-center justify-center text-3xl font-light shadow-luxury">
                3
              </div>
              <h3 className="text-lg font-medium text-[#1C4444] mb-2">Get Your Age</h3>
              <p className="text-[#1C4444]/60 text-sm">
                See your skin age, what&apos;s causing it, and how to turn back the clock.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/skin-analysis"
              className="inline-flex items-center gap-2 bg-[#1C4444] text-white px-8 py-4 rounded-lg font-medium tracking-wide hover:bg-[#2D5A5A] transition-all duration-300"
            >
              Start Your Free Test
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Results Preview Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#9A8428] text-sm tracking-[0.2em] uppercase mb-4">
                  Sample Results
                </p>
                <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-6">
                  See What Your Results Will Look Like
                </h2>
                <p className="text-[#1C4444]/60 mb-6 leading-relaxed">
                  You&apos;ll receive a comprehensive analysis showing your biological skin age compared to your actual age, plus personalized recommendations to help reverse the signs of aging.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Precise skin age calculation',
                    'Breakdown of aging indicators',
                    'Achievable skin age with proper care',
                    'Personalized anti-aging product recommendations',
                    'Track progress over time',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#1C4444]/70">
                      <svg className="w-5 h-5 text-[#D4AF37] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/skin-analysis"
                  className="inline-flex items-center gap-2 text-[#1C4444] font-medium hover:text-[#D4AF37] transition-colors"
                >
                  Get Your Results Now
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>

              {/* Results Preview Card */}
              <div className="card-luxury p-8 bg-gradient-to-br from-white to-[#F4EBE7]/50">
                <div className="text-center mb-6">
                  <p className="text-[#1C4444]/50 text-xs uppercase tracking-widest mb-2">Your Skin Age</p>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <p className="text-5xl font-light text-[#1C4444]">32</p>
                      <p className="text-xs text-[#1C4444]/50">Current</p>
                    </div>
                    <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <div>
                      <p className="text-5xl font-light text-[#D4AF37]">26</p>
                      <p className="text-xs text-[#1C4444]/50">Achievable</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#1C4444]/60 mt-2">
                    Your skin could look <span className="text-[#D4AF37] font-medium">6 years younger</span>
                  </p>
                </div>

                <div className="border-t border-[#1C4444]/10 pt-6">
                  <p className="text-xs text-[#1C4444]/50 uppercase tracking-widest mb-4">Detected Indicators</p>
                  <div className="space-y-3">
                    {[
                      { name: 'Fine Lines', level: 65 },
                      { name: 'Dark Spots', level: 45 },
                      { name: 'Wrinkles', level: 30 },
                      { name: 'Dullness', level: 55 },
                    ].map((indicator) => (
                      <div key={indicator.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#1C4444]/70">{indicator.name}</span>
                          <span className="text-[#1C4444]/50">{indicator.level}%</span>
                        </div>
                        <div className="h-1.5 bg-[#1C4444]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] rounded-full"
                            style={{ width: `${indicator.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-[#1C4444]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              What People Are Saying
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Join thousands who&apos;ve discovered their true skin age
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "I thought my skin was doing fine until the test showed I was aging 8 years faster than my actual age! The product recommendations really helped.",
                name: "Sarah M.",
                age: "34",
                result: "Skin age improved 5 years",
              },
              {
                quote: "Amazing that it's free! The AI detected sun damage I didn't even know I had. Now I'm religious about SPF.",
                name: "Jennifer K.",
                age: "42",
                result: "Skin age: 38 (4 years younger!)",
              },
              {
                quote: "I was skeptical but the results were spot-on. It found the exact areas I've been worried about and gave me a clear plan.",
                name: "Michelle R.",
                age: "29",
                result: "Skin age matches actual age",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.name}</p>
                    <p className="text-white/50 text-xs">Age {testimonial.age}</p>
                  </div>
                  <p className="text-[#D4AF37] text-xs">{testimonial.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group border border-[#1C4444]/10 rounded-lg overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer bg-white hover:bg-[#F4EBE7]/50 transition-colors">
                    <h3 className="text-[#1C4444] font-medium pr-4">{faq.question}</h3>
                    <svg
                      className="w-5 h-5 text-[#1C4444] flex-shrink-0 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-5 pt-0 bg-[#F4EBE7]/30">
                    <p className="text-[#1C4444]/70 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#F4EBE7] to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] mb-6">
              Ready to Discover Your True Skin Age?
            </h2>
            <p className="text-[#1C4444]/60 mb-8 text-lg">
              It only takes 30 seconds. No app download. 100% free.
            </p>
            <Link
              href="/skin-analysis"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#1C4444] to-[#2D5A5A] text-white px-12 py-5 rounded-xl font-medium text-lg tracking-wide shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Take the Free Skin Age Test</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <p className="text-[#1C4444]/40 text-sm mt-6">
              Your photos are analyzed securely and never stored without your permission.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
