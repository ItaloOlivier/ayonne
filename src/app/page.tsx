import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { SHOPIFY_STORE_URL } from '@/lib/shopify'

export const metadata: Metadata = {
  title: 'Free AI Skin Analysis | Personalized Skincare Recommendations',
  description: 'Discover your perfect skincare routine with Ayonne\'s free AI Skin Analyzer. Upload a selfie, get instant skin analysis, and receive personalized product recommendations for your unique skin type and concerns.',
  alternates: {
    canonical: 'https://ai.ayonne.skin',
  },
  openGraph: {
    title: 'Free AI Skin Analysis | Ayonne',
    description: 'Upload a selfie and get instant AI-powered skin analysis with personalized recommendations.',
    url: 'https://ai.ayonne.skin',
  },
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#F4EBE7] via-[#F4EBE7]/95 to-white py-20 md:py-32 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#1C4444]/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/[0.03] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37] mb-6 animate-elegant-fade-in">
              Advanced AI Technology
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1C4444] mb-8 tracking-tight leading-tight">
              Discover Your Perfect <br className="hidden md:block" />
              <span className="font-normal">Skincare Routine</span>
            </h1>
            <p className="text-lg md:text-xl text-[#1C4444]/65 mb-10 max-w-2xl mx-auto leading-relaxed">
              Our AI-powered skin analyzer examines your unique skin characteristics and recommends
              personalized products from the Ayonne collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="/skin-analysis"
                className="inline-flex items-center justify-center gap-3 bg-[#1C4444] text-white text-lg px-10 py-5 rounded-xl hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg hover:-translate-y-0.5 btn-luxury"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Start AI Skin Analysis
              </Link>
              <a
                href={SHOPIFY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 border-2 border-[#1C4444] text-[#1C4444] text-lg px-10 py-5 rounded-xl hover:bg-[#1C4444] hover:text-white transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop All Products
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] text-center mb-4">
            Simple Process
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] text-center mb-16 tracking-tight">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-light shadow-luxury group-hover:shadow-luxury-lg transition-all duration-300 group-hover:-translate-y-1">
                1
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-3 tracking-wide">Upload Your Photo</h3>
              <p className="text-[#1C4444]/55 leading-relaxed">
                Take a clear selfie or upload an existing photo. Our AI works best with good lighting and a front-facing view.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1C4444] to-[#1C4444]/90 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-light shadow-luxury group-hover:shadow-luxury-lg transition-all duration-300 group-hover:-translate-y-1">
                2
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-3 tracking-wide">AI Analysis</h3>
              <p className="text-[#1C4444]/55 leading-relaxed">
                Our advanced AI examines your skin for concerns like fine lines, texture, hydration, and more.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-light shadow-luxury group-hover:shadow-luxury-lg transition-all duration-300 group-hover:-translate-y-1">
                3
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-3 tracking-wide">Get Recommendations</h3>
              <p className="text-[#1C4444]/55 leading-relaxed">
                Receive personalized product recommendations from Ayonne tailored to your unique skin needs.
              </p>
            </div>
          </div>
          <div className="text-center mt-16">
            <Link
              href="/skin-analysis"
              className="inline-flex items-center gap-3 bg-[#1C4444] text-white px-10 py-4 rounded-xl hover:bg-[#1C4444]/90 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg hover:-translate-y-0.5 btn-luxury"
            >
              Try It Now - It&apos;s Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Ayonne */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] text-center mb-4">
            Our Promise
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] text-center mb-5 tracking-tight">
            Why Choose Ayonne
          </h2>
          <p className="text-[#1C4444]/55 text-center mb-14 max-w-2xl mx-auto leading-relaxed">
            Our skincare products are designed to turn back time without compromising your values.
          </p>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="card-luxury p-8 text-center group">
              <div className="w-14 h-14 mx-auto mb-5 text-[#1C4444] group-hover:text-[#D4AF37] transition-colors duration-300">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2 tracking-wide">Cruelty Free</h3>
              <p className="text-sm text-[#1C4444]/55">Never tested on animals</p>
            </div>
            <div className="card-luxury p-8 text-center group">
              <div className="w-14 h-14 mx-auto mb-5 text-[#1C4444] group-hover:text-[#D4AF37] transition-colors duration-300">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2 tracking-wide">Vegan</h3>
              <p className="text-sm text-[#1C4444]/55">100% plant-based ingredients</p>
            </div>
            <div className="card-luxury p-8 text-center group">
              <div className="w-14 h-14 mx-auto mb-5 text-[#1C4444] group-hover:text-[#D4AF37] transition-colors duration-300">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2 tracking-wide">Paraben Free</h3>
              <p className="text-sm text-[#1C4444]/55">Clean, safe formulas</p>
            </div>
            <div className="card-luxury p-8 text-center group">
              <div className="w-14 h-14 mx-auto mb-5 text-[#1C4444] group-hover:text-[#D4AF37] transition-colors duration-300">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2 tracking-wide">Fast Shipping</h3>
              <p className="text-sm text-[#1C4444]/55">Ships from North America</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-[#1C4444] via-[#1C4444] to-[#1C4444]/95 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/[0.05] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 text-center relative">
          <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] mb-5">
            Begin Your Journey
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 tracking-tight">
            Ready to Transform Your Skin?
          </h2>
          <p className="text-white/60 mb-10 max-w-xl mx-auto leading-relaxed text-lg">
            Start your personalized skincare journey today with our free AI analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              href="/skin-analysis"
              className="inline-flex items-center justify-center gap-3 bg-white text-[#1C4444] px-10 py-5 rounded-xl hover:bg-white/95 transition-all duration-300 font-medium shadow-luxury-lg hover:shadow-2xl hover:-translate-y-0.5"
            >
              Get Your Free Analysis
            </Link>
            <a
              href={SHOPIFY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border-2 border-white/80 text-white px-10 py-5 rounded-xl hover:bg-white hover:text-[#1C4444] transition-all duration-300"
            >
              Visit Ayonne Store
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
