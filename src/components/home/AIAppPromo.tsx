'use client'

import Link from 'next/link'

export default function AIAppPromo() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[#1C4444] to-[#2A5858]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Text */}
          <p className="text-sm uppercase tracking-widest mb-3 opacity-70">
            Powered by AI
          </p>
          <h2 className="text-2xl md:text-4xl font-normal mb-4">
            Discover Your Skin&apos;s Future
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            Upload a selfie and our AI will analyze your skin type, detect concerns,
            and show you what your skin could look like in 20 years without proper care.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-10 max-w-xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-xs opacity-70">Skin Analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs opacity-70">Age Simulation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-xs opacity-70">Personalized Tips</p>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/skin-analysis"
            className="inline-block px-10 py-4 bg-white text-[#1C4444] text-sm uppercase tracking-wider font-medium hover:bg-white/90 transition-colors"
          >
            Try AI Skin Analysis
          </Link>
        </div>
      </div>
    </section>
  )
}
