'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setQuery('')
      setResults([])
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.products || [])
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#F4EBE7] w-full max-w-2xl mx-auto mt-20 rounded-lg shadow-xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b border-[#1C4444]/10 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-[#1C4444]/50 mr-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-grow bg-transparent border-none outline-none text-[#1C4444] placeholder:text-[#1C4444]/50"
          />
          <button
            onClick={onClose}
            className="p-2 text-[#1C4444] hover:opacity-70"
            aria-label="Close search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-[#1C4444]/70">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-[#1C4444]/10">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-4 hover:bg-[#1C4444]/5 transition-colors"
                  >
                    <div className="relative w-16 h-16 bg-white rounded overflow-hidden flex-shrink-0">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#1C4444]/30">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-[#1C4444] font-medium">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-[#1C4444]">{formatPrice(product.salePrice)}</span>
                            <span className="text-[#1C4444]/50 line-through text-sm">
                              {formatPrice(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#1C4444]">{formatPrice(product.price)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center text-[#1C4444]/70">
              No products found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-8 text-center text-[#1C4444]/70">
              Start typing to search products...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
