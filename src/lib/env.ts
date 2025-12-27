/**
 * Environment Variable Validation
 *
 * Centralized validation for all environment variables.
 * Uses lazy evaluation to avoid build-time errors while ensuring
 * runtime failures are caught early with clear error messages.
 */

type EnvVarConfig = {
  name: string
  required: boolean
  description: string
  fallback?: string
  devOnly?: boolean  // Only required in development
  prodOnly?: boolean // Only required in production
}

const ENV_VARS: EnvVarConfig[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
  },

  // Authentication
  {
    name: 'SESSION_SECRET',
    required: true,
    prodOnly: true,
    description: 'Secret for signing session tokens (min 32 chars). Alternative: NEXTAUTH_SECRET',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: false,
    description: 'Alternative to SESSION_SECRET for NextAuth compatibility',
  },

  // AI Services
  {
    name: 'ANTHROPIC_API_KEY',
    required: true,
    description: 'Anthropic API key for skin analysis AI',
  },

  // Payments
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key for payment processing',
  },

  // Admin
  {
    name: 'ADMIN_SECRET',
    required: false,
    description: 'Secret key for admin API endpoints',
  },
]

/**
 * Get an environment variable with validation
 */
export function getEnv(name: string): string | undefined {
  return process.env[name]
}

/**
 * Get a required environment variable, throws if missing
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Check your .env file or environment configuration.`
    )
  }
  return value
}

/**
 * Validate all required environment variables
 * Call this at app startup to fail fast
 */
export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const isDev = process.env.NODE_ENV === 'development'
  const isProd = process.env.NODE_ENV === 'production'

  for (const config of ENV_VARS) {
    const value = process.env[config.name]

    // Skip dev-only vars in production
    if (config.devOnly && isProd) continue

    // Skip prod-only vars in development
    if (config.prodOnly && isDev) continue

    if (config.required && !value) {
      // Special case: SESSION_SECRET has NEXTAUTH_SECRET as alternative
      if (config.name === 'SESSION_SECRET' && process.env.NEXTAUTH_SECRET) {
        continue
      }

      errors.push(`Missing ${config.name}: ${config.description}`)
    }
  }

  // Additional validations
  const sessionSecret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET
  if (sessionSecret && sessionSecret.length < 32) {
    warnings.push('SESSION_SECRET should be at least 32 characters for security')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Print environment validation status
 * Useful for startup debugging
 */
export function printEnvStatus(): void {
  const { valid, errors, warnings } = validateEnv()

  if (!valid) {
    console.error('❌ Environment validation failed:')
    errors.forEach(err => console.error(`   - ${err}`))
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:')
    warnings.forEach(warn => console.warn(`   - ${warn}`))
  }

  if (valid && warnings.length === 0) {
    console.log('✅ Environment variables validated')
  }
}

// Type-safe environment getters for common variables
export const env = {
  get DATABASE_URL() {
    return requireEnv('DATABASE_URL')
  },

  get ANTHROPIC_API_KEY() {
    return requireEnv('ANTHROPIC_API_KEY')
  },

  get SESSION_SECRET() {
    const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET or NEXTAUTH_SECRET is required in production')
    }
    return secret || 'dev-only-insecure-secret'
  },

  get STRIPE_SECRET_KEY() {
    return process.env.STRIPE_SECRET_KEY
  },

  get ADMIN_SECRET() {
    return process.env.ADMIN_SECRET
  },

  get isDevelopment() {
    return process.env.NODE_ENV === 'development'
  },

  get isProduction() {
    return process.env.NODE_ENV === 'production'
  },
}
