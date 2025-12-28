// 30-Day Glow Challenge System
import { prisma } from '@/lib/prisma'
import { ChallengeStatus, DiscountType } from '@prisma/client'
import { generateDiscountCode } from './discount'

// Challenge configuration
export const CHALLENGE_CONFIG = {
  durationDays: 30,
  checkpoints: [
    { day: 1, label: 'Baseline', badge: 'Challenge Started', reward: null },
    { day: 7, label: 'Week 1 Check-in', badge: 'Week Warrior', reward: { percent: 10, label: 'Week 1 Reward' } },
    { day: 14, label: 'Midpoint', badge: 'Halfway Hero', reward: { percent: 15, label: 'Midpoint Bonus' } },
    { day: 21, label: 'Final Push', badge: 'Glow Getter', reward: null },
    { day: 30, label: 'Transformation', badge: 'Glow Master', reward: { percent: 25, label: 'Challenge Complete!' } },
  ],
  completionReward: 25, // 25% off
  shareReward: 10, // Extra 10% for sharing
  referralReward: 'free_sample', // Free product sample for referral
} as const

// Join the 30-day challenge
export async function joinChallenge(customerId: string, baselineAnalysisId: string) {
  // Check if already in a challenge
  const existing = await prisma.glowChallenge.findUnique({
    where: { customerId },
  })

  if (existing && existing.status === 'ACTIVE') {
    return { success: false, error: 'Already enrolled in the challenge', challenge: existing }
  }

  // Get baseline analysis scores
  const analysis = await prisma.skinAnalysis.findUnique({
    where: { id: baselineAnalysisId },
  })

  if (!analysis) {
    return { success: false, error: 'Analysis not found' }
  }

  // Parse scores from analysis
  const conditions = analysis.conditions as Array<{ name: string; severity: string; confidence: number }>
  const { healthScore, skinAge } = calculateScoresFromConditions(conditions)

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + CHALLENGE_CONFIG.durationDays)

  // Create or update challenge
  const challenge = await prisma.glowChallenge.upsert({
    where: { customerId },
    create: {
      customerId,
      startDate,
      endDate,
      baselineAnalysisId,
      baselineHealthScore: healthScore,
      baselineSkinAge: skinAge,
      checkpoints: {
        create: CHALLENGE_CONFIG.checkpoints.map((cp) => ({
          day: cp.day,
          dueDate: addDays(startDate, cp.day),
          // Day 1 is already completed with baseline
          completed: cp.day === 1,
          completedAt: cp.day === 1 ? startDate : null,
          analysisId: cp.day === 1 ? baselineAnalysisId : null,
          healthScore: cp.day === 1 ? healthScore : null,
          skinAge: cp.day === 1 ? skinAge : null,
          badgeEarned: cp.day === 1 ? cp.badge : null,
        })),
      },
    },
    update: {
      startDate,
      endDate,
      status: 'ACTIVE',
      baselineAnalysisId,
      baselineHealthScore: healthScore,
      baselineSkinAge: skinAge,
      finalAnalysisId: null,
      finalHealthScore: null,
      finalSkinAge: null,
      completionRewardCode: null,
      shareRewardCode: null,
      transformationShared: false,
      transformationSharedAt: null,
    },
    include: { checkpoints: true },
  })

  // If updating, recreate checkpoints
  if (existing) {
    await prisma.challengeCheckpoint.deleteMany({ where: { challengeId: challenge.id } })
    await prisma.challengeCheckpoint.createMany({
      data: CHALLENGE_CONFIG.checkpoints.map((cp) => ({
        challengeId: challenge.id,
        day: cp.day,
        dueDate: addDays(startDate, cp.day),
        completed: cp.day === 1,
        completedAt: cp.day === 1 ? startDate : null,
        analysisId: cp.day === 1 ? baselineAnalysisId : null,
        healthScore: cp.day === 1 ? healthScore : null,
        skinAge: cp.day === 1 ? skinAge : null,
        badgeEarned: cp.day === 1 ? CHALLENGE_CONFIG.checkpoints[0].badge : null,
      })),
    })
  }

  return { success: true, challenge }
}

