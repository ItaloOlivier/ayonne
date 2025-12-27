'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()

  const subtotal = getTotal()
  const shipping = subtotal >= 50 ? 0 : 9.95
  const shippingThreshold = 50 - subtotal

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl text-[#1C4444] text-center mb-8">Your cart</h1>
        <div className="text-center">
          <p className="text-[#1C4444]/70 mb-8">Your cart is empty</p>
          <Link href="/collections/all" className="btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl text-[#1C4444] text-center mb-12">Your cart</h1>

      {/* Free Shipping Progress */}
      {shippingThreshold > 0 && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-[#1C4444]/5 p-4 rounded-lg">
            <p className="text-center text-[#1C4444]/70 mb-2">
              Add <span className="font-medium text-[#1C4444]">{formatPrice(shippingThreshold)}</span> more for free shipping!
            </p>
            <div className="w-full h-2 bg-[#1C4444]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1C4444] transition-all duration-300"
                style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {shippingThreshold <= 0 && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-center text-green-600">
              You qualify for free shipping!
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Cart Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-[#1C4444]/10 text-sm text-[#1C4444]/70">
          <div className="col-span-6">Product</div>
          <div className="col-span-2 text-center">Quantity</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {/* Cart Items */}
        <ul className="divide-y divide-[#1C4444]/10">
          {items.map((item) => {
            const price = item.product.salePrice ?? item.product.price
            const itemTotal = price * item.quantity

            return (
              <li key={item.product.id} className="py-6">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Product Info */}
                  <div className="col-span-12 md:col-span-6 flex gap-4">
                    <div className="relative w-24 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0">
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
                    <div>
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="text-[#1C4444] font-medium hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      {item.product.salePrice && (
                        <div className="mt-1">
                          <span className="text-[#1C4444] text-sm">{formatPrice(item.product.salePrice)}</span>
                          <span className="text-[#1C4444]/50 line-through text-sm ml-2">
                            {formatPrice(item.product.price)}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-[#1C4444]/50 text-sm underline hover:text-[#1C4444] mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 md:col-span-2 flex justify-center">
                    <div className="flex items-center border border-[#1C4444]/20 rounded">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-3 py-2 text-[#1C4444] hover:bg-[#1C4444]/5"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-4 py-2 text-[#1C4444]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-3 py-2 text-[#1C4444] hover:bg-[#1C4444]/5"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-4 md:col-span-2 text-right text-[#1C4444]">
                    {formatPrice(price)}
                  </div>

                  {/* Total */}
                  <div className="col-span-4 md:col-span-2 text-right text-[#1C4444] font-medium">
                    {formatPrice(itemTotal)}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Cart Footer */}
        <div className="border-t border-[#1C4444]/10 pt-8">
          <div className="max-w-md ml-auto">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-[#1C4444]/70">Subtotal</span>
                <span className="text-[#1C4444]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1C4444]/70">Shipping</span>
                <span className="text-[#1C4444]">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-medium pt-2 border-t border-[#1C4444]/10">
                <span className="text-[#1C4444]">Estimated total</span>
                <span className="text-[#1C4444]">{formatPrice(subtotal + shipping)} USD</span>
              </div>
            </div>

            <p className="text-[#1C4444]/50 text-sm mb-6">
              Taxes calculated at checkout
            </p>

            <div className="space-y-3">
              <Link href="/checkout" className="btn-primary w-full text-center block">
                Check out
              </Link>
              <Link
                href="/collections/all"
                className="block text-center text-[#1C4444] underline hover:no-underline"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
