/**
 * Experimentation Agent
 *
 * Runs controlled tests, not random changes.
 *
 * Responsibilities:
 * - A/B test design
 * - Budget isolation
 * - Hypothesis definition
 * - Statistical confidence tracking
 *
 * Outputs:
 * - Test definitions
 * - Win / loss conclusions
 * - Rollout recommendations
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  Experiment,
  ExperimentType,
  ExperimentStatus,
  ExperimentVariant,
  ExperimentResults,
  DateRange,
  PPCConfig,
} from './types'

// ============================================================================
// EXPERIMENTATION AGENT TYPES
// ============================================================================

export interface ExperimentDesign {
  id: string
  name: string
  hypothesis: string
  type: ExperimentType
  primaryMetric: MetricDefinition
  secondaryMetrics: MetricDefinition[]
  variants: ExperimentVariant[]
  trafficSplit: number
  minimumRuntime: number // days
  minimumSampleSize: number
  budget: ExperimentBudget
  safeguards: ExperimentSafeguard[]
  status: ExperimentStatus
  createdAt: Date
}

export interface MetricDefinition {
  name: string
  type: 'ratio' | 'absolute' | 'revenue'
  direction: 'higher_is_better' | 'lower_is_better'
  minimumDetectableEffect: number // MDE as percentage
}

export interface ExperimentBudget {
  daily: number
  total: number
  currency: string
  isolatedFromMain: boolean
}

export interface ExperimentSafeguard {
  type: 'spend_cap' | 'cpa_cap' | 'conversion_floor' | 'duration_limit'
  threshold: number
  action: 'pause' | 'alert' | 'stop'
}

export interface ExperimentObservation {
  timestamp: Date
  control: VariantMetrics
  treatment: VariantMetrics
  pValue: number
  confidence: number
  winner: 'control' | 'treatment' | 'none'
  sampleSizeMet: boolean
  recommendation: 'continue' | 'stop_winner' | 'stop_loser' | 'inconclusive'
}

export interface VariantMetrics {
  impressions: number
  clicks: number
  conversions: number
  cost: number
  revenue: number
  ctr: number
  conversionRate: number
  cpa: number
  roas: number
}

export interface StatisticalAnalysis {
  testType: 'z_test' | 't_test' | 'chi_square' | 'bayesian'
  controlMean: number
  treatmentMean: number
  controlStdDev: number
  treatmentStdDev: number
  sampleSizeControl: number
  sampleSizeTreatment: number
  pValue: number
  confidenceInterval: [number, number]
  statisticallySignificant: boolean
  practicallySignificant: boolean
  lift: number
  liftConfidenceInterval: [number, number]
}

export interface RolloutRecommendation {
  action: 'rollout' | 'iterate' | 'abandon' | 'extend'
  confidence: number
  reasoning: string[]
  risks: string[]
  expectedImpact: {
    metric: string
    lift: number
    annualizedValue: number
  }
  nextSteps: string[]
}

// ============================================================================
// EXPERIMENTATION AGENT CLASS
// ============================================================================

export class ExperimentationAgent {
  readonly type: AgentType = 'experimentation'
  private state: AgentState
  private config: PPCConfig | null = null
  private activeExperiments: Map<string, ExperimentDesign> = new Map()
  private observations: Map<string, ExperimentObservation[]> = new Map()

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
    this.state.status = 'idle'
  }

  // --------------------------------------------------------------------------
  // EXPERIMENT DESIGN
  // --------------------------------------------------------------------------

  /**
   * Design a new experiment
   */
  async designExperiment(
    name: string,
    hypothesis: string,
    type: ExperimentType,
    controlConfig: Record<string, unknown>,
    treatmentConfig: Record<string, unknown>,
    options: {
      primaryMetric?: string
      budget?: number
      trafficSplit?: number
    } = {}
  ): Promise<ExperimentDesign> {
    this.state.status = 'processing'

    const primaryMetric = this.defineMetric(options.primaryMetric || 'conversion_rate')
    const minimumSampleSize = this.calculateMinimumSampleSize(primaryMetric)

    const experiment: ExperimentDesign = {
      id: this.generateId(),
      name,
      hypothesis,
      type,
      primaryMetric,
      secondaryMetrics: [
        this.defineMetric('ctr'),
        this.defineMetric('cpa'),
        this.defineMetric('roas'),
      ],
      variants: [
        {
          id: 'control',
          name: 'Control',
          description: 'Current configuration',
          changes: controlConfig,
        },
        {
          id: 'treatment',
          name: 'Treatment',
          description: 'Test configuration',
          changes: treatmentConfig,
        },
      ],
      trafficSplit: options.trafficSplit || 0.5,
      minimumRuntime: this.calculateMinimumRuntime(minimumSampleSize),
      minimumSampleSize,
      budget: {
        daily: options.budget || 50,
        total: (options.budget || 50) * 14,
        currency: this.config?.business.pricing.currency || 'USD',
        isolatedFromMain: true,
      },
      safeguards: this.defineSafeguards(),
      status: 'draft',
      createdAt: new Date(),
    }

    this.activeExperiments.set(experiment.id, experiment)
    this.observations.set(experiment.id, [])

    this.state.status = 'idle'
    this.state.lastAction = `Designed experiment: ${name}`
    this.state.lastActionTime = new Date()

    return experiment
  }

  /**
   * Define a metric with proper configuration
   */
  private defineMetric(name: string): MetricDefinition {
    const metrics: Record<string, MetricDefinition> = {
      conversion_rate: {
        name: 'Conversion Rate',
        type: 'ratio',
        direction: 'higher_is_better',
        minimumDetectableEffect: 0.1, // 10% relative lift
      },
      ctr: {
        name: 'Click-Through Rate',
        type: 'ratio',
        direction: 'higher_is_better',
        minimumDetectableEffect: 0.05,
      },
      cpa: {
        name: 'Cost Per Acquisition',
        type: 'absolute',
        direction: 'lower_is_better',
        minimumDetectableEffect: 0.15,
      },
      roas: {
        name: 'Return on Ad Spend',
        type: 'revenue',
        direction: 'higher_is_better',
        minimumDetectableEffect: 0.1,
      },
    }

    return metrics[name] || metrics.conversion_rate
  }

  /**
   * Calculate minimum sample size for statistical significance
   */
  private calculateMinimumSampleSize(metric: MetricDefinition): number {
    // Using standard power analysis assumptions:
    // - 80% power (beta = 0.2)
    // - 95% confidence (alpha = 0.05)
    // - Two-tailed test

    const baselineRate = 0.02 // 2% baseline conversion rate (typical for e-commerce)
    const mde = metric.minimumDetectableEffect
    const alpha = 0.05
    const beta = 0.2

    // Simplified sample size formula for proportion tests
    const zAlpha = 1.96 // 95% confidence
    const zBeta = 0.84 // 80% power

    const p1 = baselineRate
    const p2 = baselineRate * (1 + mde)
    const pBar = (p1 + p2) / 2

    const numerator = 2 * pBar * (1 - pBar) * Math.pow(zAlpha + zBeta, 2)
    const denominator = Math.pow(p1 - p2, 2)

    return Math.ceil(numerator / denominator)
  }

  /**
   * Calculate minimum runtime based on traffic
   */
  private calculateMinimumRuntime(sampleSize: number): number {
    // Assuming 100 conversions per day baseline
    const dailyConversions = 10 // Conservative estimate
    const daysNeeded = Math.ceil(sampleSize / dailyConversions)

    // Minimum 7 days, maximum 30 days
    return Math.max(7, Math.min(30, daysNeeded))
  }

  /**
   * Define experiment safeguards
   */
  private defineSafeguards(): ExperimentSafeguard[] {
    return [
      {
        type: 'spend_cap',
        threshold: 1000, // Stop if spend exceeds $1000
        action: 'stop',
      },
      {
        type: 'cpa_cap',
        threshold: (this.config?.maxCpa || 50) * 2, // Stop if CPA 2x target
        action: 'pause',
      },
      {
        type: 'conversion_floor',
        threshold: 0, // Alert if no conversions in 3 days
        action: 'alert',
      },
      {
        type: 'duration_limit',
        threshold: 30, // Stop after 30 days regardless
        action: 'stop',
      },
    ]
  }

  // --------------------------------------------------------------------------
  // EXPERIMENT MONITORING
  // --------------------------------------------------------------------------

  /**
   * Record an observation for an experiment
   */
  recordObservation(
    experimentId: string,
    controlMetrics: VariantMetrics,
    treatmentMetrics: VariantMetrics
  ): ExperimentObservation {
    const experiment = this.activeExperiments.get(experimentId)
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`)
    }

    const analysis = this.performStatisticalAnalysis(
      controlMetrics,
      treatmentMetrics,
      experiment.primaryMetric
    )

    const observation: ExperimentObservation = {
      timestamp: new Date(),
      control: controlMetrics,
      treatment: treatmentMetrics,
      pValue: analysis.pValue,
      confidence: 1 - analysis.pValue,
      winner: this.determineWinner(analysis, experiment.primaryMetric),
      sampleSizeMet: this.isSampleSizeMet(controlMetrics, treatmentMetrics, experiment),
      recommendation: this.getRecommendation(analysis, experiment),
    }

    const observations = this.observations.get(experimentId) || []
    observations.push(observation)
    this.observations.set(experimentId, observations)

    return observation
  }

  /**
   * Perform statistical analysis
   */
  private performStatisticalAnalysis(
    control: VariantMetrics,
    treatment: VariantMetrics,
    metric: MetricDefinition
  ): StatisticalAnalysis {
    // Get the relevant metric values
    const getMetricValue = (v: VariantMetrics): number => {
      switch (metric.name) {
        case 'Conversion Rate':
          return v.conversionRate
        case 'Click-Through Rate':
          return v.ctr
        case 'Cost Per Acquisition':
          return v.cpa
        case 'Return on Ad Spend':
          return v.roas
        default:
          return v.conversionRate
      }
    }

    const controlValue = getMetricValue(control)
    const treatmentValue = getMetricValue(treatment)

    // Calculate standard errors (simplified)
    const controlSE = controlValue * 0.1 // Placeholder
    const treatmentSE = treatmentValue * 0.1

    // Calculate z-score
    const pooledSE = Math.sqrt(controlSE ** 2 + treatmentSE ** 2)
    const zScore = pooledSE > 0 ? (treatmentValue - controlValue) / pooledSE : 0

    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))

    // Calculate lift
    const lift = controlValue > 0 ? (treatmentValue - controlValue) / controlValue : 0

    // Confidence interval for lift
    const marginOfError = 1.96 * (pooledSE / controlValue)
    const liftCI: [number, number] = [lift - marginOfError, lift + marginOfError]

    return {
      testType: 'z_test',
      controlMean: controlValue,
      treatmentMean: treatmentValue,
      controlStdDev: controlSE,
      treatmentStdDev: treatmentSE,
      sampleSizeControl: control.conversions,
      sampleSizeTreatment: treatment.conversions,
      pValue,
      confidenceInterval: [controlValue - 1.96 * controlSE, controlValue + 1.96 * controlSE],
      statisticallySignificant: pValue < 0.05,
      practicallySignificant: Math.abs(lift) >= metric.minimumDetectableEffect,
      lift,
      liftConfidenceInterval: liftCI,
    }
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  /**
   * Determine winner based on analysis
   */
  private determineWinner(
    analysis: StatisticalAnalysis,
    metric: MetricDefinition
  ): 'control' | 'treatment' | 'none' {
    if (!analysis.statisticallySignificant) {
      return 'none'
    }

    const treatmentBetter = metric.direction === 'higher_is_better'
      ? analysis.treatmentMean > analysis.controlMean
      : analysis.treatmentMean < analysis.controlMean

    return treatmentBetter ? 'treatment' : 'control'
  }

  /**
   * Check if minimum sample size is met
   */
  private isSampleSizeMet(
    control: VariantMetrics,
    treatment: VariantMetrics,
    experiment: ExperimentDesign
  ): boolean {
    const minPerVariant = experiment.minimumSampleSize / 2
    return control.conversions >= minPerVariant && treatment.conversions >= minPerVariant
  }

  /**
   * Get recommendation based on current state
   */
  private getRecommendation(
    analysis: StatisticalAnalysis,
    experiment: ExperimentDesign
  ): 'continue' | 'stop_winner' | 'stop_loser' | 'inconclusive' {
    // Check if we have enough data
    if (!analysis.statisticallySignificant) {
      if (analysis.sampleSizeControl < experiment.minimumSampleSize / 2) {
        return 'continue'
      }
      return 'inconclusive'
    }

    // We have significance
    if (analysis.practicallySignificant) {
      return analysis.treatmentMean > analysis.controlMean ? 'stop_winner' : 'stop_loser'
    }

    // Statistically significant but not practically significant
    return 'inconclusive'
  }

  // --------------------------------------------------------------------------
  // EXPERIMENT CONCLUSIONS
  // --------------------------------------------------------------------------

  /**
   * Generate rollout recommendation for an experiment
   */
  generateRolloutRecommendation(experimentId: string): RolloutRecommendation {
    const experiment = this.activeExperiments.get(experimentId)
    const experimentObservations = this.observations.get(experimentId)

    if (!experiment || !experimentObservations || experimentObservations.length === 0) {
      throw new Error(`No data available for experiment ${experimentId}`)
    }

    const latestObservation = experimentObservations[experimentObservations.length - 1]
    const { control, treatment, winner, confidence, sampleSizeMet } = latestObservation

    // Determine action
    let action: RolloutRecommendation['action']
    let reasoning: string[] = []
    let risks: string[] = []

    if (!sampleSizeMet) {
      action = 'extend'
      reasoning.push('Minimum sample size not yet reached')
      reasoning.push(`Current: ${control.conversions + treatment.conversions} / Required: ${experiment.minimumSampleSize}`)
    } else if (winner === 'treatment' && confidence >= 0.95) {
      action = 'rollout'
      reasoning.push(`Treatment wins with ${(confidence * 100).toFixed(1)}% confidence`)
      reasoning.push(`Conversion rate: ${(treatment.conversionRate * 100).toFixed(2)}% vs ${(control.conversionRate * 100).toFixed(2)}%`)
    } else if (winner === 'control' && confidence >= 0.95) {
      action = 'abandon'
      reasoning.push('Control outperforms treatment')
      reasoning.push('Treatment does not improve key metrics')
    } else if (confidence >= 0.8) {
      action = 'iterate'
      reasoning.push('Trending positive but not conclusive')
      reasoning.push('Consider refining the treatment hypothesis')
    } else {
      action = 'extend'
      reasoning.push('Results not yet conclusive')
      reasoning.push('More data needed for reliable decision')
    }

    // Calculate expected impact
    const lift = control.conversionRate > 0
      ? (treatment.conversionRate - control.conversionRate) / control.conversionRate
      : 0

    const monthlyConversions = control.conversions * 4 // Rough monthly estimate
    const annualizedValue = lift * monthlyConversions * 12 * (this.config?.business.pricing.averageOrderValue || 50)

    // Define risks
    if (action === 'rollout') {
      risks.push('Learning period reset may temporarily reduce performance')
      risks.push('Results may not replicate at full traffic volume')
    }

    // Define next steps
    const nextSteps: string[] = []
    switch (action) {
      case 'rollout':
        nextSteps.push('Apply treatment configuration to main campaign')
        nextSteps.push('Monitor for 7 days post-rollout')
        nextSteps.push('Document learnings for future tests')
        break
      case 'iterate':
        nextSteps.push('Analyze segment-level performance')
        nextSteps.push('Refine treatment hypothesis')
        nextSteps.push('Design follow-up experiment')
        break
      case 'abandon':
        nextSteps.push('Document what was learned')
        nextSteps.push('Archive experiment data')
        nextSteps.push('Consider alternative approaches')
        break
      case 'extend':
        nextSteps.push(`Continue for ${Math.ceil(experiment.minimumSampleSize / 10)} more days`)
        nextSteps.push('Monitor safeguard metrics')
        break
    }

    return {
      action,
      confidence,
      reasoning,
      risks,
      expectedImpact: {
        metric: experiment.primaryMetric.name,
        lift: lift * 100,
        annualizedValue,
      },
      nextSteps,
    }
  }

  /**
   * Conclude an experiment and archive
   */
  concludeExperiment(experimentId: string): ExperimentResults {
    const experiment = this.activeExperiments.get(experimentId)
    const experimentObservations = this.observations.get(experimentId)

    if (!experiment || !experimentObservations || experimentObservations.length === 0) {
      throw new Error(`Cannot conclude experiment ${experimentId}`)
    }

    const recommendation = this.generateRolloutRecommendation(experimentId)
    const latestObservation = experimentObservations[experimentObservations.length - 1]

    const results: ExperimentResults = {
      winner: latestObservation.winner === 'none' ? 'inconclusive' : latestObservation.winner,
      confidence: latestObservation.confidence,
      metrics: {
        control: {
          conversions: latestObservation.control.conversions,
          conversion_rate: latestObservation.control.conversionRate,
          cpa: latestObservation.control.cpa,
          roas: latestObservation.control.roas,
        },
        treatment: {
          conversions: latestObservation.treatment.conversions,
          conversion_rate: latestObservation.treatment.conversionRate,
          cpa: latestObservation.treatment.cpa,
          roas: latestObservation.treatment.roas,
        },
        lift: {
          conversion_rate: recommendation.expectedImpact.lift,
        },
      },
      recommendation: recommendation.reasoning.join('. '),
    }

    // Update experiment status
    experiment.status = 'completed'

    return results
  }

  // --------------------------------------------------------------------------
  // EXPERIMENT LIBRARY
  // --------------------------------------------------------------------------

  /**
   * Get pre-designed experiment templates
   */
  getExperimentTemplates(): Array<{
    name: string
    type: ExperimentType
    hypothesis: string
    defaultConfig: Record<string, unknown>
  }> {
    return [
      {
        name: 'Bid Strategy: Manual vs Target CPA',
        type: 'bid_strategy',
        hypothesis: 'Target CPA bidding will achieve lower CPA than manual CPC after learning period',
        defaultConfig: {
          control: { bidStrategy: 'manual_cpc', maxCpc: 2.0 },
          treatment: { bidStrategy: 'target_cpa', targetCpa: 30 },
        },
      },
      {
        name: 'Ad Copy: Benefit vs Feature Headlines',
        type: 'ad_copy',
        hypothesis: 'Benefit-focused headlines will drive higher CTR than feature-focused',
        defaultConfig: {
          control: { headlineApproach: 'feature' },
          treatment: { headlineApproach: 'benefit' },
        },
      },
      {
        name: 'Audience: In-Market Expansion',
        type: 'audience',
        hypothesis: 'Adding in-market audiences will increase reach without hurting CPA',
        defaultConfig: {
          control: { audiences: ['remarketing'] },
          treatment: { audiences: ['remarketing', 'in_market_beauty'] },
        },
      },
      {
        name: 'Landing Page: Long vs Short Form',
        type: 'landing_page',
        hypothesis: 'Shorter landing page will improve conversion rate',
        defaultConfig: {
          control: { landingPage: '/products/serum' },
          treatment: { landingPage: '/products/serum-short' },
        },
      },
      {
        name: 'Budget: Accelerated vs Standard Pacing',
        type: 'budget',
        hypothesis: 'Accelerated pacing captures more high-intent morning traffic',
        defaultConfig: {
          control: { pacing: 'standard' },
          treatment: { pacing: 'accelerated' },
        },
      },
    ]
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
        if (payload.action === 'design_experiment') {
          const experiment = await this.designExperiment(
            payload.name as string,
            payload.hypothesis as string,
            payload.type as ExperimentType,
            payload.controlConfig as Record<string, unknown>,
            payload.treatmentConfig as Record<string, unknown>,
            payload.options as { primaryMetric?: string; budget?: number }
          )
          response = {
            from: this.type,
            to: message.from,
            type: 'response',
            payload: experiment,
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

  getActiveExperiments(): ExperimentDesign[] {
    return Array.from(this.activeExperiments.values())
  }

  private generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const experimentationAgent = new ExperimentationAgent()
