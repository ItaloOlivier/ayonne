/**
 * Performance & Attribution Agent
 *
 * Measures what actually matters.
 *
 * Responsibilities:
 * - CAC tracking
 * - ROAS analysis
 * - Funnel drop-off detection
 * - Attribution sanity checks
 *
 * Outputs:
 * - Weekly performance summaries
 * - Waste diagnostics
 * - Channel efficiency reports
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  PerformanceReport,
  PerformanceMetrics,
  AttributionReport,
  AttributionModel,
  DateRange,
  PPCConfig,
  CampaignType,
} from './types'

// ============================================================================
// PERFORMANCE AGENT TYPES
// ============================================================================

export interface PerformanceSummary {
  id: string
  period: DateRange
  generatedAt: Date

  // Overall metrics
  overall: PerformanceMetrics

  // Breakdown by dimension
  byChannel: Record<string, PerformanceMetrics>
  byCampaign: Record<string, PerformanceMetrics>
  byDevice: Record<string, PerformanceMetrics>
  byDayOfWeek: Record<string, PerformanceMetrics>
  byHour: Record<string, PerformanceMetrics>

  // Key insights
  insights: PerformanceInsight[]

  // Waste analysis
  waste: WasteAnalysis

  // Trends
  trends: TrendAnalysis

  // Recommendations
  recommendations: PerformanceRecommendation[]
}

export interface PerformanceInsight {
  type: InsightType
  severity: 'positive' | 'neutral' | 'negative'
  metric: string
  message: string
  value: number
  benchmark?: number
  delta?: number
}

export type InsightType =
  | 'performance_change'
  | 'efficiency_alert'
  | 'opportunity'
  | 'risk'
  | 'anomaly'

export interface WasteAnalysis {
  totalWaste: number
  wastePercentage: number
  categories: WasteCategory[]
  recoveryPotential: number
}

export interface WasteCategory {
  name: string
  amount: number
  percentage: number
  cause: string
  action: string
  entities: Array<{ id: string; name: string; waste: number }>
}

export interface TrendAnalysis {
  period: string
  metrics: TrendMetric[]
  seasonality: SeasonalityInsight[]
  forecast: ForecastData
}

export interface TrendMetric {
  name: string
  values: Array<{ date: string; value: number }>
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  movingAverage: number[]
}

export interface SeasonalityInsight {
  pattern: string
  impact: number
  recommendation: string
}

export interface ForecastData {
  nextPeriod: {
    conversions: { low: number; mid: number; high: number }
    spend: { low: number; mid: number; high: number }
    cpa: { low: number; mid: number; high: number }
  }
  confidence: number
  assumptions: string[]
}

export interface PerformanceRecommendation {
  priority: 'high' | 'medium' | 'low'
  type: 'budget' | 'bid' | 'targeting' | 'creative' | 'structural'
  action: string
  expectedImpact: string
  effort: 'low' | 'medium' | 'high'
  deadline?: string
}

export interface FunnelAnalysis {
  stages: FunnelStage[]
  dropOffs: DropOffPoint[]
  bottlenecks: string[]
  recommendations: string[]
}

export interface FunnelStage {
  name: string
  visitors: number
  conversions: number
  conversionRate: number
  averageTimeSeconds: number
}

export interface DropOffPoint {
  from: string
  to: string
  dropOffRate: number
  absoluteLoss: number
  revenueLoss: number
  cause?: string
}

export interface ChannelEfficiency {
  channel: string
  spend: number
  conversions: number
  revenue: number
  cpa: number
  roas: number
  efficiency: number // 0-100 score
  recommendation: 'scale' | 'maintain' | 'optimize' | 'reduce' | 'pause'
  reasoning: string
}

// ============================================================================
// PERFORMANCE AGENT CLASS
// ============================================================================

export class PerformanceAgent {
  readonly type: AgentType = 'performance'
  private state: AgentState
  private config: PPCConfig | null = null
  private historicalData: PerformanceSummary[] = []

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
  // PERFORMANCE ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Generate a comprehensive performance summary
   */
  async generatePerformanceSummary(
    period: DateRange,
    data: {
      overall: PerformanceMetrics
      byChannel?: Record<string, PerformanceMetrics>
      byCampaign?: Record<string, PerformanceMetrics>
      byDevice?: Record<string, PerformanceMetrics>
      byDayOfWeek?: Record<string, PerformanceMetrics>
      byHour?: Record<string, PerformanceMetrics>
    }
  ): Promise<PerformanceSummary> {
    this.state.status = 'processing'

    const summary: PerformanceSummary = {
      id: this.generateId(),
      period,
      generatedAt: new Date(),
      overall: data.overall,
      byChannel: data.byChannel || {},
      byCampaign: data.byCampaign || {},
      byDevice: data.byDevice || {},
      byDayOfWeek: data.byDayOfWeek || {},
      byHour: data.byHour || {},
      insights: this.generateInsights(data.overall),
      waste: this.analyzeWaste(data.byCampaign || {}, data.overall),
      trends: this.analyzeTrends(data.overall),
      recommendations: this.generateRecommendations(data),
    }

    this.historicalData.push(summary)
    this.state.status = 'idle'
    this.state.lastAction = 'Generated performance summary'
    this.state.lastActionTime = new Date()

    return summary
  }

  /**
   * Generate key insights from performance data
   */
  private generateInsights(metrics: PerformanceMetrics): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []
    const targetCpa = this.config?.maxCpa || 50
    const targetRoas = this.config?.targetRoas || 3

    // CPA insight
    const cpaDelta = (metrics.cpa - targetCpa) / targetCpa
    insights.push({
      type: cpaDelta > 0.2 ? 'risk' : cpaDelta < -0.2 ? 'opportunity' : 'performance_change',
      severity: cpaDelta > 0.2 ? 'negative' : cpaDelta < -0.2 ? 'positive' : 'neutral',
      metric: 'CPA',
      message: cpaDelta > 0
        ? `CPA is ${(cpaDelta * 100).toFixed(0)}% above target`
        : `CPA is ${(Math.abs(cpaDelta) * 100).toFixed(0)}% below target`,
      value: metrics.cpa,
      benchmark: targetCpa,
      delta: cpaDelta,
    })

    // ROAS insight
    const roasDelta = (metrics.roas - targetRoas) / targetRoas
    insights.push({
      type: roasDelta < -0.2 ? 'risk' : roasDelta > 0.2 ? 'opportunity' : 'performance_change',
      severity: roasDelta < -0.2 ? 'negative' : roasDelta > 0.2 ? 'positive' : 'neutral',
      metric: 'ROAS',
      message: roasDelta > 0
        ? `ROAS is ${(roasDelta * 100).toFixed(0)}% above target`
        : `ROAS is ${(Math.abs(roasDelta) * 100).toFixed(0)}% below target`,
      value: metrics.roas,
      benchmark: targetRoas,
      delta: roasDelta,
    })

    // CTR insight
    const avgCtr = 0.02 // Industry average
    if (metrics.ctr < avgCtr * 0.5) {
      insights.push({
        type: 'efficiency_alert',
        severity: 'negative',
        metric: 'CTR',
        message: 'CTR significantly below industry average - review ad relevance',
        value: metrics.ctr,
        benchmark: avgCtr,
      })
    }

    // Conversion rate insight
    if (metrics.conversionRate < 0.01) {
      insights.push({
        type: 'efficiency_alert',
        severity: 'negative',
        metric: 'Conversion Rate',
        message: 'Conversion rate below 1% - investigate landing page or targeting',
        value: metrics.conversionRate,
        benchmark: 0.02,
      })
    }

    // Impression share insight
    if (metrics.impressionShare && metrics.impressionShare < 0.5) {
      insights.push({
        type: 'opportunity',
        severity: 'neutral',
        metric: 'Impression Share',
        message: `Capturing only ${(metrics.impressionShare * 100).toFixed(0)}% of available impressions`,
        value: metrics.impressionShare,
        benchmark: 0.7,
      })
    }

    return insights
  }

  // --------------------------------------------------------------------------
  // WASTE ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze wasted spend
   */
  private analyzeWaste(
    byCampaign: Record<string, PerformanceMetrics>,
    overall: PerformanceMetrics
  ): WasteAnalysis {
    const categories: WasteCategory[] = []
    let totalWaste = 0

    // Category 1: Zero-conversion campaigns with significant spend
    const zeroConversionCampaigns = Object.entries(byCampaign)
      .filter(([_, m]) => m.conversions === 0 && m.cost > 50)
      .map(([name, m]) => ({ id: name, name, waste: m.cost }))

    if (zeroConversionCampaigns.length > 0) {
      const wasteAmount = zeroConversionCampaigns.reduce((sum, c) => sum + c.waste, 0)
      totalWaste += wasteAmount
      categories.push({
        name: 'Zero-Conversion Campaigns',
        amount: wasteAmount,
        percentage: wasteAmount / overall.cost * 100,
        cause: 'Campaigns with spend but no conversions',
        action: 'Pause or restructure these campaigns',
        entities: zeroConversionCampaigns,
      })
    }

    // Category 2: High CPA campaigns
    const targetCpa = this.config?.maxCpa || 50
    const highCpaCampaigns = Object.entries(byCampaign)
      .filter(([_, m]) => m.conversions > 0 && m.cpa > targetCpa * 2)
      .map(([name, m]) => ({
        id: name,
        name,
        waste: m.cost - (m.conversions * targetCpa),
      }))
      .filter(c => c.waste > 0)

    if (highCpaCampaigns.length > 0) {
      const wasteAmount = highCpaCampaigns.reduce((sum, c) => sum + c.waste, 0)
      totalWaste += wasteAmount
      categories.push({
        name: 'High CPA Campaigns',
        amount: wasteAmount,
        percentage: wasteAmount / overall.cost * 100,
        cause: 'Campaigns with CPA more than 2x target',
        action: 'Optimize bids and targeting or reduce budget',
        entities: highCpaCampaigns,
      })
    }

    // Category 3: Low CTR (likely poor targeting/relevance)
    const lowCtrCampaigns = Object.entries(byCampaign)
      .filter(([_, m]) => m.ctr < 0.005 && m.impressions > 1000)
      .map(([name, m]) => ({
        id: name,
        name,
        waste: m.cost * 0.3, // Estimate 30% wasted on irrelevant clicks
      }))

    if (lowCtrCampaigns.length > 0) {
      const wasteAmount = lowCtrCampaigns.reduce((sum, c) => sum + c.waste, 0)
      totalWaste += wasteAmount
      categories.push({
        name: 'Poor Targeting',
        amount: wasteAmount,
        percentage: wasteAmount / overall.cost * 100,
        cause: 'Low CTR indicates targeting/relevance issues',
        action: 'Review keywords, audiences, and ad copy',
        entities: lowCtrCampaigns,
      })
    }

    return {
      totalWaste,
      wastePercentage: overall.cost > 0 ? (totalWaste / overall.cost) * 100 : 0,
      categories,
      recoveryPotential: totalWaste * 0.7, // Assume 70% can be recovered
    }
  }

  // --------------------------------------------------------------------------
  // TREND ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze performance trends
   */
  private analyzeTrends(current: PerformanceMetrics): TrendAnalysis {
    // In a real implementation, this would use historical data
    // For now, we'll create a placeholder structure

    return {
      period: 'weekly',
      metrics: [
        {
          name: 'Conversions',
          values: this.generatePlaceholderTrend(current.conversions),
          trend: 'up',
          changePercent: 12,
          movingAverage: [],
        },
        {
          name: 'CPA',
          values: this.generatePlaceholderTrend(current.cpa),
          trend: 'down',
          changePercent: -8,
          movingAverage: [],
        },
        {
          name: 'ROAS',
          values: this.generatePlaceholderTrend(current.roas),
          trend: 'stable',
          changePercent: 2,
          movingAverage: [],
        },
      ],
      seasonality: [
        {
          pattern: 'Weekend dip',
          impact: -15,
          recommendation: 'Reduce weekend bids or reallocate to weekdays',
        },
        {
          pattern: 'Morning peak',
          impact: 25,
          recommendation: 'Increase bids during 9am-12pm',
        },
      ],
      forecast: {
        nextPeriod: {
          conversions: {
            low: Math.floor(current.conversions * 0.85),
            mid: Math.floor(current.conversions * 1.05),
            high: Math.floor(current.conversions * 1.2),
          },
          spend: {
            low: current.cost * 0.9,
            mid: current.cost * 1.0,
            high: current.cost * 1.15,
          },
          cpa: {
            low: current.cpa * 0.9,
            mid: current.cpa,
            high: current.cpa * 1.1,
          },
        },
        confidence: 0.7,
        assumptions: [
          'No major market changes',
          'Consistent ad spend',
          'No competitor disruption',
        ],
      },
    }
  }

  private generatePlaceholderTrend(current: number): Array<{ date: string; value: number }> {
    const trend = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const variation = 0.8 + Math.random() * 0.4 // 80-120% of current
      trend.push({
        date: date.toISOString().split('T')[0],
        value: current * variation,
      })
    }

    return trend
  }

  // --------------------------------------------------------------------------
  // CHANNEL EFFICIENCY
  // --------------------------------------------------------------------------

  /**
   * Analyze channel efficiency
   */
  analyzeChannelEfficiency(
    byChannel: Record<string, PerformanceMetrics>
  ): ChannelEfficiency[] {
    const targetCpa = this.config?.maxCpa || 50
    const targetRoas = this.config?.targetRoas || 3

    return Object.entries(byChannel).map(([channel, metrics]) => {
      // Calculate efficiency score (0-100)
      let efficiency = 50 // Start at neutral

      // CPA factor
      const cpaRatio = targetCpa / (metrics.cpa || targetCpa)
      efficiency += Math.min(25, Math.max(-25, (cpaRatio - 1) * 50))

      // ROAS factor
      const roasRatio = metrics.roas / targetRoas
      efficiency += Math.min(25, Math.max(-25, (roasRatio - 1) * 50))

      efficiency = Math.max(0, Math.min(100, efficiency))

      // Determine recommendation
      let recommendation: ChannelEfficiency['recommendation']
      let reasoning: string

      if (efficiency >= 80) {
        recommendation = 'scale'
        reasoning = `Excellent efficiency (${efficiency.toFixed(0)}/100). Consider increasing budget.`
      } else if (efficiency >= 60) {
        recommendation = 'maintain'
        reasoning = `Good efficiency (${efficiency.toFixed(0)}/100). Maintain current allocation.`
      } else if (efficiency >= 40) {
        recommendation = 'optimize'
        reasoning = `Moderate efficiency (${efficiency.toFixed(0)}/100). Optimization needed.`
      } else if (efficiency >= 20) {
        recommendation = 'reduce'
        reasoning = `Low efficiency (${efficiency.toFixed(0)}/100). Reduce budget.`
      } else {
        recommendation = 'pause'
        reasoning = `Very low efficiency (${efficiency.toFixed(0)}/100). Consider pausing.`
      }

      return {
        channel,
        spend: metrics.cost,
        conversions: metrics.conversions,
        revenue: metrics.conversionValue,
        cpa: metrics.cpa,
        roas: metrics.roas,
        efficiency,
        recommendation,
        reasoning,
      }
    })
  }

  // --------------------------------------------------------------------------
  // FUNNEL ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze conversion funnel
   */
  analyzeFunnel(
    stages: Array<{ name: string; visitors: number; conversions: number; avgTimeSeconds?: number }>
  ): FunnelAnalysis {
    const funnelStages: FunnelStage[] = stages.map((s, i) => ({
      name: s.name,
      visitors: s.visitors,
      conversions: s.conversions,
      conversionRate: s.visitors > 0 ? s.conversions / s.visitors : 0,
      averageTimeSeconds: s.avgTimeSeconds || 0,
    }))

    // Calculate drop-offs
    const dropOffs: DropOffPoint[] = []
    const avgOrderValue = this.config?.business.pricing.averageOrderValue || 50

    for (let i = 0; i < stages.length - 1; i++) {
      const from = stages[i]
      const to = stages[i + 1]
      const dropOffRate = from.visitors > 0
        ? (from.visitors - to.visitors) / from.visitors
        : 0
      const absoluteLoss = from.visitors - to.visitors

      dropOffs.push({
        from: from.name,
        to: to.name,
        dropOffRate,
        absoluteLoss,
        revenueLoss: absoluteLoss * avgOrderValue * 0.02, // Assume 2% would convert
        cause: this.inferDropOffCause(from.name, dropOffRate),
      })
    }

    // Identify bottlenecks (highest drop-off stages)
    const sortedDropOffs = [...dropOffs].sort((a, b) => b.dropOffRate - a.dropOffRate)
    const bottlenecks = sortedDropOffs
      .filter(d => d.dropOffRate > 0.3)
      .slice(0, 3)
      .map(d => `${d.from} → ${d.to}: ${(d.dropOffRate * 100).toFixed(0)}% drop-off`)

    // Generate recommendations
    const recommendations = dropOffs
      .filter(d => d.dropOffRate > 0.4)
      .map(d => this.getDropOffRecommendation(d))

    return {
      stages: funnelStages,
      dropOffs,
      bottlenecks,
      recommendations,
    }
  }

  private inferDropOffCause(stageName: string, rate: number): string {
    const causes: Record<string, string> = {
      'Landing Page': rate > 0.5 ? 'Slow load time or irrelevant content' : 'Normal bounce rate',
      'Product Page': rate > 0.4 ? 'Price concerns or unclear value' : 'Normal browsing behavior',
      'Add to Cart': rate > 0.6 ? 'Shipping costs or complexity' : 'Comparison shopping',
      'Checkout': rate > 0.3 ? 'Complex checkout or trust issues' : 'Payment issues',
    }
    return causes[stageName] || 'Unknown cause'
  }

  private getDropOffRecommendation(dropOff: DropOffPoint): string {
    const recommendations: Record<string, string> = {
      'Landing Page': 'Improve page speed, add social proof, clarify value proposition',
      'Product Page': 'Add reviews, improve images, highlight free shipping threshold',
      'Add to Cart': 'Simplify cart, show savings, offer free shipping progress',
      'Checkout': 'Guest checkout, multiple payment options, trust badges',
    }
    return recommendations[dropOff.from] || 'Investigate user behavior with analytics'
  }

  // --------------------------------------------------------------------------
  // RECOMMENDATIONS
  // --------------------------------------------------------------------------

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    data: {
      overall: PerformanceMetrics
      byChannel?: Record<string, PerformanceMetrics>
      byCampaign?: Record<string, PerformanceMetrics>
    }
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = []
    const targetCpa = this.config?.maxCpa || 50

    // CPA-based recommendations
    if (data.overall.cpa > targetCpa * 1.2) {
      recommendations.push({
        priority: 'high',
        type: 'bid',
        action: 'Reduce bids by 15-20% on underperforming keywords',
        expectedImpact: 'Lower CPA by 10-15%',
        effort: 'low',
      })
    } else if (data.overall.cpa < targetCpa * 0.8) {
      recommendations.push({
        priority: 'high',
        type: 'budget',
        action: 'Increase budget on efficient campaigns to capture more volume',
        expectedImpact: 'Increase conversions by 20-30%',
        effort: 'low',
      })
    }

    // Impression share recommendations
    if (data.overall.impressionShare && data.overall.impressionShare < 0.5) {
      recommendations.push({
        priority: 'medium',
        type: 'budget',
        action: 'Increase budget or reduce target CPA to improve impression share',
        expectedImpact: 'Capture additional 30-50% of available market',
        effort: 'medium',
      })
    }

    // CTR recommendations
    if (data.overall.ctr < 0.015) {
      recommendations.push({
        priority: 'medium',
        type: 'creative',
        action: 'Test new ad copy with stronger CTAs and benefits',
        expectedImpact: 'Improve CTR by 20-40%',
        effort: 'medium',
      })
    }

    // Conversion rate recommendations
    if (data.overall.conversionRate < 0.015) {
      recommendations.push({
        priority: 'high',
        type: 'targeting',
        action: 'Review landing page experience and audience targeting',
        expectedImpact: 'Improve conversion rate by 25-50%',
        effort: 'high',
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  // --------------------------------------------------------------------------
  // ATTRIBUTION
  // --------------------------------------------------------------------------

  /**
   * Analyze attribution across channels
   */
  analyzeAttribution(
    conversions: Array<{
      touchpoints: Array<{ channel: string; timestamp: Date; type: 'impression' | 'click' }>
      value: number
    }>
  ): AttributionReport {
    // Calculate contribution by model
    const channelContribution: Record<string, number> = {}

    // Using linear attribution for simplicity
    for (const conversion of conversions) {
      const touchpoints = conversion.touchpoints
      const valuePerTouch = conversion.value / touchpoints.length

      for (const touch of touchpoints) {
        channelContribution[touch.channel] = (channelContribution[touch.channel] || 0) + valuePerTouch
      }
    }

    return {
      model: 'linear',
      conversions: conversions.map(c => ({
        touchpoints: c.touchpoints.map(t => ({
          channel: t.channel,
          timestamp: t.timestamp,
          interaction: t.type,
        })),
        conversionValue: c.value,
        conversionTime: new Date(),
      })),
      channelContribution,
    }
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
        if (payload.action === 'generate_summary') {
          const summary = await this.generatePerformanceSummary(
            payload.period as DateRange,
            payload.data as { overall: PerformanceMetrics }
          )
          response = {
            from: this.type,
            to: message.from,
            type: 'response',
            payload: summary,
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

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const performanceAgent = new PerformanceAgent()
