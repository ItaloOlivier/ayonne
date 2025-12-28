// Spin to Win System
import { prisma } from '@/lib/prisma'
import { generateUniqueCode } from './discount'

// Spin wheel segments with weighted probabilities
export const SPIN_SEGMENTS = [
  { id: 1, label: '5% OFF', discountPercent: 5, weight: 40, color: '#1C4444' },
  { id: 2, label: '10% OFF', discountPercent: 10, weight: 30, color: '#2D5A5A' },
  { id: 3, label: '15% OFF', discountPercent: 15, weight: 18, color: '#D4AF37' },
  { id: 4, label: '20% OFF', discountPercent: 20, weight: 8, color: '#8B7355' },
  { id: 5, label: 'FREE SHIP', discountPercent: 0, weight: 4, color: '#A67C52', isFreeShipping: true },
] as const

export type SpinSegment = (typeof SPIN_SEGMENTS)[number]

// Weighted random selection
function weightedRandom(): SpinSegment {
  const totalWeight = SPIN_SEGMENTS.reduce((sum, s) => sum + s.weight, 0)
  let random = Math.random() * totalWeight

  for (const segment of SPIN_SEGMENTS) {
    random -= segment.weight
    if (random <= 0) {
      return segment
    }
  }

  return SPIN_SEGMENTS[0] // Fallback
}

// Check if customer can spin (once per analysis)
export async function canSpin(customerId: string, analysisId: string) {
  // Check if already spun for this analysis
  const existingSpin = await prisma.spinReward.findFirst({
    where: {
      customerId,
      analysisId,
    },
  })

  if (existingSpin) {
    return {
      canSpin: false,
      reason: 'already_spun',
      existingReward: existingSpin,
    }
  }

  return { canSpin: true }
}

// Perform the spin
export async function spin(customerId: string, analysisId: string) {
  const spinCheck = await canSpin(customerId, analysisId)
  if (!spinCheck.canSpin) {
    return {
      success: false,
      error: 'You have already used your spin for this analysis',
      existingReward: spinCheck.existingReward,
    }
  }

  // Determine the prize
  const prize = weightedRandom()

  // Generate unique discount code
  let code = generateUniqueCode('SPIN')
  let attempts = 0
  while (attempts < 10) {
    const existing = await prisma.spinReward.findUnique({
      where: { discountCode: code },
    })
    if (!existing) break
    code = generateUniqueCode('SPIN')
    attempts++
  }

  // Set expiry to 24 hours from now
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // Create the spin reward
  const spinReward = await prisma.spinReward.create({
    data: {
      customerId,
      analysisId,
      discountPercent: prize.discountPercent,
      discountCode: code,
      expiresAt,
    },
  })

  return {
    success: true,
    prize: {
      ...prize,
      code,
      expiresAt,
    },
    spinReward,
    segmentIndex: SPIN_SEGMENTS.findIndex((s) => s.id === prize.id),
  }
}

// Get available spin rewards for a customer
export async function getAvailableSpinRewards(customerId: string) {
  return prisma.spinReward.findMany({
    where: {
      customerId,
      claimed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: 'asc' },
  })
}

// Claim a spin reward (mark as used)
export async function claimSpinReward(discountCode: string) {
  const reward = await prisma.spinReward.findUnique({
    where: { discountCode },
  })

  if (!reward) {
    return { success: false, error: 'Invalid spin reward code' }
  }

  if (reward.claimed) {
    return { success: false, error: 'This reward has already been claimed' }
  }

  if (reward.expiresAt < new Date()) {
    return { success: false, error: 'This reward has expired' }
  }

  await prisma.spinReward.update({
    where: { discountCode },
    data: {
      claimed: true,
      claimedAt: new Date(),
    },
  })

  return { success: true, discountPercent: reward.discountPercent }
}

// Check if user has pending spin for most recent analysis
export async function hasPendingSpin(customerId: string) {
  // Get most recent completed analysis
  const latestAnalysis = await prisma.skinAnalysis.findFirst({
    where: {
      customerId,
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!latestAnalysis) {
    return { hasPending: false }
  }

  // Check if spin exists for this analysis
  const existingSpin = await prisma.spinReward.findFirst({
    where: {
      customerId,
      analysisId: latestAnalysis.id,
    },
  })

  return {
    hasPending: !existingSpin,
    analysisId: latestAnalysis.id,
  }
}
