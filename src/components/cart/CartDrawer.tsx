'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotal } = useCartStore()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const total = getTotal()

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#F4EBE7] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1C4444]/10">
          <h2 className="text-lg font-medium text-[#1C4444]">Your Cart</h2>
          <button
            onClick={closeCart}
            className="p-2 text-[#1C4444] hover:opacity-70 transition-opacity"
            aria-label="Close cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-grow overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1C4444]/70 mb-4">Your cart is empty</p>
              <Link
                href="/collections/all"
                onClick={closeCart}
                className="btn-primary inline-block"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex gap-4 p-3 bg-white rounded-lg"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 bg-[#F4EBE7] rounded overflow-hidden flex-shrink-0">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#1C4444]/30 text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-[#1C4444] font-medium hover:underline text-sm"
                    >
                      {item.product.name}
                    </Link>

                    <div className="mt-1">
                      {item.product.salePrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[#1C4444] text-sm">
                            {formatPrice(item.product.salePrice)}
                          </span>
                          <span className="text-[#1C4444]/50 line-through text-xs">
                            {formatPrice(item.product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#1C4444] text-sm">
                          {formatPrice(item.product.price)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-[#1C4444]/20 rounded">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-[#1C4444] hover:bg-[#1C4444]/5"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-[#1C4444] text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-[#1C4444] hover:bg-[#1C4444]/5"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-[#1C4444]/50 hover:text-[#1C4444] text-sm underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#1C4444]/10 p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-[#1C4444]/70">Estimated total</span>
              <span className="text-[#1C4444] font-medium text-lg">
                {formatPrice(total)} USD
              </span>
            </div>

            <p className="text-[#1C4444]/50 text-xs">
              Taxes included. Discounts and shipping calculated at checkout.
            </p>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center block"
            >
              Check out
            </Link>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full text-center text-[#1C4444] text-sm underline hover:no-underline"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
