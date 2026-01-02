/**
 * PPC Strategy Agent
 *
 * The "Brain" of the PPC system. Defines commercial strategy before any spend.
 *
 * Responsibilities:
 * - Market positioning
 * - Channel selection (Google Search, PMax, Display, Meta, etc.)
 * - Budget allocation logic
 * - Testing roadmap
 * - Risk management
 *
 * Outputs:
 * - PPC Strategy Brief
 * - Budget allocation plan
 * - Experiment backlog (prioritized)
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  BusinessContext,
  DataInfrastructure,
  FunnelMap,
  PPCConfig,
  Campaign,
  CampaignType,
  Budget,
  BidStrategy,
  Experiment,
  DateRange,
} from './types'

// ============================================================================
// STRATEGY AGENT TYPES
// ============================================================================

export interface StrategyBrief {
  id: string
  createdAt: Date
  version: number

  /** Business summary */
  businessSummary: {
    product: string
    averageOrderValue: number
    grossMargin: number
    targetCpa: number
    targetRoas: number
  }

  /** Market analysis */
  marketAnalysis: {
    competitiveLandscape: 'low' | 'medium' | 'high'
    seasonality: SeasonalityPattern[]
    marketTrends: string[]
  }

  /** Channel strategy */
  channelStrategy: ChannelAllocation[]

  /** Budget plan */
  budgetPlan: BudgetPlan

  /** Testing roadmap */
  testingRoadmap: TestPriority[]

  /** Risk assessment */
  risks: RiskAssessment[]

  /** Success criteria */
  successCriteria: SuccessCriterion[]
}

export interface SeasonalityPattern {
  period: string
  impact: 'positive' | 'negative' | 'neutral'
  magnitude: number
  recommendations: string[]
}

export interface ChannelAllocation {
  channel: CampaignType
  priority: 'primary' | 'secondary' | 'experimental'
  budgetShare: number
  rationale: string
  expectedOutcome: {
    cpa: number
    roas: number
    volume: number
  }
}

export interface BudgetPlan {
  totalMonthly: number
  currency: string
  allocation: BudgetAllocationItem[]
  reserves: {
    testing: number
    contingency: number
  }
  scalingTriggers: ScalingTrigger[]
}

export interface BudgetAllocationItem {
  target: string
  type: 'channel' | 'campaign' | 'experiment'
  amount: number
  percentage: number
  conditions?: string[]
}

export interface ScalingTrigger {
  metric: string
  threshold: number
  direction: 'above' | 'below'
  action: 'increase' | 'decrease' | 'pause'
  magnitude: number
}

export interface TestPriority {
  id: string
  name: string
  hypothesis: string
  expectedImpact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  priority: number
  dependencies?: string[]
  budget: number
  duration: number
}

export interface RiskAssessment {
  category: 'market' | 'technical' | 'compliance' | 'budget' | 'performance'
  description: string
  probability: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  mitigation: string[]
}

export interface SuccessCriterion {
  metric: string
  target: number
  timeframe: number
  priority: 'must_have' | 'should_have' | 'nice_to_have'
}

// ============================================================================
// STRATEGY AGENT CLASS
// ============================================================================

export class StrategyAgent {
  readonly type: AgentType = 'strategy'
  private state: AgentState
  private config: PPCConfig | null = null
  private currentBrief: StrategyBrief | null = null

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

  /**
   * Initialize the strategy agent with project configuration
   */
  async initialize(config: PPCConfig): Promise<void> {
    this.state.status = 'processing'

    // Validate required infrastructure
    const infraIssues = this.validateInfrastructure(config.infrastructure)
    if (infraIssues.length > 0) {
      this.state.errors.push({
        code: 'INFRA_INCOMPLETE',
        message: `Infrastructure issues: ${infraIssues.join(', ')}`,
        timestamp: new Date(),
        recoverable: true,
        context: { issues: infraIssues },
      })
    }

    this.config = config
    this.state.status = 'idle'
  }

  /**
   * Validate data infrastructure readiness
   */
  private validateInfrastructure(infra: DataInfrastructure): string[] {
    const issues: string[] = []

    if (!infra.googleAds.connected) {
      issues.push('Google Ads account not connected')
    }
    if (!infra.ga4.connected) {
      issues.push('GA4 not connected')
    }
    if (!infra.googleAds.conversionActions?.length) {
      issues.push('No conversion actions configured')
    }

    return issues
  }

  // --------------------------------------------------------------------------
  // STRATEGY CREATION
  // --------------------------------------------------------------------------

