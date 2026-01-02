/**
 * Optimization & Adaptation Agent
 *
 * Continuously improves spend efficiency.
 *
 * Responsibilities:
 * - Bid strategy adjustments
 * - Budget reallocation
 * - Pausing underperformers
 * - Scaling winners responsibly
 *
 * Outputs:
 * - Optimization logs
 * - Before/after comparisons
 * - Scaling decisions with justification
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  OptimizationAction,
  OptimizationType,
  OptimizationTarget,
  OptimizationResults,
  PerformanceMetrics,
  PPCConfig,
  Campaign,
  Keyword,
  DateRange,
} from './types'

// ============================================================================
// OPTIMIZATION AGENT TYPES
// ============================================================================

export interface OptimizationPlan {
  id: string
  createdAt: Date
  period: DateRange
  actions: OptimizationAction[]
  expectedTotalImpact: {
    cpaChange: number
    roasChange: number
    conversionChange: number
    costChange: number
  }
  riskLevel: 'low' | 'medium' | 'high'
  requiresApproval: boolean
}

export interface OptimizationRule {
  id: string
  name: string
  description: string
  condition: OptimizationCondition
  action: OptimizationActionTemplate
  enabled: boolean
  priority: number
  cooldownDays: number
  lastTriggered?: Date
}

export interface OptimizationCondition {
  metric: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between'
  value: number | [number, number]
  minDataDays: number
  minConversions?: number
}

export interface OptimizationActionTemplate {
  type: OptimizationType
  adjustment: number | 'pause' | 'enable'
  adjustmentType: 'absolute' | 'percentage'
  cap?: number
  floor?: number
}

export interface OptimizationLog {
  id: string
  timestamp: Date
  action: OptimizationAction
  triggered_by: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  estimated_impact: string
  actual_impact?: string
  reverted: boolean
  revert_reason?: string
}

export interface ScalingDecision {
  entity: {
    type: 'campaign' | 'adgroup' | 'keyword'
    id: string
    name: string
  }
  decision: 'scale_up' | 'scale_down' | 'maintain' | 'pause'
  magnitude: number
  justification: string[]
  risks: string[]
  constraints: string[]
  timeline: string
}

export interface BidOptimization {
  target: OptimizationTarget
  currentBid: number
  proposedBid: number
  changePercent: number
  reasoning: string
  expectedOutcome: {
    impressions: number
    clicks: number
    conversions: number
    cost: number
  }
  confidence: number
}

export interface BudgetReallocation {
  from: { id: string; name: string; currentBudget: number }
  to: { id: string; name: string; currentBudget: number }
  amount: number
  reason: string
  expectedImpact: {
    conversions: number
    cpa: number
  }
}

// ============================================================================
// OPTIMIZATION RULES (DEFAULT)
// ============================================================================

const DEFAULT_OPTIMIZATION_RULES: OptimizationRule[] = [
  // Bid adjustments
  {
    id: 'rule_high_cpa_reduce_bid',
    name: 'Reduce bids on high CPA keywords',
    description: 'Reduce bids by 15% on keywords with CPA > 150% of target',
    condition: {
      metric: 'cpa',
      operator: 'gt',
      value: 1.5, // Multiplier of target
      minDataDays: 7,
      minConversions: 3,
    },
    action: {
      type: 'bid_adjustment',
      adjustment: -15,
      adjustmentType: 'percentage',
      floor: 0.5,
    },
    enabled: true,
    priority: 1,
    cooldownDays: 7,
  },
  {
    id: 'rule_low_cpa_increase_bid',
    name: 'Increase bids on efficient keywords',
    description: 'Increase bids by 10% on keywords with CPA < 70% of target',
    condition: {
      metric: 'cpa',
      operator: 'lt',
      value: 0.7,
      minDataDays: 7,
      minConversions: 5,
    },
    action: {
      type: 'bid_adjustment',
      adjustment: 10,
      adjustmentType: 'percentage',
      cap: 5.0,
    },
    enabled: true,
    priority: 2,
    cooldownDays: 7,
  },

  // Pause underperformers
  {
    id: 'rule_pause_no_conversions',
    name: 'Pause zero-conversion keywords',
    description: 'Pause keywords with $100+ spend and 0 conversions',
    condition: {
      metric: 'cost_no_conversion',
      operator: 'gt',
      value: 100,
      minDataDays: 14,
    },
    action: {
      type: 'keyword_pause',
      adjustment: 'pause',
      adjustmentType: 'absolute',
    },
    enabled: true,
    priority: 1,
    cooldownDays: 30,
  },

  // Budget reallocation
  {
    id: 'rule_reallocate_from_losers',
    name: 'Reallocate budget from underperformers',
    description: 'Move 20% budget from campaigns with ROAS < 1.5 to best performers',
    condition: {
      metric: 'roas',
      operator: 'lt',
      value: 1.5,
      minDataDays: 14,
      minConversions: 5,
    },
    action: {
      type: 'budget_reallocation',
      adjustment: -20,
      adjustmentType: 'percentage',
    },
    enabled: true,
    priority: 3,
    cooldownDays: 14,
  },

  // Ad rotation
  {
    id: 'rule_pause_low_ctr_ads',
    name: 'Pause low CTR ads',
    description: 'Pause ads with CTR < 1% after 1000 impressions',
    condition: {
      metric: 'ctr',
      operator: 'lt',
      value: 0.01,
      minDataDays: 7,
    },
    action: {
      type: 'ad_pause',
      adjustment: 'pause',
      adjustmentType: 'absolute',
    },
    enabled: true,
    priority: 2,
    cooldownDays: 30,
  },
]

// ============================================================================
// OPTIMIZATION AGENT CLASS
// ============================================================================

export class OptimizationAgent {
  readonly type: AgentType = 'optimization'
  private state: AgentState
  private config: PPCConfig | null = null
  private rules: OptimizationRule[] = []
  private logs: OptimizationLog[] = []
  private pendingActions: OptimizationAction[] = []

  constructor() {
    this.state = {
      agent: this.type,
      status: 'idle',
      pendingTasks: 0,
      errors: [],
    }
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  async initialize(config: PPCConfig): Promise<void> {
    this.config = config
    this.rules = [...DEFAULT_OPTIMIZATION_RULES]
    this.state.status = 'idle'
  }

  // --------------------------------------------------------------------------
  // OPTIMIZATION PLAN GENERATION
  // --------------------------------------------------------------------------

  /**
   * Generate an optimization plan based on current performance
   */
  async generateOptimizationPlan(
    performanceData: {
      campaigns: Array<{ id: string; name: string; metrics: PerformanceMetrics }>
      keywords: Array<{ id: string; text: string; campaignId: string; metrics: PerformanceMetrics }>
      ads: Array<{ id: string; campaignId: string; metrics: PerformanceMetrics }>
    }
  ): Promise<OptimizationPlan> {
    this.state.status = 'processing'

    const actions: OptimizationAction[] = []

    // Analyze campaigns
    for (const campaign of performanceData.campaigns) {
      const campaignActions = this.analyzeCampaign(campaign)
      actions.push(...campaignActions)
    }

    // Analyze keywords
    for (const keyword of performanceData.keywords) {
      const keywordActions = this.analyzeKeyword(keyword)
      actions.push(...keywordActions)
    }

    // Analyze ads
    for (const ad of performanceData.ads) {
      const adActions = this.analyzeAd(ad)
      actions.push(...adActions)
    }

    // Generate budget reallocations
    const reallocations = this.generateBudgetReallocations(performanceData.campaigns)
    actions.push(...reallocations)

    // Sort by expected impact
    actions.sort((a, b) => {
      const impactA = Math.abs(a.expectedImpact.expectedChange)
      const impactB = Math.abs(b.expectedImpact.expectedChange)
      return impactB - impactA
    })

    // Calculate total expected impact
    const expectedTotalImpact = this.calculateTotalImpact(actions)

    // Determine risk level
    const riskLevel = this.assessRiskLevel(actions)

    const plan: OptimizationPlan = {
      id: this.generateId(),
      createdAt: new Date(),
      period: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      actions,
      expectedTotalImpact,
      riskLevel,
      requiresApproval: riskLevel !== 'low' ||
        expectedTotalImpact.costChange > (this.config?.automation.requireApprovalAbove || 500),
    }

    this.state.status = 'idle'
    this.state.lastAction = 'Generated optimization plan'
    this.state.lastActionTime = new Date()

    return plan
  }

  /**
   * Analyze a campaign and generate optimization actions
   */
  private analyzeCampaign(
    campaign: { id: string; name: string; metrics: PerformanceMetrics }
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = []
    const targetCpa = this.config?.maxCpa || 50
    const targetRoas = this.config?.targetRoas || 3

    // High CPA - reduce budget or bids
    if (campaign.metrics.conversions >= 5 && campaign.metrics.cpa > targetCpa * 1.5) {
      actions.push({
        id: this.generateId(),
        type: 'budget_reallocation',
        target: {
          type: 'campaign',
          id: campaign.id,
          name: campaign.name,
        },
        currentValue: campaign.metrics.cost,
        proposedValue: campaign.metrics.cost * 0.8,
        expectedImpact: {
          metric: 'CPA',
          expectedChange: -15,
          direction: 'decrease',
        },
        confidence: 0.7,
        reasoning: `CPA of $${campaign.metrics.cpa.toFixed(2)} is ${((campaign.metrics.cpa / targetCpa - 1) * 100).toFixed(0)}% above target. Reducing budget by 20% to limit exposure.`,
        status: 'proposed',
      })
    }

    // Low ROAS - consider pausing
    if (campaign.metrics.conversions >= 3 && campaign.metrics.roas < 1.0) {
      actions.push({
        id: this.generateId(),
        type: 'budget_reallocation',
        target: {
          type: 'campaign',
          id: campaign.id,
          name: campaign.name,
        },
        currentValue: 'active',
        proposedValue: 'paused',
        expectedImpact: {
          metric: 'Waste',
          expectedChange: campaign.metrics.cost,
          direction: 'decrease',
        },
        confidence: 0.8,
        reasoning: `ROAS of ${campaign.metrics.roas.toFixed(2)}x is below 1.0 (unprofitable). Recommend pausing.`,
        status: 'proposed',
      })
    }

    // Efficient campaign - scale up
    if (
      campaign.metrics.conversions >= 10 &&
      campaign.metrics.cpa < targetCpa * 0.7 &&
      campaign.metrics.roas > targetRoas * 1.2
    ) {
      actions.push({
        id: this.generateId(),
        type: 'budget_reallocation',
        target: {
          type: 'campaign',
          id: campaign.id,
          name: campaign.name,
        },
        currentValue: campaign.metrics.cost,
        proposedValue: campaign.metrics.cost * 1.3,
        expectedImpact: {
          metric: 'Conversions',
          expectedChange: 25,
          direction: 'increase',
        },
        confidence: 0.75,
        reasoning: `Strong performer with CPA $${campaign.metrics.cpa.toFixed(2)} (${((1 - campaign.metrics.cpa / targetCpa) * 100).toFixed(0)}% below target) and ${campaign.metrics.roas.toFixed(1)}x ROAS. Scaling budget by 30%.`,
        status: 'proposed',
      })
    }

    return actions
  }

  /**
   * Analyze a keyword and generate optimization actions
   */
  private analyzeKeyword(
    keyword: { id: string; text: string; campaignId: string; metrics: PerformanceMetrics }
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = []
    const targetCpa = this.config?.maxCpa || 50

    // Zero conversions with significant spend
    if (keyword.metrics.conversions === 0 && keyword.metrics.cost > 100) {
      actions.push({
        id: this.generateId(),
        type: 'keyword_pause',
        target: {
          type: 'keyword',
          id: keyword.id,
          name: keyword.text,
        },
        currentValue: 'active',
        proposedValue: 'paused',
        expectedImpact: {
          metric: 'Waste',
          expectedChange: keyword.metrics.cost,
          direction: 'decrease',
        },
        confidence: 0.85,
        reasoning: `$${keyword.metrics.cost.toFixed(2)} spent with 0 conversions. Pausing to stop waste.`,
        status: 'proposed',
      })
    }

    // Very high CPA
    if (keyword.metrics.conversions >= 2 && keyword.metrics.cpa > targetCpa * 2) {
      actions.push({
        id: this.generateId(),
        type: 'bid_adjustment',
        target: {
          type: 'keyword',
          id: keyword.id,
          name: keyword.text,
        },
        currentValue: keyword.metrics.averageCpc,
        proposedValue: keyword.metrics.averageCpc * 0.7,
        expectedImpact: {
          metric: 'CPA',
          expectedChange: -20,
          direction: 'decrease',
        },
        confidence: 0.65,
        reasoning: `CPA of $${keyword.metrics.cpa.toFixed(2)} is ${((keyword.metrics.cpa / targetCpa - 1) * 100).toFixed(0)}% above target. Reducing bid by 30%.`,
        status: 'proposed',
      })
    }

    // Very low CTR
    if (keyword.metrics.impressions > 1000 && keyword.metrics.ctr < 0.005) {
      actions.push({
        id: this.generateId(),
        type: 'keyword_pause',
        target: {
          type: 'keyword',
          id: keyword.id,
          name: keyword.text,
        },
        currentValue: 'active',
        proposedValue: 'paused',
        expectedImpact: {
          metric: 'Quality Score',
          expectedChange: 5,
          direction: 'increase',
        },
        confidence: 0.7,
        reasoning: `CTR of ${(keyword.metrics.ctr * 100).toFixed(2)}% indicates poor relevance. Pausing to improve account quality.`,
        status: 'proposed',
      })
    }

    // Strong performer - increase bid
    if (
      keyword.metrics.conversions >= 5 &&
      keyword.metrics.cpa < targetCpa * 0.6 &&
      keyword.metrics.impressionShare && keyword.metrics.impressionShare < 0.7
    ) {
      actions.push({
        id: this.generateId(),
        type: 'bid_adjustment',
        target: {
          type: 'keyword',
          id: keyword.id,
          name: keyword.text,
        },
        currentValue: keyword.metrics.averageCpc,
        proposedValue: keyword.metrics.averageCpc * 1.2,
        expectedImpact: {
          metric: 'Conversions',
          expectedChange: 15,
          direction: 'increase',
        },
        confidence: 0.7,
        reasoning: `Efficient keyword with room to grow (${(keyword.metrics.impressionShare * 100).toFixed(0)}% IS). Increasing bid by 20%.`,
        status: 'proposed',
      })
    }

    return actions
  }

  /**
   * Analyze an ad and generate optimization actions
   */
  private analyzeAd(
    ad: { id: string; campaignId: string; metrics: PerformanceMetrics }
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = []

    // Very low CTR
    if (ad.metrics.impressions > 1000 && ad.metrics.ctr < 0.01) {
      actions.push({
        id: this.generateId(),
        type: 'ad_pause',
        target: {
          type: 'ad',
          id: ad.id,
          name: `Ad ${ad.id}`,
        },
        currentValue: 'active',
        proposedValue: 'paused',
        expectedImpact: {
          metric: 'CTR',
          expectedChange: 10,
          direction: 'increase',
        },
        confidence: 0.75,
        reasoning: `Ad CTR of ${(ad.metrics.ctr * 100).toFixed(2)}% is below 1% threshold. Pausing to improve ad group performance.`,
        status: 'proposed',
      })
    }

    return actions
  }

  // --------------------------------------------------------------------------
  // BUDGET REALLOCATION
  // --------------------------------------------------------------------------

  /**
   * Generate budget reallocation recommendations
   */
  private generateBudgetReallocations(
    campaigns: Array<{ id: string; name: string; metrics: PerformanceMetrics }>
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = []
    const targetCpa = this.config?.maxCpa || 50

    // Sort by efficiency
    const sorted = [...campaigns].sort((a, b) => {
      const effA = a.metrics.cpa > 0 ? targetCpa / a.metrics.cpa : 0
      const effB = b.metrics.cpa > 0 ? targetCpa / b.metrics.cpa : 0
      return effB - effA
    })

    // Find losers (bottom 20% by efficiency) and winners (top 20%)
    const bottomIdx = Math.floor(sorted.length * 0.8)
    const topIdx = Math.floor(sorted.length * 0.2)

    const losers = sorted.slice(bottomIdx).filter(c => c.metrics.cpa > targetCpa * 1.3)
    const winners = sorted.slice(0, topIdx).filter(c => c.metrics.cpa < targetCpa * 0.8)

    // Create reallocation actions
    if (losers.length > 0 && winners.length > 0) {
      const totalToReallocate = losers.reduce((sum, c) => sum + c.metrics.cost * 0.2, 0)
      const perWinner = totalToReallocate / winners.length

      // Add reallocation from losers
      for (const loser of losers) {
        const amountToMove = loser.metrics.cost * 0.2

        actions.push({
          id: this.generateId(),
          type: 'budget_reallocation',
          target: {
            type: 'campaign',
            id: loser.id,
            name: loser.name,
          },
          currentValue: loser.metrics.cost,
          proposedValue: loser.metrics.cost - amountToMove,
          expectedImpact: {
            metric: 'Cost Efficiency',
            expectedChange: 10,
            direction: 'increase',
          },
          confidence: 0.7,
          reasoning: `Moving $${amountToMove.toFixed(0)} from underperforming campaign (CPA $${loser.metrics.cpa.toFixed(2)}) to efficient campaigns.`,
          status: 'proposed',
        })
      }
    }

    return actions
  }

  // --------------------------------------------------------------------------
  // SCALING DECISIONS
  // --------------------------------------------------------------------------

  /**
   * Generate a scaling decision for an entity
   */
  generateScalingDecision(
    entity: { type: 'campaign' | 'adgroup' | 'keyword'; id: string; name: string },
    metrics: PerformanceMetrics,
    history: PerformanceMetrics[] // Last 4 weeks
  ): ScalingDecision {
    const targetCpa = this.config?.maxCpa || 50
    const targetRoas = this.config?.targetRoas || 3

    const justification: string[] = []
    const risks: string[] = []
    const constraints: string[] = []

    let decision: ScalingDecision['decision'] = 'maintain'
    let magnitude = 0

    // Analyze current performance
    const cpaBelowTarget = metrics.cpa < targetCpa * 0.8
    const roasAboveTarget = metrics.roas > targetRoas * 1.1
    const hasVolume = metrics.conversions >= 10
    const isConsistent = this.checkConsistency(history)

    // Scale up conditions
    if (cpaBelowTarget && roasAboveTarget && hasVolume && isConsistent) {
      decision = 'scale_up'
      magnitude = 30 // 30% increase

      justification.push(`CPA $${metrics.cpa.toFixed(2)} is ${((1 - metrics.cpa / targetCpa) * 100).toFixed(0)}% below target`)
      justification.push(`ROAS ${metrics.roas.toFixed(1)}x exceeds ${targetRoas}x target`)
      justification.push(`${metrics.conversions} conversions provides statistical confidence`)
      justification.push('Performance has been consistent over 4 weeks')

      risks.push('Scaling may trigger learning period reset')
      risks.push('CPA may increase as budget expands beyond efficient audience')

      constraints.push('Maximum 30% budget increase per week')
      constraints.push('Monitor for 7 days before further scaling')
    }
    // Scale down conditions
    else if (metrics.cpa > targetCpa * 1.5 || metrics.roas < 1.5) {
      decision = 'scale_down'
      magnitude = metrics.cpa > targetCpa * 2 ? 50 : 25

      justification.push(`CPA $${metrics.cpa.toFixed(2)} is ${((metrics.cpa / targetCpa - 1) * 100).toFixed(0)}% above target`)
      justification.push(`ROAS ${metrics.roas.toFixed(1)}x is below acceptable threshold`)

      risks.push('May lose impression share to competitors')
      risks.push('Could trigger learning period if cuts are too deep')

      constraints.push('Minimum viable budget must be maintained')
      constraints.push('Reduce gradually over 2 weeks')
    }
    // Pause conditions
    else if (metrics.conversions === 0 && metrics.cost > 200) {
      decision = 'pause'
      magnitude = 100

      justification.push(`$${metrics.cost.toFixed(2)} spent with zero conversions`)
      justification.push('No signs of improvement in trend')

      risks.push('Missing potential learning opportunities')
      risks.push('Competitors may capture the traffic')

      constraints.push('Review in 30 days')
      constraints.push('Document learnings before pausing')
    }

    return {
      entity,
      decision,
      magnitude,
      justification,
      risks,
      constraints,
      timeline: decision === 'scale_up' ? 'Implement over 7 days' :
        decision === 'scale_down' ? 'Implement over 14 days' :
          'Immediate',
    }
  }

  private checkConsistency(history: PerformanceMetrics[]): boolean {
    if (history.length < 4) return false

    // Check if CPA variance is low (consistent performance)
    const cpas = history.map(h => h.cpa)
    const avgCpa = cpas.reduce((a, b) => a + b, 0) / cpas.length
    const variance = cpas.reduce((sum, cpa) => sum + Math.pow(cpa - avgCpa, 2), 0) / cpas.length
    const cv = Math.sqrt(variance) / avgCpa // Coefficient of variation

    return cv < 0.3 // Less than 30% variation
  }

  // --------------------------------------------------------------------------
  // IMPACT CALCULATION
  // --------------------------------------------------------------------------

  private calculateTotalImpact(actions: OptimizationAction[]): OptimizationPlan['expectedTotalImpact'] {
    let cpaChange = 0
    let roasChange = 0
    let conversionChange = 0
    let costChange = 0

    for (const action of actions) {
      const change = action.expectedImpact.expectedChange
      const direction = action.expectedImpact.direction === 'increase' ? 1 : -1

      switch (action.expectedImpact.metric) {
        case 'CPA':
          cpaChange += change * direction
          break
        case 'ROAS':
          roasChange += change * direction
          break
        case 'Conversions':
          conversionChange += change * direction
          break
        case 'Cost Efficiency':
        case 'Waste':
          costChange += change * direction * -1 // Negative = savings
          break
      }
    }

    return { cpaChange, roasChange, conversionChange, costChange }
  }

  private assessRiskLevel(actions: OptimizationAction[]): 'low' | 'medium' | 'high' {
    const pauseCount = actions.filter(a => a.type.includes('pause')).length
    const budgetChanges = actions.filter(a => a.type === 'budget_reallocation')
    const totalBudgetChange = budgetChanges.reduce((sum, a) => {
      const current = a.currentValue as number
      const proposed = a.proposedValue as number
      return sum + Math.abs(proposed - current)
    }, 0)

    if (pauseCount > 5 || totalBudgetChange > 1000) return 'high'
    if (pauseCount > 2 || totalBudgetChange > 500) return 'medium'
    return 'low'
  }

  // --------------------------------------------------------------------------
  // ACTION EXECUTION
  // --------------------------------------------------------------------------

  /**
   * Apply an optimization action
   */
  async applyAction(action: OptimizationAction): Promise<OptimizationLog> {
    this.state.status = 'processing'

    const log: OptimizationLog = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      triggered_by: 'optimization_agent',
      before: { value: action.currentValue },
      after: { value: action.proposedValue },
      estimated_impact: `${action.expectedImpact.direction} ${action.expectedImpact.metric} by ${action.expectedImpact.expectedChange}%`,
      reverted: false,
    }

    // In a real implementation, this would call the Google Ads API
    // For now, we just log and update status
    action.status = 'applied'
    action.appliedAt = new Date()

    this.logs.push(log)
    this.state.status = 'idle'

    return log
  }

  /**
   * Revert a previously applied action
   */
  async revertAction(logId: string, reason: string): Promise<void> {
    const log = this.logs.find(l => l.id === logId)
    if (!log) {
      throw new Error(`Log ${logId} not found`)
    }

    log.reverted = true
    log.revert_reason = reason

    // In a real implementation, this would call the API to revert
  }

  // --------------------------------------------------------------------------
  // AGENT COMMUNICATION
  // --------------------------------------------------------------------------

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.state.status = 'processing'

    let response: AgentMessage | null = null
    const payload = message.payload as Record<string, unknown>

    switch (message.type) {
      case 'request':
        if (payload.action === 'generate_plan') {
          const plan = await this.generateOptimizationPlan(
            payload.data as {
              campaigns: Array<{ id: string; name: string; metrics: PerformanceMetrics }>
              keywords: Array<{ id: string; text: string; campaignId: string; metrics: PerformanceMetrics }>
              ads: Array<{ id: string; campaignId: string; metrics: PerformanceMetrics }>
            }
          )
          response = {
            from: this.type,
            to: message.from,
            type: 'response',
            payload: plan,
            timestamp: new Date(),
            priority: 'medium',
            correlationId: message.correlationId,
          }
        }
        break
    }

    this.state.status = 'idle'
    return response
  }

  getState(): AgentState {
    return { ...this.state }
  }

  getLogs(): OptimizationLog[] {
    return [...this.logs]
  }

  getRules(): OptimizationRule[] {
    return [...this.rules]
  }

  private generateId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const optimizationAgent = new OptimizationAgent()
