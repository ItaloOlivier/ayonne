'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { Product } from '@/types'

interface AddToCartButtonProps {
  product: Product
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    if (!product.inStock) return

    setIsAdding(true)
    addItem(product, quantity)

    setTimeout(() => {
      setIsAdding(false)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div>
        <label htmlFor="quantity" className="block text-sm text-[#1C4444]/70 mb-2">
          Quantity
        </label>
        <div className="flex items-center border border-[#1C4444]/20 w-fit">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 text-[#1C4444] hover:bg-[#1C4444]/5 transition-colors"
            disabled={!product.inStock}
          >
            −
          </button>
          <input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center py-2 border-x border-[#1C4444]/20 bg-transparent text-[#1C4444]"
            min="1"
            disabled={!product.inStock}
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 text-[#1C4444] hover:bg-[#1C4444]/5 transition-colors"
            disabled={!product.inStock}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!product.inStock || isAdding}
        className={`w-full py-4 text-center font-medium transition-colors ${
          product.inStock
            ? isAdding
              ? 'bg-green-600 text-white'
              : 'btn-primary'
            : 'bg-[#1C4444]/30 text-white cursor-not-allowed'
        }`}
      >
        {!product.inStock
          ? 'Sold Out'
          : isAdding
          ? 'Added to Cart!'
          : 'Add to Cart'}
      </button>
    </div>
  )
}
