'use client'

import Link from 'next/link'
import { SHOPIFY_STORE_URL } from '@/lib/shopify'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Main Footer Content */}
      <div className="bg-gradient-to-b from-[#1C4444] to-[#1C4444]/95 relative">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#D4AF37]/[0.03] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 lg:px-8 py-16 relative">
          <div className="max-w-4xl mx-auto">
            {/* Top Section - Brand & Tagline */}
            <div className="text-center mb-14">
              <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37] mb-4">
                AI-Powered Skincare
              </p>
              <h2 className="text-2xl md:text-3xl font-light text-white tracking-tight mb-3">
                Ayonne Skin Analyzer
              </h2>
              <p className="text-white/50 max-w-md mx-auto">
                Discover your perfect skincare routine with advanced AI technology
              </p>
            </div>

            {/* Navigation Links - Two Columns */}
            <div className="grid md:grid-cols-2 gap-12 md:gap-8 text-center md:text-left max-w-2xl mx-auto">
              {/* AI Analyzer */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6 font-medium">
                  AI Skin Analyzer
                </h3>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/skin-analysis"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      Start Analysis
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/challenge"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      30-Day Challenge
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/guides"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      Skincare Guides
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pages/about"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pages/faq"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6 font-medium">
                  Support
                </h3>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/pages/contact"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pages/shipping"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      Shipping Info
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/policies/refund-policy"
                      className="text-white/70 hover:text-white transition-all duration-300 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="my-12 flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20" />
              <div className="w-2 h-2 bg-[#D4AF37] rounded-full" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* Shop CTA */}
            <div className="text-center">
              <p className="text-white/50 text-sm mb-4">Ready to transform your skincare routine?</p>
              <a
                href={SHOPIFY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group"
              >
                <span className="tracking-wide">Shop at ayonne.skin</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-[#1C4444]/95 border-t border-white/5">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-white/40 text-sm tracking-wide">
              &copy; {new Date().getFullYear()} Ayonne. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/policies/privacy-policy"
                className="text-white/40 hover:text-white/70 transition-all duration-300"
              >
                Privacy Policy
              </Link>
              <span className="text-white/20">|</span>
              <Link
                href="/policies/terms-of-service"
                className="text-white/40 hover:text-white/70 transition-all duration-300"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
