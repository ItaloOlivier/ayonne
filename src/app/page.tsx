import Link from 'next/link'
import Image from 'next/image'
import { SHOPIFY_STORE_URL } from '@/lib/shopify'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#F4EBE7] to-white py-16 md:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#1C4444] mb-6">
              Discover Your Perfect Skincare Routine
            </h1>
            <p className="text-lg md:text-xl text-[#1C4444]/70 mb-8 max-w-2xl mx-auto">
              Our AI-powered skin analyzer examines your unique skin characteristics and recommends
              personalized products from the Ayonne collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/skin-analysis"
                className="inline-flex items-center justify-center gap-2 bg-[#1C4444] text-white text-lg px-8 py-4 rounded-lg hover:bg-[#1C4444]/90 transition-colors"
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
                className="inline-flex items-center justify-center gap-2 border-2 border-[#1C4444] text-[#1C4444] text-lg px-8 py-4 rounded-lg hover:bg-[#1C4444] hover:text-white transition-colors"
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
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1C4444] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-light">
                1
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-2">Upload Your Photo</h3>
              <p className="text-[#1C4444]/60">
                Take a clear selfie or upload an existing photo. Our AI works best with good lighting and a front-facing view.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1C4444] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-light">
                2
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-2">AI Analysis</h3>
              <p className="text-[#1C4444]/60">
                Our advanced AI examines your skin for concerns like fine lines, texture, hydration, and more.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1C4444] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-light">
                3
              </div>
              <h3 className="text-xl font-medium text-[#1C4444] mb-2">Get Recommendations</h3>
              <p className="text-[#1C4444]/60">
                Receive personalized product recommendations from Ayonne tailored to your unique skin needs.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              href="/skin-analysis"
              className="inline-flex items-center gap-2 bg-[#1C4444] text-white px-8 py-3 rounded-lg hover:bg-[#1C4444]/90 transition-colors"
            >
              Try It Now - It&apos;s Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Ayonne */}
      <section className="py-16 md:py-20 bg-[#F4EBE7]">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-light text-[#1C4444] text-center mb-4">
            Why Choose Ayonne
          </h2>
          <p className="text-[#1C4444]/60 text-center mb-12 max-w-2xl mx-auto">
            Our skincare products are designed to turn back time without compromising your values.
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-[#1C4444]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2">Cruelty Free</h3>
              <p className="text-sm text-[#1C4444]/60">Never tested on animals</p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-[#1C4444]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2">Vegan</h3>
              <p className="text-sm text-[#1C4444]/60">100% plant-based ingredients</p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-[#1C4444]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2">Paraben Free</h3>
              <p className="text-sm text-[#1C4444]/60">Clean, safe formulas</p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-[#1C4444]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-medium text-[#1C4444] mb-2">Fast Shipping</h3>
              <p className="text-sm text-[#1C4444]/60">Ships from North America</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-[#1C4444]">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Ready to Transform Your Skin?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Start your personalized skincare journey today with our free AI analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/skin-analysis"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1C4444] px-8 py-4 rounded-lg hover:bg-white/90 transition-colors font-medium"
            >
              Get Your Free Analysis
            </Link>
            <a
              href={SHOPIFY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-[#1C4444] transition-colors"
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
