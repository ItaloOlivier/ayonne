import Stripe from 'stripe'

// API version required by installed Stripe SDK
const STRIPE_API_VERSION = '2025-12-15.clover' as const

// Validate Stripe key exists before initializing
function getStripeClient(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    // In development, return a mock warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  WARNING: STRIPE_SECRET_KEY not set. Stripe functionality will fail.')
    }
    throw new Error(
      'STRIPE_SECRET_KEY environment variable is required. ' +
      'Get your key from https://dashboard.stripe.com/apikeys'
    )
  }

  return new Stripe(stripeKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  })
}

// Lazy initialization to allow startup without Stripe if not used
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = getStripeClient()
  }
  return _stripe
}

// For backwards compatibility - throws if STRIPE_SECRET_KEY not set
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    })
  : (null as unknown as Stripe) // Will error on use if not configured
