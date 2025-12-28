// Guest Session System
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { DiscountType } from '@prisma/client'
import { generateDiscountCode } from './discount'

// Generate a unique session token
function generateSessionToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Hash IP address for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + process.env.SESSION_SECRET).digest('hex').slice(0, 16)
}

// Create a guest session
export async function createGuestSession(ipAddress?: string) {
  const sessionToken = generateSessionToken()
  const ipHash = ipAddress ? hashIP(ipAddress) : null

  // Check if IP has already done a guest analysis (rate limit)
  if (ipHash) {
    const existingSession = await prisma.guestSession.findFirst({
      where: {
        ipHash,
        analysisId: { not: null }, // Has completed an analysis
      },
    })

    if (existingSession) {
      return {
        success: false,
        error: 'guest_limit_reached',
        message: 'You have already used your free guest analysis. Sign up to continue!',
      }
    }
  }

  // Set expiry to 24 hours
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const session = await prisma.guestSession.create({
    data: {
      sessionToken,
      ipHash,
      expiresAt,
    },
  })

  return {
    success: true,
    sessionToken,
    expiresAt,
    session,
  }
}

// Validate a guest session
export async function validateGuestSession(sessionToken: string) {
  const session = await prisma.guestSession.findUnique({
    where: { sessionToken },
  })

  if (!session) {
    return { valid: false, error: 'Invalid session' }
  }

  if (session.expiresAt < new Date()) {
    return { valid: false, error: 'Session expired' }
  }

  if (session.convertedCustomerId) {
    return { valid: false, error: 'Session already converted to account' }
  }

  return { valid: true, session }
}

// Link analysis to guest session
export async function linkGuestAnalysis(sessionToken: string, analysisId: string) {
  const validation = await validateGuestSession(sessionToken)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Check if guest already has an analysis
  if (validation.session?.analysisId) {
    return {
      success: false,
      error: 'Guest session already has an analysis',
    }
  }

  await prisma.guestSession.update({
    where: { sessionToken },
    data: { analysisId },
  })

  return { success: true }
}

// Capture email for guest session (partial conversion)
export async function captureGuestEmail(sessionToken: string, email: string) {
  const validation = await validateGuestSession(sessionToken)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Check if email already exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingCustomer) {
    return {
      success: false,
      error: 'email_exists',
      message: 'This email already has an account. Please log in.',
    }
  }

  await prisma.guestSession.update({
    where: { sessionToken },
    data: { email: email.toLowerCase() },
  })

  // Generate a discount code as incentive
  const discountCode = await generateDiscountCode({
    customerId: null,
    discountPercent: 10,
    type: DiscountType.GUEST,
    expiresInDays: 7,
    prefix: 'GUEST',
  })

  return {
    success: true,
    discountCode: discountCode.code,
    discountPercent: 10,
    message: 'Your 10% discount code has been created!',
  }
}

// Convert guest session to full customer account
export async function convertGuestToCustomer(
  sessionToken: string,
  customerData: {
    email: string
    password: string
    firstName: string
    lastName?: string
  }
) {
  const validation = await validateGuestSession(sessionToken)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const session = validation.session!

  // Check if email already exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: customerData.email.toLowerCase() },
  })

  if (existingCustomer) {
    return {
      success: false,
      error: 'email_exists',
      message: 'This email already has an account. Please log in.',
    }
  }

  // Import bcrypt dynamically to avoid issues
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash(customerData.password, 12)

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      email: customerData.email.toLowerCase(),
      password: hashedPassword,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
    },
  })

  // Transfer analysis if exists
  if (session.analysisId) {
    await prisma.skinAnalysis.update({
      where: { id: session.analysisId },
      data: {
        customerId: customer.id,
        sessionId: null,
      },
    })
  }

  // Mark session as converted
  await prisma.guestSession.update({
    where: { sessionToken },
    data: { convertedCustomerId: customer.id },
  })

  // Create welcome discount
  const discountCode = await generateDiscountCode({
    customerId: customer.id,
    discountPercent: 15, // Extra 5% for full signup
    type: DiscountType.WELCOME,
    expiresInDays: 30,
    prefix: 'WELCOME',
  })

  return {
    success: true,
    customer,
    discountCode: discountCode.code,
    discountPercent: 15,
    message: 'Account created! Your 15% welcome discount is ready.',
  }
}

// Get guest session with analysis data (for showing blurred results)
export async function getGuestAnalysis(sessionToken: string) {
  const session = await prisma.guestSession.findUnique({
    where: { sessionToken },
  })

  if (!session || !session.analysisId) {
    return null
  }

  const analysis = await prisma.skinAnalysis.findUnique({
    where: { id: session.analysisId },
  })

  return {
    session,
    analysis,
    isGuest: true,
    // These fields are blurred for guests
    blurredFields: ['recommendations', 'advice', 'detailedScores'],
  }
}

// Clean up expired guest sessions
export async function cleanupExpiredSessions() {
  const deleted = await prisma.guestSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
      convertedCustomerId: null, // Don't delete converted sessions
    },
  })

  return deleted.count
}
