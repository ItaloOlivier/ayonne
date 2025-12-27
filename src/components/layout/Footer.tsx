'use client'

import Link from 'next/link'
import { useState } from 'react'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/collections/all' },
    { name: 'Anti-Aging Serums', href: '/collections/anti-aging-serums' },
    { name: 'Moisturizers', href: '/collections/moisturizers' },
    { name: 'Cleansers', href: '/collections/cleansers' },
    { name: 'Bundles', href: '/collections/bundles' },
  ],
  support: [
    { name: 'Contact Us', href: '/pages/contact' },
    { name: 'FAQs', href: '/pages/faq' },
    { name: 'Shipping Info', href: '/pages/shipping' },
    { name: 'Returns', href: '/policies/refund-policy' },
  ],
  policies: [
    { name: 'Privacy Policy', href: '/policies/privacy-policy' },
    { name: 'Terms of Service', href: '/policies/terms-of-service' },
    { name: 'Refund Policy', href: '/policies/refund-policy' },
  ],
}

const paymentMethods = ['visa', 'mastercard', 'amex', 'discover', 'jcb']

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="bg-[#1C4444] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-normal mb-4">Subscribe to our emails</h3>
            <p className="text-white/70 mb-6">
              Be the first to know about new products, exclusive offers, and skincare tips.
            </p>
            {subscribed ? (
              <p className="text-white/70">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="flex-grow px-4 py-3 bg-transparent border border-white/30 text-white placeholder:text-white/50 focus:border-white outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-[#1C4444] hover:bg-white/90 transition-colors"
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

      {/* Links Section */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-normal tracking-wider">
              Ayonne
            </Link>
            <p className="mt-4 text-white/70 text-sm leading-relaxed">
              Transform your skincare routine with science-backed, cruelty-free formulas
              designed to turn back time.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div>
            <h4 className="font-medium mb-4">Policies</h4>
            <ul className="space-y-2">
              {footerLinks.policies.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Payment Methods */}
            <div className="flex items-center gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method}
                  className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-xs uppercase text-white/70"
                >
                  {method.slice(0, 4)}
                </div>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-white/50 text-sm">
              &copy; {new Date().getFullYear()} Ayonne. All rights reserved.
            </p>

            {/* Country Selector */}
            <div className="flex items-center gap-2 text-white/70 text-sm">
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
              <span>United States (USD $)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
