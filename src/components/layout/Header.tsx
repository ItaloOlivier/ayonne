'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import Navigation from './Navigation'
import CartDrawer from '../cart/CartDrawer'
import SearchModal from './SearchModal'

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const { items, openCart } = useCartStore()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F4EBE7]">
        {/* Main Header - Logo Centered */}
        <div className="container mx-auto px-4 lg:px-8">
          {/* Top Row - Logo Centered */}
          <div className="flex items-center justify-center py-6 relative">
            {/* Mobile Menu Button - Left */}
            <button
              className="lg:hidden absolute left-4 p-2 text-[#1C4444]"
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

            {/* Centered Logo */}
            <Link href="/" className="block">
              {!logoError ? (
                <Image
                  src="/images/ayonne-logo.png"
                  alt="Ayonne"
                  width={600}
                  height={100}
                  className="h-12 md:h-16 lg:h-20 w-auto"
                  priority
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-wider text-[#1C4444]">
                  Ayonne
                </span>
              )}
            </Link>

            {/* Right Icons */}
            <div className="absolute right-4 flex items-center gap-4">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#1C4444] hover:opacity-70 transition-opacity"
                aria-label="Search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>

              {/* Account */}
              <Link
                href="/account"
                className="p-2 text-[#1C4444] hover:opacity-70 transition-opacity hidden sm:block"
                aria-label="Account"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="p-2 text-[#1C4444] hover:opacity-70 transition-opacity relative"
                aria-label="Cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#1C4444] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Navigation - Below Logo */}
          <div className="hidden lg:block border-t border-[#1C4444]/10 py-3">
            <Navigation />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#1C4444]/10">
            <Navigation mobile onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  )
}
