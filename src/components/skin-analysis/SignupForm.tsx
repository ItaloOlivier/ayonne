'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SignupFormProps {
  onSuccess: (customerId: string) => void
  onCancel: () => void
  isLoading?: boolean
}

type AuthMode = 'signup' | 'login'

interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface LoginFormData {
  email: string
  password: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  general?: string
}

export default function SignupForm({ onSuccess, onCancel, isLoading }: SignupFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [signupData, setSignupData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const validateSignupForm = (): boolean => {
    const newErrors: FormErrors = {}

    // First name is required
    if (!signupData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    // Email is required and must be valid
    if (!signupData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password is required and must be at least 6 characters
    if (!signupData.password) {
      newErrors.password = 'Password is required'
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email is required and must be valid
    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password is required
    if (!loginData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateSignupForm()) return

    setSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/skin-analysis/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
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

      // Cookie is set automatically by the API
      onSuccess(data.customerId)
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) return

    setSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Invalid email or password') {
          setErrors({ general: 'Invalid email or password. Please try again.' })
        } else if (data.error === 'Daily limit reached') {
          setErrors({ general: 'You have already used the skin analyzer today. Please try again tomorrow.' })
        } else {
          setErrors({ general: data.error || 'Something went wrong. Please try again.' })
        }
        return
      }

      // Cookie is set automatically by the API
      onSuccess(data.customer.id)
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignupData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode)
    setErrors({})
  }

  return (
    <div className="bg-white rounded-xl p-6 md:p-8 max-w-md mx-auto">
      {/* Mode Toggle Tabs */}
      <div className="flex mb-6 border-b border-[#1C4444]/10">
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`flex-1 py-3 text-center font-medium transition-colors relative ${
            authMode === 'signup'
              ? 'text-[#1C4444]'
              : 'text-[#1C4444]/50 hover:text-[#1C4444]/70'
          }`}
        >
          Create Account
          {authMode === 'signup' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C4444]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 py-3 text-center font-medium transition-colors relative ${
            authMode === 'login'
              ? 'text-[#1C4444]'
              : 'text-[#1C4444]/50 hover:text-[#1C4444]/70'
          }`}
        >
          Sign In
          {authMode === 'login' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C4444]" />
          )}
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#1C4444]/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#1C4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-[#1C4444] mb-2">
          {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-[#1C4444]/60 text-sm">
          {authMode === 'signup'
            ? 'Sign up to view your personalized skin analysis results and track your skin health over time'
            : 'Sign in to view your personalized skin analysis results'}
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Signup Form */}
      {authMode === 'signup' && (
        <form onSubmit={handleSignupSubmit} className="space-y-4">
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
                value={signupData.firstName}
                onChange={handleSignupChange}
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
                value={signupData.lastName}
                onChange={handleSignupChange}
                className="w-full px-3 py-2 border border-[#1C4444]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444]/20 focus:border-[#1C4444] transition-colors"
                placeholder="Doe"
                disabled={submitting || isLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="signupEmail" className="block text-sm font-medium text-[#1C4444] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="signupEmail"
              name="email"
              value={signupData.email}
              onChange={handleSignupChange}
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

          {/* Password */}
          <div>
            <label htmlFor="signupPassword" className="block text-sm font-medium text-[#1C4444] mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="signupPassword"
              name="password"
              value={signupData.password}
              onChange={handleSignupChange}
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
      )}

      {/* Login Form */}
      {authMode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="loginEmail" className="block text-sm font-medium text-[#1C4444] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="loginEmail"
              name="email"
              value={loginData.email}
              onChange={handleLoginChange}
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="loginPassword" className="block text-sm font-medium text-[#1C4444]">
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#1C4444]/60 hover:text-[#D4AF37] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="loginPassword"
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C4444]/20 focus:border-[#1C4444] transition-colors ${
                errors.password ? 'border-red-500' : 'border-[#1C4444]/20'
              }`}
              placeholder="Your password"
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
                  Signing In...
                </span>
              ) : (
                'Sign In & View Results'
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
      )}

      {authMode === 'signup' && (
        <p className="mt-4 text-center text-xs text-[#1C4444]/50">
          By creating an account, you agree to receive personalized skincare recommendations and occasional updates from Ayonne.
        </p>
      )}
    </div>
  )
}
