// Streak System Utilities
import { prisma } from '@/lib/prisma'
import { DiscountType } from '@prisma/client'
import { generateDiscountCode } from './discount'

// Streak milestone configuration
export const STREAK_MILESTONES = [
  { days: 3, discountPercent: 10, label: '3-Day Starter', type: 'weekly' },
  { days: 7, discountPercent: 15, label: 'Week Warrior', type: 'daily' },
  { days: 14, discountPercent: 18, label: '2-Week Champion', type: 'daily' },
  { days: 30, discountPercent: 25, label: 'Monthly Master', type: 'daily' },
  { days: 4, discountPercent: 20, label: 'Monthly Check-in', type: 'weekly_month' }, // 4 weekly analyses in a month
] as const

// Check if a date is within the same week (for weekly streaks)
function isSameWeek(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)

  // Get the Monday of each week
  const getMonday = (d: Date) => {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const monday1 = getMonday(d1)
  const monday2 = getMonday(d2)

  return monday1.toDateString() === monday2.toDateString()
}

// Check if analysis is on consecutive days
function isConsecutiveDay(lastDate: Date, currentDate: Date): boolean {
  const last = new Date(lastDate)
  const current = new Date(currentDate)

  // Reset time to midnight for comparison
  last.setHours(0, 0, 0, 0)
  current.setHours(0, 0, 0, 0)

  const diffTime = current.getTime() - last.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  return diffDays === 1
}

// Check if analysis is same day
function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)

  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)

  return d1.getTime() === d2.getTime()
}

// Update streak after an analysis
export async function updateStreak(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  })

  if (!customer) {
    return null
  }

  const now = new Date()
  const lastAnalysis = customer.lastAnalysisDate

  let newStreak = customer.currentStreak
  let streakBroken = false
  let streakMaintained = false

  if (!lastAnalysis) {
    // First analysis
    newStreak = 1
  } else if (isSameDay(lastAnalysis, now)) {
    // Same day - streak unchanged
    streakMaintained = true
  } else if (isConsecutiveDay(lastAnalysis, now)) {
    // Consecutive day - increment streak
    newStreak = customer.currentStreak + 1
    streakMaintained = true
  } else {
    // Streak broken - reset to 1
    newStreak = 1
    streakBroken = customer.currentStreak > 1
  }

  const newLongestStreak = Math.max(customer.longestStreak, newStreak)

  // Update customer
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastAnalysisDate: now,
    },
  })

  // Check for milestone rewards
  const rewards = await checkStreakMilestones(customerId, newStreak)

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    streakBroken,
    streakMaintained,
    rewards,
  }
}

// Check and award streak milestones
async function checkStreakMilestones(customerId: string, currentStreak: number) {
  const rewards: Array<{ milestone: number; discountCode: string; discountPercent: number }> = []

  for (const milestone of STREAK_MILESTONES) {
    if (milestone.type !== 'daily') continue
    if (currentStreak < milestone.days) continue

    // Check if already achieved
    const existing = await prisma.streakMilestone.findUnique({
      where: {
        customerId_milestone: {
          customerId,
          milestone: milestone.days,
        },
      },
    })

    if (!existing) {
      // Create discount code
      const discountCode = await generateDiscountCode({
        customerId,
        discountPercent: milestone.discountPercent,
        type: DiscountType.STREAK,
        expiresInDays: 14,
        prefix: 'STREAK',
      })

      // Record milestone
      await prisma.streakMilestone.create({
        data: {
          customerId,
          milestone: milestone.days,
          rewardCode: discountCode.code,
        },
      })

      rewards.push({
        milestone: milestone.days,
        discountCode: discountCode.code,
        discountPercent: milestone.discountPercent,
      })
    }
  }

  return rewards
}

// Get streak status for a customer
export async function getStreakStatus(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      skinAnalyses: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  })

  if (!customer) {
    return null
  }

  const now = new Date()
  const lastAnalysis = customer.lastAnalysisDate

  // Check if streak is at risk (last analysis was yesterday)
  let atRisk = false
  if (lastAnalysis) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const lastDate = new Date(lastAnalysis)
    lastDate.setHours(0, 0, 0, 0)

    atRisk = lastDate.getTime() === yesterday.getTime()
  }

  // Check if streak is already broken
  let broken = false
  if (lastAnalysis) {
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    twoDaysAgo.setHours(0, 0, 0, 0)

    const lastDate = new Date(lastAnalysis)
    lastDate.setHours(0, 0, 0, 0)

    broken = lastDate.getTime() < twoDaysAgo.getTime()
  }

  // Find next milestone
  let nextMilestone = null
  for (const milestone of STREAK_MILESTONES) {
    if (milestone.type !== 'daily') continue
    if (customer.currentStreak < milestone.days) {
      nextMilestone = milestone
      break
    }
  }

  // Get achieved milestones
  const achievedMilestones = await prisma.streakMilestone.findMany({
    where: { customerId },
    orderBy: { milestone: 'asc' },
  })

  return {
    currentStreak: broken ? 0 : customer.currentStreak,
    longestStreak: customer.longestStreak,
    lastAnalysisDate: customer.lastAnalysisDate,
    atRisk,
    broken,
    nextMilestone,
    daysToNextMilestone: nextMilestone
      ? nextMilestone.days - customer.currentStreak
      : null,
    achievedMilestones: achievedMilestones.map((m) => ({
      milestone: m.milestone,
      achievedAt: m.achievedAt,
      rewardCode: m.rewardCode,
    })),
    analyzedToday: lastAnalysis ? isSameDay(lastAnalysis, now) : false,
  }
}

// Get weekly analysis count for the current month
export async function getWeeklyAnalysisCount(customerId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const analyses = await prisma.skinAnalysis.findMany({
    where: {
      customerId,
      status: 'COMPLETED',
      createdAt: { gte: startOfMonth },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Count unique weeks with analyses
  const weeksWithAnalysis = new Set<string>()
  for (const analysis of analyses) {
    const weekStart = new Date(analysis.createdAt)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weeksWithAnalysis.add(weekStart.toISOString().split('T')[0])
  }

  return {
    weeksWithAnalysis: weeksWithAnalysis.size,
    targetWeeks: 4,
    progress: weeksWithAnalysis.size / 4,
    complete: weeksWithAnalysis.size >= 4,
  }
}
