// Referral System Utilities
import { prisma } from '@/lib/prisma'
import { DiscountType, ReferralStatus } from '@prisma/client'
import { generateDiscountCode } from './discount'

// Generate a unique 8-character referral code
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like 0/O, 1/I
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Referral tier type
type ReferralTier = {
  count: number
  discountPercent: number
  label: string
  bonus?: string
}

// Referral tier configuration
export const REFERRAL_TIERS: ReferralTier[] = [
  { count: 1, discountPercent: 10, label: 'Bronze' },
  { count: 3, discountPercent: 20, label: 'Silver' },
  { count: 5, discountPercent: 25, label: 'Gold', bonus: 'Free Sample' },
  { count: 10, discountPercent: 30, label: 'Platinum', bonus: 'Free Product' },
]

// Get current tier for a customer based on referral count
export function getReferralTier(totalReferrals: number) {
  let currentTier: ReferralTier | null = null
  let nextTier: ReferralTier | null = REFERRAL_TIERS[0]

  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (totalReferrals >= REFERRAL_TIERS[i].count) {
      currentTier = REFERRAL_TIERS[i]
      nextTier = REFERRAL_TIERS[i + 1] || null
      break
    }
  }

  return {
    current: currentTier,
    next: nextTier,
    progress: nextTier ? totalReferrals / nextTier.count : 1,
    referralsToNext: nextTier ? nextTier.count - totalReferrals : 0,
  }
}

// Get or create referral code for a customer
export async function getOrCreateReferralCode(customerId: string) {
  // Check for existing code
  let referralCode = await prisma.referralCode.findUnique({
    where: { customerId },
  })

  if (!referralCode) {
    // Generate a unique code
    let code = generateReferralCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.referralCode.findUnique({ where: { code } })
      if (!existing) break
      code = generateReferralCode()
      attempts++
    }

    referralCode = await prisma.referralCode.create({
      data: {
        code,
        customerId,
        discountPercent: 10, // Referee gets 10% off
      },
    })
  }

  return referralCode
}

// Validate a referral code
export async function validateReferralCode(code: string) {
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      customer: {
        select: { firstName: true },
      },
    },
  })

  if (!referralCode) {
    return { valid: false, error: 'Invalid referral code' }
  }

  if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
    return { valid: false, error: 'This referral code has expired' }
  }

  if (referralCode.maxUses && referralCode.usageCount >= referralCode.maxUses) {
    return { valid: false, error: 'This referral code has reached its limit' }
  }

  return {
    valid: true,
    code: referralCode,
    referrerName: referralCode.customer.firstName,
    discountPercent: referralCode.discountPercent,
  }
}

// Apply referral when a new user signs up
export async function applyReferral(
  referralCode: string,
  newCustomerId: string
) {
  const validation = await validateReferralCode(referralCode)
  if (!validation.valid || !validation.code) {
    return { success: false, error: validation.error }
  }

  const code = validation.code

  // Check if this customer was already referred
  const existingReferral = await prisma.referral.findUnique({
    where: { refereeId: newCustomerId },
  })

  if (existingReferral) {
    return { success: false, error: 'You have already used a referral code' }
  }

  // Can't refer yourself
  if (code.customerId === newCustomerId) {
    return { success: false, error: 'You cannot use your own referral code' }
  }

  // Create the referral relationship
  const referral = await prisma.referral.create({
    data: {
      referrerId: code.customerId,
      refereeId: newCustomerId,
      referralCodeId: code.id,
      status: ReferralStatus.PENDING,
    },
  })

  // Update usage count
  await prisma.referralCode.update({
    where: { id: code.id },
    data: { usageCount: { increment: 1 } },
  })

  // Create discount code for the new user (referee)
  const discountCode = await generateDiscountCode({
    customerId: newCustomerId,
    discountPercent: code.discountPercent,
    type: DiscountType.REFERRED,
    expiresInDays: 7,
  })

  return {
    success: true,
    referral,
    discountCode,
    discountPercent: code.discountPercent,
  }
}

// Complete a referral (called when referee completes first analysis)
export async function completeReferral(refereeId: string) {
  const referral = await prisma.referral.findUnique({
    where: { refereeId },
    include: {
      referrer: true,
    },
  })

  if (!referral || referral.status !== ReferralStatus.PENDING) {
    return null
  }

  // Update referral status
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: ReferralStatus.COMPLETED,
      completedAt: new Date(),
    },
  })

  // Get referrer's current tier
  const tier = getReferralTier(referral.referrer.totalReferrals + 1)
  const discountPercent = tier.current?.discountPercent || 10

  // Create discount code for the referrer
  const discountCode = await generateDiscountCode({
    customerId: referral.referrerId,
    discountPercent,
    type: DiscountType.REFERRAL,
    expiresInDays: 30,
  })

  // Update referrer stats
  await prisma.customer.update({
    where: { id: referral.referrerId },
    data: {
      totalReferrals: { increment: 1 },
    },
  })

  // Mark as rewarded
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: ReferralStatus.REWARDED,
      rewardedAt: new Date(),
    },
  })

  return {
    discountCode,
    discountPercent,
    newTotalReferrals: referral.referrer.totalReferrals + 1,
    tier: tier.current,
  }
}

// Get referral stats for a customer
export async function getReferralStats(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      referralCode: true,
      referralsGiven: {
        include: {
          referee: {
            select: { firstName: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) {
    return null
  }

  const referralCode = customer.referralCode || (await getOrCreateReferralCode(customerId))
  const tier = getReferralTier(customer.totalReferrals)

  return {
    code: referralCode.code,
    totalReferrals: customer.totalReferrals,
    lifetimeDiscountEarned: customer.lifetimeDiscountEarned,
    tier,
    referrals: customer.referralsGiven.map((r) => ({
      name: r.referee.firstName,
      status: r.status,
      date: r.createdAt,
      completedAt: r.completedAt,
    })),
  }
}
