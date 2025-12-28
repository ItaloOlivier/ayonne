// Data Cleanup Utilities
// Removes orphaned data from users who didn't create accounts

import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

interface CleanupResult {
  guestSessionsDeleted: number
  analysesDeleted: number
  imagesDeleted: number
  expiredDiscountsDeleted: number
  expiredSpinRewardsDeleted: number
  revokedTokensDeleted: number
  errors: string[]
}

/**
 * Clean up orphaned guest data older than 2 weeks
 * This includes:
 * - Guest sessions without account conversion
 * - Anonymous skin analyses (with sessionId but no customerId)
 * - Associated images in Vercel Blob
 * - Expired discount codes
 * - Expired spin rewards
 * - Old revoked token records
 */
export async function cleanupOrphanedData(): Promise<CleanupResult> {
  const cutoffDate = new Date(Date.now() - TWO_WEEKS_MS)
  const result: CleanupResult = {
    guestSessionsDeleted: 0,
    analysesDeleted: 0,
    imagesDeleted: 0,
    expiredDiscountsDeleted: 0,
    expiredSpinRewardsDeleted: 0,
    revokedTokensDeleted: 0,
    errors: [],
  }

  try {
    // 1. Find and delete orphaned guest sessions (not converted, older than 2 weeks)
    const orphanedGuestSessions = await prisma.guestSession.findMany({
      where: {
        convertedCustomerId: null,
        createdAt: { lt: cutoffDate },
      },
    })

    if (orphanedGuestSessions.length > 0) {
      await prisma.guestSession.deleteMany({
        where: {
          id: { in: orphanedGuestSessions.map(s => s.id) },
        },
      })
      result.guestSessionsDeleted = orphanedGuestSessions.length
    }

    // 2. Find orphaned skin analyses (anonymous, no customer, older than 2 weeks)
    const orphanedAnalyses = await prisma.skinAnalysis.findMany({
      where: {
        customerId: null,
        sessionId: { not: null },
        createdAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        originalImage: true,
        frontImage: true,
        leftImage: true,
        rightImage: true,
        agedImage: true,
      },
    })

    // 3. Delete associated images from Vercel Blob
    for (const analysis of orphanedAnalyses) {
      const imageUrls = [
        analysis.originalImage,
        analysis.frontImage,
        analysis.leftImage,
        analysis.rightImage,
        analysis.agedImage,
      ].filter((url): url is string => !!url && url.includes('blob.vercel-storage.com'))

      for (const url of imageUrls) {
        try {
          await del(url)
          result.imagesDeleted++
        } catch (error) {
          // Image might already be deleted or URL invalid
          result.errors.push(`Failed to delete image: ${url}`)
        }
      }
    }

    // 4. Delete orphaned analyses from database
    if (orphanedAnalyses.length > 0) {
      await prisma.skinAnalysis.deleteMany({
        where: {
          id: { in: orphanedAnalyses.map(a => a.id) },
        },
      })
      result.analysesDeleted = orphanedAnalyses.length
    }

    // 5. Delete expired discount codes (already past expiry)
    const expiredDiscounts = await prisma.discountCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        used: false, // Only delete unused expired codes
      },
    })
    result.expiredDiscountsDeleted = expiredDiscounts.count

    // 6. Delete expired spin rewards (already past expiry and unclaimed)
    const expiredSpinRewards = await prisma.spinReward.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        claimed: false,
      },
    })
    result.expiredSpinRewardsDeleted = expiredSpinRewards.count

    // 7. Clean up old revoked token records (past their expiry)
    const oldRevokedTokens = await prisma.revokedToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
    result.revokedTokensDeleted = oldRevokedTokens.count

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown cleanup error')
  }

  return result
}

/**
 * Get statistics about orphaned data without deleting
 */
export async function getOrphanedDataStats() {
  const cutoffDate = new Date(Date.now() - TWO_WEEKS_MS)

  const [
    orphanedGuestSessions,
    orphanedAnalyses,
    expiredDiscounts,
    expiredSpinRewards,
    oldRevokedTokens,
  ] = await Promise.all([
    prisma.guestSession.count({
      where: {
        convertedCustomerId: null,
        createdAt: { lt: cutoffDate },
      },
    }),
    prisma.skinAnalysis.count({
      where: {
        customerId: null,
        sessionId: { not: null },
        createdAt: { lt: cutoffDate },
      },
    }),
    prisma.discountCode.count({
      where: {
        expiresAt: { lt: new Date() },
        used: false,
      },
    }),
    prisma.spinReward.count({
      where: {
        expiresAt: { lt: new Date() },
        claimed: false,
      },
    }),
    prisma.revokedToken.count({
      where: {
        expiresAt: { lt: new Date() },
      },
    }),
  ])

  return {
    orphanedGuestSessions,
    orphanedAnalyses,
    expiredDiscounts,
    expiredSpinRewards,
    oldRevokedTokens,
    cutoffDate: cutoffDate.toISOString(),
  }
}