  /**
   * Generate a comprehensive PPC strategy brief
   */
  async createStrategyBrief(): Promise<StrategyBrief> {
    if (!this.config) {
      throw new Error('Agent not initialized. Call initialize() first.')
    }

    this.state.status = 'processing'

    const brief: StrategyBrief = {
      id: this.generateId(),
      createdAt: new Date(),
      version: 1,
      businessSummary: this.summarizeBusiness(),
      marketAnalysis: this.analyzeMarket(),
      channelStrategy: this.determineChannelStrategy(),
      budgetPlan: this.createBudgetPlan(),
      testingRoadmap: this.createTestingRoadmap(),
      risks: this.assessRisks(),
      successCriteria: this.defineSuccessCriteria(),
    }

    this.currentBrief = brief
    this.state.status = 'idle'
    this.state.lastAction = 'Created strategy brief'
    this.state.lastActionTime = new Date()

    return brief
  }

  /**
   * Summarize business context for the brief
   */
  private summarizeBusiness(): StrategyBrief['businessSummary'] {
    const biz = this.config!.business

    // Calculate target CPA based on margin and acceptable percentage
    const targetCpa = biz.pricing.averageOrderValue * biz.pricing.grossMargin * 0.3

    return {
      product: biz.productType,
      averageOrderValue: biz.pricing.averageOrderValue,
      grossMargin: biz.pricing.grossMargin,
      targetCpa: this.config!.maxCpa || targetCpa,
      targetRoas: this.config!.targetRoas || (1 / (targetCpa / biz.pricing.averageOrderValue)),
    }
  }

  /**
   * Analyze market conditions
   */
  private analyzeMarket(): StrategyBrief['marketAnalysis'] {
    // In a real implementation, this would pull competitor data
    // and market trends from external sources

    return {
      competitiveLandscape: 'medium',
      seasonality: this.detectSeasonality(),
      marketTrends: [
        'Increasing mobile commerce',
        'Rising ad costs in vertical',
        'Opportunity in Performance Max',
      ],
    }
  }

  /**
   * Detect seasonality patterns
   */
  private detectSeasonality(): SeasonalityPattern[] {
    // For skincare (Ayonne), common patterns
    return [
      {
        period: 'Q4 (Holiday)',
        impact: 'positive',
        magnitude: 1.4,
        recommendations: ['Increase budget 40%', 'Launch gift sets', 'Emphasize gifting angles'],
      },
      {
        period: 'Summer',
        impact: 'positive',
        magnitude: 1.2,
        recommendations: ['Push SPF products', 'Target vacation audiences'],
      },
      {
        period: 'January',
        impact: 'positive',
        magnitude: 1.3,
        recommendations: ['New year skin goals', 'Resolution messaging'],
      },
    ]
  }

  /**
   * Determine optimal channel strategy
   */
  private determineChannelStrategy(): ChannelAllocation[] {
    const biz = this.config!.business
    const phase = this.config!.phase

    const channels: ChannelAllocation[] = []

    // Search - always primary for intent capture
    channels.push({
      channel: 'search',
      priority: 'primary',
      budgetShare: phase === 'test' ? 0.5 : 0.4,
      rationale: 'Capture high-intent search traffic with direct purchase intent',
      expectedOutcome: {
        cpa: this.config!.maxCpa * 0.8,
        roas: this.config!.targetRoas * 1.2,
        volume: 100,
      },
    })

    // Performance Max - secondary for reach
    channels.push({
      channel: 'pmax',
      priority: phase === 'scale' ? 'primary' : 'secondary',
      budgetShare: phase === 'test' ? 0.3 : 0.4,
      rationale: 'Leverage ML for cross-channel optimization and new customer acquisition',
      expectedOutcome: {
        cpa: this.config!.maxCpa,
        roas: this.config!.targetRoas,
        volume: 200,
      },
    })

    // Shopping - if product-based
    if (biz.productType === 'product') {
      channels.push({
        channel: 'shopping',
        priority: 'secondary',
        budgetShare: 0.15,
        rationale: 'Visual product discovery for high-intent shoppers',
        expectedOutcome: {
          cpa: this.config!.maxCpa * 0.9,
          roas: this.config!.targetRoas * 1.1,
          volume: 80,
        },
      })
    }

    // Display - experimental for remarketing
    channels.push({
      channel: 'display',
      priority: 'experimental',
      budgetShare: 0.05,
      rationale: 'Remarketing to site visitors who did not convert',
      expectedOutcome: {
        cpa: this.config!.maxCpa * 1.2,
        roas: this.config!.targetRoas * 0.8,
        volume: 30,
      },
    })

    return channels
  }

