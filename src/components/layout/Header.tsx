'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { SHOPIFY_STORE_URL } from '@/lib/shopify'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#1C4444] text-white text-center py-2 px-4">
        <p className="text-xs md:text-sm">
          Get personalized skincare recommendations with our AI Skin Analyzer
        </p>
      </div>

      <header className="sticky top-0 z-50 bg-[#F4EBE7]">
        {/* Main Header Row */}
        <div className="border-b border-[#1C4444]/10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between py-4">
              {/* Left - Back to Shop */}
              <div className="flex-1 flex justify-start">
                <a
                  href={SHOPIFY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 text-[#1C4444] text-sm hover:opacity-70 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Shop Ayonne
                </a>
              </div>

              {/* Center - Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="block">
                  {!logoError ? (
                    <Image
                      src="/images/ayonne-logo.png"
                      alt="Ayonne - AI Skin Analyzer"
                      width={180}
                      height={80}
                      className="h-16 md:h-20 w-auto"
                      priority
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl md:text-4xl font-light tracking-wider text-[#1C4444]">
                        AYONNE
                      </span>
                      <p className="text-[10px] text-[#1C4444]/60 tracking-widest">
                        AI SKIN ANALYZER
                      </p>
                    </div>
                  )}
                </Link>
              </div>

              {/* Right - Shop Button */}
              <div className="flex-1 flex justify-end items-center gap-2">
                {/* Shop on Ayonne Button */}
                <a
                  href={SHOPIFY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 bg-[#1C4444] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#1C4444]/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Shop Now
                </a>

                {/* Mobile Menu Button */}
                <button
                  className="p-2 text-[#1C4444] sm:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:block border-b border-[#1C4444]/10">
          <div className="container mx-auto px-4 lg:px-8">
            <nav className="py-3">
              <ul className="flex items-center justify-center gap-x-8">
                <li>
                  <Link
                    href="/"
                    className="text-[#1C4444] text-sm uppercase tracking-wide font-normal hover:underline underline-offset-4 transition-all"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/skin-analysis"
                    className="text-[#1C4444] text-sm uppercase tracking-wide font-medium hover:underline underline-offset-4 transition-all"
                  >
                    AI Skin Analysis
                  </Link>
                </li>
                <li>
                  <a
                    href={SHOPIFY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1C4444] text-sm uppercase tracking-wide font-normal hover:underline underline-offset-4 transition-all inline-flex items-center gap-1"
                  >
                    Shop Products
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
                <li>
                  <Link
                    href="/pages/about"
                    className="text-[#1C4444] text-sm uppercase tracking-wide font-normal hover:underline underline-offset-4 transition-all"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-b border-[#1C4444]/10 bg-[#F4EBE7]">
            <nav className="py-4 px-4">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    className="block py-3 text-[#1C4444] hover:opacity-70 transition-opacity text-sm uppercase tracking-wider"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/skin-analysis"
                    className="block py-3 text-[#1C4444] hover:opacity-70 transition-opacity text-sm uppercase tracking-wider font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    AI Skin Analysis
                  </Link>
                </li>
                <li>
                  <a
                    href={SHOPIFY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-3 text-[#1C4444] hover:opacity-70 transition-opacity text-sm uppercase tracking-wider"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Shop Products
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
                <li>
                  <Link
                    href="/pages/about"
                    className="block py-3 text-[#1C4444] hover:opacity-70 transition-opacity text-sm uppercase tracking-wider"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
