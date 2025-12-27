'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CustomerData {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phone: string | null
  createdAt: string
  analysisCount: number
}

interface SignupFormProps {
  onSuccess: (customerId: string, customerData: CustomerData) => void
  onCancel: () => void
  isLoading?: boolean
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  password?: string
  general?: string
}

export default function SignupForm({ onSuccess, onCancel, isLoading }: SignupFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // First name is required
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    // Email is required and must be valid
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password is required and must be at least 6 characters
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/skin-analysis/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Email already exists') {
          setErrors({ email: 'An account with this email already exists. Please sign in instead.' })
        } else if (data.error === 'Daily limit reached') {
          setErrors({ general: 'You have already used the skin analyzer today. Please try again tomorrow.' })
        } else {
          setErrors({ general: data.error || 'Something went wrong. Please try again.' })
        }
        return
      }

      // Create customer data object
      const customerData: CustomerData = {
        id: data.customerId,
        email: formData.email.toLowerCase().trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName?.trim() || null,
        phone: formData.phone?.trim() || null,
        createdAt: new Date().toISOString(),
        analysisCount: 0,
      }

      onSuccess(data.customerId, customerData)
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 md:p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-[#1C4444] mb-2">
          Create Your Account
        </h2>
        <p className="text-[#1C4444]/60 text-sm">
          Sign up to view your personalized skin analysis results and track your skin health over time
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-[#1C4444] mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444]/20 focus:border-[#1C4444] transition-colors ${
                errors.firstName ? 'border-red-500' : 'border-[#1C4444]/20'
              }`}
              placeholder="Jane"
              disabled={submitting || isLoading}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-[#1C4444] mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#1C4444]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444]/20 focus:border-[#1C4444] transition-colors"
              placeholder="Doe"
              disabled={submitting || isLoading}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1C4444] mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444]/20 focus:border-[#1C4444] transition-colors ${
              errors.email ? 'border-red-500' : 'border-[#1C4444]/20'
            }`}
            placeholder="jane@example.com"
            disabled={submitting || isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[#1C4444] mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#1C4444]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444]/20 focus:border-[#1C4444] transition-colors"
            placeholder="+1 (555) 000-0000"
            disabled={submitting || isLoading}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#1C4444] mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444]/20 focus:border-[#1C4444] transition-colors ${
              errors.password ? 'border-red-500' : 'border-[#1C4444]/20'
            }`}
            placeholder="At least 6 characters"
            disabled={submitting || isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full bg-[#1C4444] text-white py-3 px-4 rounded-lg hover:bg-[#1C4444]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account & View Results'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting || isLoading}
            className="w-full text-[#1C4444]/70 hover:text-[#1C4444] py-2 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-[#1C4444]/50">
        By creating an account, you agree to receive personalized skincare recommendations and occasional updates from Ayonne.
      </p>

      {/* Login Link */}
      <div className="mt-6 pt-4 border-t border-[#1C4444]/10 text-center">
        <p className="text-sm text-[#1C4444]/60">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1C4444] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