  /**
   * Create budget allocation plan
   */
  private createBudgetPlan(): BudgetPlan {
    // Default monthly budget based on target volume
    const monthlyBudget = 5000 // This would come from config

    return {
      totalMonthly: monthlyBudget,
      currency: this.config!.business.pricing.currency,
      allocation: this.determineChannelStrategy().map((ch) => ({
        target: ch.channel,
        type: 'channel' as const,
        amount: monthlyBudget * ch.budgetShare,
        percentage: ch.budgetShare * 100,
      })),
      reserves: {
        testing: monthlyBudget * 0.1,
        contingency: monthlyBudget * 0.05,
      },
      scalingTriggers: [
        {
          metric: 'cpa',
          threshold: this.config!.maxCpa * 0.7,
          direction: 'below',
          action: 'increase',
          magnitude: 0.2,
        },
        {
          metric: 'cpa',
          threshold: this.config!.maxCpa * 1.3,
          direction: 'above',
          action: 'decrease',
          magnitude: 0.3,
        },
        {
          metric: 'impression_share',
          threshold: 0.5,
          direction: 'below',
          action: 'increase',
          magnitude: 0.15,
        },
      ],
    }
  }

  /**
   * Create prioritized testing roadmap
   */
  private createTestingRoadmap(): TestPriority[] {
    const tests: TestPriority[] = []
    let priority = 1

    // Core tests for any new account
    tests.push({
      id: this.generateId(),
      name: 'Bid Strategy Validation',
      hypothesis: 'Target CPA bidding will outperform manual CPC after learning period',
      expectedImpact: 'high',
      effort: 'low',
      priority: priority++,
      budget: 500,
      duration: 14,
    })

    tests.push({
      id: this.generateId(),
      name: 'Ad Copy Messaging Test',
      hypothesis: 'Benefit-focused headlines will outperform feature-focused',
      expectedImpact: 'medium',
      effort: 'low',
      priority: priority++,
      budget: 300,
      duration: 14,
    })

    tests.push({
      id: this.generateId(),
      name: 'Audience Expansion Test',
      hypothesis: 'In-market audiences will drive incremental conversions at acceptable CPA',
      expectedImpact: 'medium',
      effort: 'medium',
      priority: priority++,
      budget: 400,
      duration: 21,
    })

    tests.push({
      id: this.generateId(),
      name: 'Landing Page Optimization',
      hypothesis: 'Simplified checkout flow will improve conversion rate by 15%',
      expectedImpact: 'high',
      effort: 'high',
      priority: priority++,
      dependencies: ['Bid Strategy Validation'],
      budget: 600,
      duration: 30,
    })

    tests.push({
      id: this.generateId(),
      name: 'Day Parting Analysis',
      hypothesis: 'Concentrating spend in peak hours will improve efficiency',
      expectedImpact: 'low',
      effort: 'low',
      priority: priority++,
      budget: 200,
      duration: 14,
    })

    return tests
  }

  /**
   * Assess strategic risks
   */
  private assessRisks(): RiskAssessment[] {
    return [
      {
        category: 'budget',
        description: 'Insufficient budget for statistical significance in tests',
        probability: 'medium',
        impact: 'high',
        mitigation: [
          'Prioritize highest-impact tests',
          'Run sequential rather than parallel tests',
          'Use Bayesian methods for faster conclusions',
        ],
      },
      {
        category: 'market',
        description: 'Competitor bid increases during peak seasons',
        probability: 'high',
        impact: 'medium',
        mitigation: [
          'Build brand term protection campaigns',
          'Diversify to non-branded terms',
          'Monitor auction insights weekly',
        ],
      },
      {
        category: 'technical',
        description: 'Conversion tracking gaps affecting optimization',
        probability: 'medium',
        impact: 'high',
        mitigation: [
          'Implement enhanced conversions',
          'Set up offline conversion import',
          'Regular tracking audits',
        ],
      },
      {
        category: 'compliance',
        description: 'Ad policy violations for skincare claims',
        probability: 'medium',
        impact: 'high',
        mitigation: [
          'Pre-review all ad copy for claims',
          'Avoid medical terminology',
          'Document cosmetic vs medical positioning',
        ],
      },
      {
        category: 'performance',
        description: 'Learning period reset from frequent changes',
        probability: 'high',
        impact: 'medium',
        mitigation: [
          'Batch changes weekly',
          'Avoid bid changes under 20%',
          'Document all changes with rationale',
        ],
      },
    ]
  }

