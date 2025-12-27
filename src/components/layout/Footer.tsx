'use client'

import Link from 'next/link'
import { SHOPIFY_STORE_URL } from '@/lib/shopify'

export default function Footer() {
  return (
    <footer className="bg-[#F4EBE7]">
      {/* Main Footer Content */}
      <div className="border-t border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center md:text-left">
            {/* AI Analyzer */}
            <div>
              <h3 className="text-lg font-medium text-[#1C4444] mb-4">AI Skin Analyzer</h3>
              <ul className="space-y-2 text-sm text-[#1C4444]/70">
                <li>
                  <Link href="/skin-analysis" className="hover:text-[#1C4444] transition-colors">
                    Start Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/pages/about" className="hover:text-[#1C4444] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/pages/faq" className="hover:text-[#1C4444] transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Shop */}
            <div>
              <h3 className="text-lg font-medium text-[#1C4444] mb-4">Shop Ayonne</h3>
              <ul className="space-y-2 text-sm text-[#1C4444]/70">
                <li>
                  <a
                    href={SHOPIFY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#1C4444] transition-colors inline-flex items-center gap-1"
                  >
                    All Products
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
                <li>
                  <a
                    href={`${SHOPIFY_STORE_URL}/collections/anti-aging-serums`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#1C4444] transition-colors inline-flex items-center gap-1"
                  >
                    Anti-Aging Serums
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
                <li>
                  <a
                    href={`${SHOPIFY_STORE_URL}/collections/moisturizers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#1C4444] transition-colors inline-flex items-center gap-1"
                  >
                    Moisturizers
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-medium text-[#1C4444] mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-[#1C4444]/70">
                <li>
                  <Link href="/pages/contact" className="hover:text-[#1C4444] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/pages/shipping" className="hover:text-[#1C4444] transition-colors">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <a
                    href={`${SHOPIFY_STORE_URL}/policies/refund-policy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#1C4444] transition-colors inline-flex items-center gap-1"
                  >
                    Return Policy
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4">
            {/* Copyright & Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[#1C4444]/70 text-sm">
              <span>&copy; {new Date().getFullYear()}, Ayonne</span>
              <span className="hidden sm:inline">|</span>
              <Link href="/policies/privacy-policy" className="hover:text-[#1C4444] hover:underline underline-offset-2">
                Privacy Policy
              </Link>
              <Link href="/policies/terms-of-service" className="hover:text-[#1C4444] hover:underline underline-offset-2">
                Terms of Service
              </Link>
            </div>

            {/* Shop Link */}
            <a
              href={SHOPIFY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#1C4444] text-sm hover:underline"
            >
              Shop at ayonne.skin
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