// Record an analysis during the challenge
export async function recordChallengeAnalysis(customerId: string, analysisId: string) {
  const challenge = await prisma.glowChallenge.findUnique({
    where: { customerId },
    include: { checkpoints: { orderBy: { day: 'asc' } } },
  })

  if (!challenge || challenge.status !== 'ACTIVE') {
    return { success: false, error: 'No active challenge' }
  }

  // Get analysis scores
  const analysis = await prisma.skinAnalysis.findUnique({
    where: { id: analysisId },
  })

  if (!analysis) {
    return { success: false, error: 'Analysis not found' }
  }

  const conditions = analysis.conditions as Array<{ name: string; severity: string; confidence: number }>
  const { healthScore, skinAge } = calculateScoresFromConditions(conditions)

  // Calculate current day in challenge
  const dayInChallenge = Math.ceil(
    (new Date().getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Find the appropriate checkpoint to complete
  const checkpoint = challenge.checkpoints.find(
    (cp) => !cp.completed && dayInChallenge >= cp.day - 2 // Allow 2 days early
  )

  if (!checkpoint) {
    // No checkpoint to complete, but still track the analysis
    return {
      success: true,
      checkpoint: null,
      dayInChallenge,
      message: 'Analysis recorded, no checkpoint due'
    }
  }

  // Generate reward if applicable
  const checkpointConfig = CHALLENGE_CONFIG.checkpoints.find((c) => c.day === checkpoint.day)
  let rewardCode: string | null = null

  if (checkpointConfig?.reward) {
    const discount = await generateDiscountCode({
      customerId,
      discountPercent: checkpointConfig.reward.percent,
      type: DiscountType.CHALLENGE,
      expiresInDays: 14,
      prefix: 'GLOW',
    })
    rewardCode = discount.code
  }

  // Update checkpoint
  await prisma.challengeCheckpoint.update({
    where: { id: checkpoint.id },
    data: {
      completed: true,
      completedAt: new Date(),
      analysisId,
      healthScore,
      skinAge,
      badgeEarned: checkpointConfig?.badge,
      rewardCode,
    },
  })

  // Check if this is the final checkpoint (Day 30)
  if (checkpoint.day === 30) {
    await completeChallenge(customerId, analysisId, healthScore, skinAge)
  }

  return {
    success: true,
    checkpoint: {
      day: checkpoint.day,
      badge: checkpointConfig?.badge,
      rewardCode,
      rewardPercent: checkpointConfig?.reward?.percent,
    },
    dayInChallenge,
    healthScore,
    skinAge,
    improvement: {
      healthScore: healthScore - (challenge.baselineHealthScore || 0),
      skinAge: (challenge.baselineSkinAge || 0) - skinAge,
    },
  }
}

// Complete the challenge
async function completeChallenge(
  customerId: string,
  finalAnalysisId: string,
  finalHealthScore: number,
  finalSkinAge: number
) {
  // Generate completion reward (25% off)
  const completionDiscount = await generateDiscountCode({
    customerId,
    discountPercent: CHALLENGE_CONFIG.completionReward,
    type: DiscountType.CHALLENGE,
    expiresInDays: 30,
    prefix: 'GLOWMASTER',
  })

  await prisma.glowChallenge.update({
    where: { customerId },
    data: {
      status: 'COMPLETED',
      finalAnalysisId,
      finalHealthScore,
      finalSkinAge,
      completionRewardCode: completionDiscount.code,
    },
  })
}

// Share transformation for extra reward
export async function shareTransformation(customerId: string) {
  const challenge = await prisma.glowChallenge.findUnique({
    where: { customerId },
  })

  if (!challenge || challenge.status !== 'COMPLETED') {
    return { success: false, error: 'Challenge not completed' }
  }

  if (challenge.transformationShared) {
    return { success: false, error: 'Already shared', existingCode: challenge.shareRewardCode }
  }

  // Generate share reward (extra 10% off)
  const shareDiscount = await generateDiscountCode({
    customerId,
    discountPercent: CHALLENGE_CONFIG.shareReward,
    type: DiscountType.CHALLENGE,
    expiresInDays: 14,
    prefix: 'GLOWSHARE',
  })

  await prisma.glowChallenge.update({
    where: { customerId },
    data: {
      transformationShared: true,
      transformationSharedAt: new Date(),
      shareRewardCode: shareDiscount.code,
    },
  })

  return { success: true, rewardCode: shareDiscount.code, rewardPercent: CHALLENGE_CONFIG.shareReward }
}

// Get challenge status
export async function getChallengeStatus(customerId: string) {
  const challenge = await prisma.glowChallenge.findUnique({
    where: { customerId },
    include: {
      checkpoints: { orderBy: { day: 'asc' } },
    },
  })

  if (!challenge) {
    return null
  }

  const now = new Date()
  const dayInChallenge = Math.ceil(
    (now.getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysRemaining = Math.max(0, CHALLENGE_CONFIG.durationDays - dayInChallenge)

  // Find next checkpoint
  const nextCheckpoint = challenge.checkpoints.find((cp) => !cp.completed)
  const daysToNextCheckpoint = nextCheckpoint
    ? Math.ceil((nextCheckpoint.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Calculate progress
  const completedCheckpoints = challenge.checkpoints.filter((cp) => cp.completed)
  const progressPercent = (completedCheckpoints.length / challenge.checkpoints.length) * 100

  // Calculate improvement
  const latestCompletedCheckpoint = completedCheckpoints[completedCheckpoints.length - 1]
  const improvement = latestCompletedCheckpoint
    ? {
        healthScore: (latestCompletedCheckpoint.healthScore || 0) - (challenge.baselineHealthScore || 0),
        skinAge: (challenge.baselineSkinAge || 0) - (latestCompletedCheckpoint.skinAge || 0),
      }
    : { healthScore: 0, skinAge: 0 }

  return {
    ...challenge,
    dayInChallenge,
    daysRemaining,
    nextCheckpoint: nextCheckpoint
      ? {
          day: nextCheckpoint.day,
          dueDate: nextCheckpoint.dueDate,
          daysUntil: daysToNextCheckpoint,
          label: CHALLENGE_CONFIG.checkpoints.find((c) => c.day === nextCheckpoint.day)?.label,
        }
      : null,
    progressPercent,
    completedCheckpoints: completedCheckpoints.length,
    totalCheckpoints: challenge.checkpoints.length,
    improvement,
    badges: completedCheckpoints
      .filter((cp) => cp.badgeEarned)
      .map((cp) => ({
        name: cp.badgeEarned,
        day: cp.day,
        earnedAt: cp.completedAt,
      })),
  }
}

// Check if user can join challenge
export async function canJoinChallenge(customerId: string) {
  const existing = await prisma.glowChallenge.findUnique({
    where: { customerId },
  })

  if (!existing) {
    return { canJoin: true, reason: null }
  }

  if (existing.status === 'ACTIVE') {
    return { canJoin: false, reason: 'Already in an active challenge' }
  }

  // Allow rejoining if previous challenge was completed or abandoned
  return { canJoin: true, reason: null }
}

// Helper: Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Helper: Calculate scores from conditions
function calculateScoresFromConditions(
  conditions: Array<{ name: string; severity: string; confidence: number }>
): { healthScore: number; skinAge: number } {
  // Base scores
  let healthScore = 85
  let skinAge = 30

  // Severity impacts
  const severityImpact: Record<string, { health: number; age: number }> = {
    mild: { health: -3, age: 1 },
    moderate: { health: -7, age: 3 },
    severe: { health: -12, age: 5 },
  }

  // Aging-related conditions
  const agingConditions = ['fine_lines', 'wrinkles', 'dark_spots', 'dullness', 'sagging']

  for (const condition of conditions) {
    const impact = severityImpact[condition.severity] || { health: -5, age: 2 }
    healthScore += impact.health

    if (agingConditions.includes(condition.name)) {
      skinAge += impact.age
    }
  }

  // Clamp values
  healthScore = Math.max(20, Math.min(100, healthScore))
  skinAge = Math.max(18, Math.min(70, skinAge))

  return { healthScore, skinAge }
}

// Refer a friend to the challenge
export async function referFriendToChallenge(referrerId: string) {
  const challenge = await prisma.glowChallenge.findUnique({
    where: { customerId: referrerId },
  })

  if (!challenge) {
    return { success: false, error: 'No challenge found' }
  }

  if (challenge.referralRewardClaimed) {
    return { success: false, error: 'Referral reward already claimed' }
  }

  // Mark referral reward as claimed
  await prisma.glowChallenge.update({
    where: { customerId: referrerId },
    data: { referralRewardClaimed: true },
  })

  return {
    success: true,
    reward: CHALLENGE_CONFIG.referralReward,
    message: 'Free product sample will be added to your next order!',
  }
}
