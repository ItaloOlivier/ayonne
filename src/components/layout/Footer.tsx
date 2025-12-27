'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="bg-[#F4EBE7]">
      {/* Newsletter Section */}
      <div className="border-t border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-xl font-normal text-[#1C4444] mb-2">Subscribe to our emails</h3>
            <p className="text-sm text-[#1C4444]/70 mb-6">Be the first to know about new collections and exclusive offers.</p>
            {subscribed ? (
              <p className="text-[#1C4444] font-medium">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="flex-grow px-4 py-3 bg-transparent border border-[#1C4444]/30 text-[#1C4444] placeholder:text-[#1C4444]/50 focus:border-[#1C4444] outline-none text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-3 border border-[#1C4444]/30 border-l-0 text-[#1C4444] hover:bg-[#1C4444] hover:text-white transition-colors"
                  aria-label="Subscribe"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Country Selector */}
      <div className="border-t border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex justify-center">
            <button className="flex items-center gap-2 text-[#1C4444] text-sm border border-[#1C4444]/30 px-4 py-2 hover:border-[#1C4444] transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              <span>United States | USD $</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[#1C4444]/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-6">
            {/* Payment Methods */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Image src="/images/payment/amex.svg" alt="American Express" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/apple-pay.svg" alt="Apple Pay" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/diners.svg" alt="Diners Club" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/discover.svg" alt="Discover" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/google-pay.svg" alt="Google Pay" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/mastercard.svg" alt="Mastercard" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/paypal.svg" alt="PayPal" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/shop-pay.svg" alt="Shop Pay" width={38} height={24} className="h-6 w-auto" />
              <Image src="/images/payment/visa.svg" alt="Visa" width={38} height={24} className="h-6 w-auto" />
            </div>

            {/* Copyright & Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[#1C4444]/70 text-sm">
              <span>&copy; {new Date().getFullYear()}, Ayonne</span>
              <span className="hidden sm:inline">|</span>
              <Link href="/policies/refund-policy" className="hover:text-[#1C4444] hover:underline underline-offset-2">
                Refund policy
              </Link>
              <Link href="/policies/privacy-policy" className="hover:text-[#1C4444] hover:underline underline-offset-2">
                Privacy policy
              </Link>
              <Link href="/policies/terms-of-service" className="hover:text-[#1C4444] hover:underline underline-offset-2">
                Terms of service
              </Link>
              <Link href="/pages/contact" className="hover:text-[#1C4444] hover:underline underline-offset-2">
                Contact
              </Link>
              <Link href="/pages/shipping" className="hover:text-[#1C4444] hover:underline underline-offset-2">
                Shipping
              </Link>
            </div>

            {/* Powered by */}
            <p className="text-xs text-[#1C4444]/50">
              Powered by Ayonne
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
