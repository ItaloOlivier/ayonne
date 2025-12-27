'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

interface FormData {
  email: string
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  saveInfo: boolean
  sameAsBilling: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'information' | 'payment'>('information')
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    saveInfo: false,
    sameAsBilling: true,
  })

  const subtotal = getTotal()
  const shipping = subtotal >= 50 ? 0 : 9.95
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('payment')
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.salePrice ?? item.product.price,
            name: item.product.name,
          })),
          email: formData.email,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address1: formData.address1,
            address2: formData.address2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
            phone: formData.phone,
          },
          subtotal,
          tax,
          shipping,
          total,
        }),
      })

      const data = await response.json()

      if (data.success) {
        clearCart()
        router.push(`/checkout/success?order=${data.orderNumber}`)
      } else {
        alert('Failed to process order. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4EBE7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-[#1C4444] mb-4">Your cart is empty</h1>
          <Link href="/collections/all" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-2xl font-normal tracking-wider text-[#1C4444]">
            Ayonne
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Form */}
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-8">
              <Link href="/cart" className="text-[#1C4444] hover:underline">Cart</Link>
              <span className="text-[#1C4444]/50">›</span>
              <span className={step === 'information' ? 'text-[#1C4444]' : 'text-[#1C4444]/50'}>
                Information
              </span>
              <span className="text-[#1C4444]/50">›</span>
              <span className={step === 'payment' ? 'text-[#1C4444]' : 'text-[#1C4444]/50'}>
                Payment
              </span>
            </nav>

            {step === 'information' && (
              <form onSubmit={handleContinueToPayment}>
                {/* Contact */}
                <div className="mb-8">
                  <h2 className="text-xl text-[#1C4444] mb-4">Contact</h2>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    required
                    className="w-full"
                  />
                  <label className="flex items-center gap-2 mt-3 text-sm text-[#1C4444]/70">
                    <input
                      type="checkbox"
                      name="saveInfo"
                      checked={formData.saveInfo}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    Email me with news and offers
                  </label>
                </div>

                {/* Shipping Address */}
                <div className="mb-8">
                  <h2 className="text-xl text-[#1C4444] mb-4">Shipping address</h2>

                  <div className="space-y-4">
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                        required
                      />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        required
                      />
                    </div>

                    <input
                      type="text"
                      name="address1"
                      value={formData.address1}
                      onChange={handleInputChange}
                      placeholder="Address"
                      required
                    />

                    <input
                      type="text"
                      name="address2"
                      value={formData.address2}
                      onChange={handleInputChange}
                      placeholder="Apartment, suite, etc. (optional)"
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                      />
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        required
                      />
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="ZIP code"
                        required
                      />
                    </div>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone (optional)"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link href="/cart" className="text-[#1C4444] hover:underline">
                    ← Return to cart
                  </Link>
                  <button type="submit" className="btn-primary">
                    Continue to payment
                  </button>
                </div>
              </form>
            )}

            {step === 'payment' && (
              <form onSubmit={handleSubmitOrder}>
                {/* Order Summary */}
                <div className="mb-8 p-4 bg-[#F4EBE7] rounded-lg">
                  <div className="flex justify-between text-sm text-[#1C4444]/70 mb-2">
                    <span>Contact</span>
                    <button
                      type="button"
                      onClick={() => setStep('information')}
                      className="text-[#1C4444] hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[#1C4444] mb-4">{formData.email}</p>

                  <div className="flex justify-between text-sm text-[#1C4444]/70 mb-2">
                    <span>Ship to</span>
                    <button
                      type="button"
                      onClick={() => setStep('information')}
                      className="text-[#1C4444] hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[#1C4444]">
                    {formData.address1}, {formData.city}, {formData.state} {formData.postalCode}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="mb-8">
                  <h2 className="text-xl text-[#1C4444] mb-4">Payment</h2>
                  <p className="text-[#1C4444]/70 mb-4">All transactions are secure and encrypted.</p>

                  <div className="border border-[#1C4444]/20 rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-6 bg-[#1C4444]/10 rounded flex items-center justify-center text-xs">
                        VISA
                      </div>
                      <div className="w-10 h-6 bg-[#1C4444]/10 rounded flex items-center justify-center text-xs">
                        MC
                      </div>
                      <div className="w-10 h-6 bg-[#1C4444]/10 rounded flex items-center justify-center text-xs">
                        AMEX
                      </div>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Card number"
                        className="w-full"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Name on card"
                        className="w-full"
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Expiration date (MM/YY)"
                          className="w-full"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Security code"
                          className="w-full"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="mb-8">
                  <h2 className="text-xl text-[#1C4444] mb-4">Billing address</h2>
                  <label className="flex items-center gap-2 text-sm text-[#1C4444]/70">
                    <input
                      type="checkbox"
                      name="sameAsBilling"
                      checked={formData.sameAsBilling}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    Same as shipping address
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('information')}
                    className="text-[#1C4444] hover:underline"
                  >
                    ← Return to information
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : `Pay ${formatPrice(total)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-[#F4EBE7] p-8 rounded-lg h-fit lg:sticky lg:top-8">
            <h2 className="text-xl text-[#1C4444] mb-6">Order summary</h2>

            {/* Cart Items */}
            <ul className="space-y-4 mb-6">
              {items.map((item) => (
                <li key={item.product.id} className="flex gap-4">
                  <div className="relative w-16 h-16 bg-white rounded overflow-hidden flex-shrink-0">
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
                    <span className="absolute -top-1 -right-1 bg-[#1C4444] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-[#1C4444] text-sm">{item.product.name}</p>
                  </div>
                  <div className="text-[#1C4444] text-sm">
                    {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-[#1C4444]/10 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#1C4444]/70">Subtotal</span>
                <span className="text-[#1C4444]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#1C4444]/70">Shipping</span>
                <span className="text-[#1C4444]">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#1C4444]/70">Tax</span>
                <span className="text-[#1C4444]">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-medium pt-2 border-t border-[#1C4444]/10">
                <span className="text-[#1C4444]">Total</span>
                <span className="text-[#1C4444]">
                  {formatPrice(total)} <span className="text-sm font-normal">USD</span>
                </span>
              </div>
            </div>

            {shipping === 0 && (
              <p className="text-sm text-green-600 mt-4">
                You qualify for free shipping!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
