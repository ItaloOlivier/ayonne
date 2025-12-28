// Discount Code System
import { prisma } from '@/lib/prisma'
import { DiscountType } from '@prisma/client'
import { syncDiscountToShopify, isShopifyConfigured } from '@/lib/shopify-admin'

// Generate a unique discount code
export function generateUniqueCode(prefix: string = 'AYONNE'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${suffix}`
}

// Generate a discount code
export async function generateDiscountCode({
  customerId,
  discountPercent,
  type,
  expiresInDays = 7,
  prefix,
}: {
  customerId?: string | null
  discountPercent: number
  type: DiscountType
  expiresInDays?: number
  prefix?: string
}) {
  // Generate unique code
  let code = generateUniqueCode(prefix || getCodePrefix(type))
  let attempts = 0
  while (attempts < 10) {
    const existing = await prisma.discountCode.findUnique({ where: { code } })
    if (!existing) break
    code = generateUniqueCode(prefix || getCodePrefix(type))
    attempts++
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const discountCode = await prisma.discountCode.create({
    data: {
      code,
      customerId,
      discountPercent,
      type,
      expiresAt,
    },
  })

  // Auto-sync to Shopify if configured
  if (isShopifyConfigured()) {
    const syncResult = await syncDiscountToShopify({
      code,
      discountPercent,
      expiresAt,
      usageLimit: 1, // Single use codes
      oncePerCustomer: true,
      title: `Growth ${getDiscountTypeLabel(type)}: ${code}`,
    })

    // Update with Shopify ID if sync was successful
    if (syncResult.success && syncResult.discountId) {
      await prisma.discountCode.update({
        where: { id: discountCode.id },
        data: {
          shopifyDiscountCodeId: syncResult.discountId,
          shopifySynced: true,
        },
      })
    }
  }

  return discountCode
}

// Get prefix based on type
function getCodePrefix(type: DiscountType): string {
  switch (type) {
    case DiscountType.REFERRAL:
      return 'REF'
    case DiscountType.REFERRED:
      return 'WELCOME'
    case DiscountType.STREAK:
      return 'STREAK'
    case DiscountType.SPIN:
      return 'SPIN'
    case DiscountType.WELCOME:
      return 'FIRST'
    case DiscountType.CHALLENGE:
      return 'CHAMP'
    case DiscountType.GUEST:
      return 'GUEST'
    default:
      return 'AYONNE'
  }
}

// Validate a discount code
export async function validateDiscountCode(code: string) {
  const discountCode = await prisma.discountCode.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!discountCode) {
    return { valid: false, error: 'Invalid discount code' }
  }

  if (discountCode.used) {
    return { valid: false, error: 'This discount code has already been used' }
  }

  if (discountCode.expiresAt < new Date()) {
    return { valid: false, error: 'This discount code has expired' }
  }

  return {
    valid: true,
    discountCode,
    discountPercent: discountCode.discountPercent,
    type: discountCode.type,
  }
}

// Mark a discount code as used
export async function markDiscountUsed(code: string) {
  return prisma.discountCode.update({
    where: { code: code.toUpperCase() },
    data: {
      used: true,
      usedAt: new Date(),
    },
  })
}

// Get all available discounts for a customer
export async function getAvailableDiscounts(customerId: string) {
  const discounts = await prisma.discountCode.findMany({
    where: {
      customerId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: [{ discountPercent: 'desc' }, { expiresAt: 'asc' }],
  })

  return discounts
}

// Get the best available discount for a customer
export async function getBestDiscount(customerId: string) {
  const discounts = await getAvailableDiscounts(customerId)
  return discounts[0] || null
}

// Create a welcome discount for new users
export async function createWelcomeDiscount(customerId: string) {
  return generateDiscountCode({
    customerId,
    discountPercent: 10,
    type: DiscountType.WELCOME,
    expiresInDays: 30,
    prefix: 'WELCOME',
  })
}

// Get discount type label for display
export function getDiscountTypeLabel(type: DiscountType): string {
  switch (type) {
    case DiscountType.REFERRAL:
      return 'Referral Reward'
    case DiscountType.REFERRED:
      return 'Friend Referral'
    case DiscountType.STREAK:
      return 'Streak Reward'
    case DiscountType.SPIN:
      return 'Spin Wheel Prize'
    case DiscountType.WELCOME:
      return 'Welcome Bonus'
    case DiscountType.CHALLENGE:
      return 'Challenge Complete'
    case DiscountType.GUEST:
      return 'Special Offer'
    default:
      return 'Discount'
  }
}