  /**
   * Define success criteria
   */
  private defineSuccessCriteria(): SuccessCriterion[] {
    return [
      {
        metric: 'CPA',
        target: this.config!.maxCpa,
        timeframe: 30,
        priority: 'must_have',
      },
      {
        metric: 'ROAS',
        target: this.config!.targetRoas,
        timeframe: 30,
        priority: 'must_have',
      },
      {
        metric: 'Conversion Volume',
        target: 50,
        timeframe: 30,
        priority: 'should_have',
      },
      {
        metric: 'Impression Share',
        target: 0.6,
        timeframe: 30,
        priority: 'should_have',
      },
      {
        metric: 'Quality Score (avg)',
        target: 7,
        timeframe: 60,
        priority: 'nice_to_have',
      },
    ]
  }

  // --------------------------------------------------------------------------
  // BUDGET MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Recommend budget reallocation based on performance
   */
  recommendBudgetReallocation(
    performanceByChannel: Record<string, { spend: number; conversions: number; revenue: number }>
  ): BudgetAllocationItem[] {
    const recommendations: BudgetAllocationItem[] = []
    const totalSpend = Object.values(performanceByChannel).reduce((sum, p) => sum + p.spend, 0)

    for (const [channel, perf] of Object.entries(performanceByChannel)) {
      const currentShare = perf.spend / totalSpend
      const cpa = perf.spend / (perf.conversions || 1)
      const roas = perf.revenue / (perf.spend || 1)

      let recommendedShare = currentShare

      // Increase share for efficient channels
      if (cpa < this.config!.maxCpa * 0.8 && roas > this.config!.targetRoas) {
        recommendedShare = Math.min(currentShare * 1.3, 0.6)
      }
      // Decrease share for inefficient channels
      else if (cpa > this.config!.maxCpa * 1.2 || roas < this.config!.targetRoas * 0.7) {
        recommendedShare = Math.max(currentShare * 0.7, 0.05)
      }

      recommendations.push({
        target: channel,
        type: 'channel',
        amount: totalSpend * recommendedShare,
        percentage: recommendedShare * 100,
        conditions: cpa > this.config!.maxCpa ? [`CPA ${cpa.toFixed(2)} exceeds target`] : undefined,
      })
    }

    return recommendations
  }

  // --------------------------------------------------------------------------
  // AGENT COMMUNICATION
  // --------------------------------------------------------------------------

  /**
   * Handle incoming messages from other agents
   */
  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.state.status = 'processing'

    let response: AgentMessage | null = null

    switch (message.type) {
      case 'request':
        if (message.payload === 'strategy_brief') {
          const brief = await this.createStrategyBrief()
          response = {
            from: this.type,
            to: message.from,
            type: 'response',
            payload: brief,
            timestamp: new Date(),
            priority: 'medium',
            correlationId: message.correlationId,
          }
        }
        break

      case 'alert':
        // Process alerts from governance agent
        await this.processAlert(message.payload as { type: string; severity: string })
        break

      case 'recommendation':
        // Review recommendations from optimization agent
        response = this.reviewRecommendation(message)
        break
    }

    this.state.status = 'idle'
    return response
  }

  /**
   * Process alerts and adjust strategy if needed
   */
  private async processAlert(alert: { type: string; severity: string }): Promise<void> {
    if (alert.severity === 'critical') {
      // Log for immediate review
      console.warn(`[StrategyAgent] Critical alert: ${alert.type}`)
    }
  }

  /**
   * Review recommendations from other agents
   */
  private reviewRecommendation(message: AgentMessage): AgentMessage {
    const recommendation = message.payload as { action: string; impact: number }

    // Strategy agent approves/rejects based on alignment with strategy
    const approved = recommendation.impact > 0

    return {
      from: this.type,
      to: message.from,
      type: 'response',
      payload: {
        approved,
        reason: approved ? 'Aligned with strategy' : 'Does not align with current objectives',
      },
      timestamp: new Date(),
      priority: 'medium',
      correlationId: message.correlationId,
    }
  }

  // --------------------------------------------------------------------------
  // STATE & UTILITIES
  // --------------------------------------------------------------------------

  getState(): AgentState {
    return { ...this.state }
  }

  getCurrentBrief(): StrategyBrief | null {
    return this.currentBrief
  }

  private generateId(): string {
    return `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const strategyAgent = new StrategyAgent()
