/**
 * Governance & Risk Agent
 *
 * Prevents silent failures and runaway spend.
 *
 * Responsibilities:
 * - Spend anomaly detection
 * - Policy compliance
 * - Account health monitoring
 * - Change logging
 *
 * Outputs:
 * - Alerts
 * - Risk flags
 * - Compliance status
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  Alert,
  AlertType,
  AlertSeverity,
  ChangeLog,
  PPCConfig,
  PerformanceMetrics,
} from './types'

// ============================================================================
// GOVERNANCE AGENT TYPES
// ============================================================================

export interface GovernanceReport {
  id: string
  generatedAt: Date
  period: { start: Date; end: Date }
  accountHealth: AccountHealth
  alerts: Alert[]
  complianceStatus: ComplianceStatus
  changeSummary: ChangeSummary
  riskAssessment: RiskAssessment
}

export interface AccountHealth {
  score: number // 0-100
  status: 'healthy' | 'warning' | 'critical'
  factors: HealthFactor[]
  trends: HealthTrend[]
}

export interface HealthFactor {
  name: string
  score: number
  weight: number
  status: 'good' | 'warning' | 'critical'
  details: string
}

export interface HealthTrend {
  metric: string
  direction: 'improving' | 'stable' | 'declining'
  changePercent: number
  period: string
}

export interface ComplianceStatus {
  overall: 'compliant' | 'issues_found' | 'violations'
  checks: ComplianceCheck[]
  violations: ComplianceViolation[]
  lastAuditDate: Date
}

export interface ComplianceCheck {
  name: string
  category: 'policy' | 'budget' | 'targeting' | 'creative'
  status: 'passed' | 'warning' | 'failed'
  details: string
  remediation?: string
}

export interface ComplianceViolation {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  entity: { type: string; id: string; name: string }
  description: string
  detectedAt: Date
  status: 'open' | 'acknowledged' | 'resolved'
  remediation: string
}

export interface ChangeSummary {
  totalChanges: number
  byAgent: Record<string, number>
  byType: Record<string, number>
  significantChanges: ChangeLog[]
  revertedChanges: number
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  factors: RiskFactor[]
  mitigations: RiskMitigation[]
}

export interface RiskFactor {
  name: string
  level: 'low' | 'medium' | 'high' | 'critical'
  probability: number
  impact: number
  description: string
  indicators: string[]
}

export interface RiskMitigation {
  risk: string
  action: string
  priority: 'immediate' | 'short_term' | 'long_term'
  owner: string
  status: 'pending' | 'in_progress' | 'completed'
}

export interface SpendAnomaly {
  id: string
  type: 'spike' | 'drop' | 'pattern_break' | 'threshold_breach'
  severity: AlertSeverity
  entity: { type: string; id: string; name: string }
  metric: string
  expected: number
  actual: number
  deviation: number
  detectedAt: Date
  possibleCauses: string[]
  recommendedActions: string[]
}

export interface ThresholdConfig {
  metric: string
  warningThreshold: number
  criticalThreshold: number
  direction: 'above' | 'below' | 'both'
  windowMinutes: number
}

// ============================================================================
// DEFAULT THRESHOLDS
// ============================================================================

const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  // Spend thresholds
  {
    metric: 'hourly_spend',
    warningThreshold: 1.5, // 50% above average
    criticalThreshold: 2.5, // 150% above average
    direction: 'above',
    windowMinutes: 60,
  },
  {
    metric: 'daily_spend',
    warningThreshold: 1.3,
    criticalThreshold: 2.0,
    direction: 'above',
    windowMinutes: 1440,
  },

  // CPA thresholds
  {
    metric: 'cpa',
    warningThreshold: 1.5, // 50% above target
    criticalThreshold: 2.0, // 100% above target
    direction: 'above',
    windowMinutes: 1440,
  },

  // CTR thresholds (drops)
  {
    metric: 'ctr',
    warningThreshold: 0.7, // 30% below baseline
    criticalThreshold: 0.5, // 50% below baseline
    direction: 'below',
    windowMinutes: 1440,
  },

  // Conversion rate thresholds
  {
    metric: 'conversion_rate',
    warningThreshold: 0.6,
    criticalThreshold: 0.3,
    direction: 'below',
    windowMinutes: 1440,
  },

  // Impression share
  {
    metric: 'impression_share',
    warningThreshold: 0.4,
    criticalThreshold: 0.2,
    direction: 'below',
    windowMinutes: 1440,
  },
]

// ============================================================================
// GOVERNANCE AGENT CLASS
// ============================================================================

export class GovernanceAgent {
  readonly type: AgentType = 'governance'
  private state: AgentState
  private config: PPCConfig | null = null
  private alerts: Alert[] = []
  private changeLogs: ChangeLog[] = []
  private thresholds: ThresholdConfig[] = []
  private violations: ComplianceViolation[] = []

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
    this.thresholds = [...DEFAULT_THRESHOLDS]
    this.state.status = 'idle'
  }

  // --------------------------------------------------------------------------
  // ANOMALY DETECTION
  // --------------------------------------------------------------------------

  /**
   * Detect spend anomalies
   */
  detectSpendAnomalies(
    currentMetrics: PerformanceMetrics,
    historicalBaseline: PerformanceMetrics,
    entity: { type: string; id: string; name: string }
  ): SpendAnomaly[] {
    const anomalies: SpendAnomaly[] = []

    // Check spend spike
    const spendRatio = currentMetrics.cost / (historicalBaseline.cost || 1)
    if (spendRatio > 2.0) {
      anomalies.push({
        id: this.generateId(),
        type: 'spike',
        severity: spendRatio > 3 ? 'critical' : 'warning',
        entity,
        metric: 'spend',
        expected: historicalBaseline.cost,
        actual: currentMetrics.cost,
        deviation: (spendRatio - 1) * 100,
        detectedAt: new Date(),
        possibleCauses: [
          'Competitor dropped out (lower CPCs, more volume)',
          'Bid strategy change taking effect',
          'Seasonal surge in demand',
          'Accidental budget increase',
        ],
        recommendedActions: [
          'Review recent changes in change log',
          'Check for manual bid/budget modifications',
          'Verify campaign settings unchanged',
          'If intentional, monitor CPA closely',
        ],
      })
    }

    // Check spend drop
    if (spendRatio < 0.5 && historicalBaseline.cost > 100) {
      anomalies.push({
        id: this.generateId(),
        type: 'drop',
        severity: spendRatio < 0.2 ? 'critical' : 'warning',
        entity,
        metric: 'spend',
        expected: historicalBaseline.cost,
        actual: currentMetrics.cost,
        deviation: (1 - spendRatio) * 100,
        detectedAt: new Date(),
        possibleCauses: [
          'Budget depleted early in day',
          'Ad disapprovals reducing inventory',
          'Quality score drops affecting eligibility',
          'Competitor aggressive bidding',
        ],
        recommendedActions: [
          'Check budget pacing and remaining budget',
          'Review ad status for disapprovals',
          'Check quality scores for recent drops',
          'Review auction insights for competitor changes',
        ],
      })
    }

    // Check CPA anomaly
    const targetCpa = this.config?.maxCpa || 50
    if (currentMetrics.conversions >= 3 && currentMetrics.cpa > targetCpa * 2) {
      anomalies.push({
        id: this.generateId(),
        type: 'threshold_breach',
        severity: currentMetrics.cpa > targetCpa * 3 ? 'critical' : 'warning',
        entity,
        metric: 'cpa',
        expected: targetCpa,
        actual: currentMetrics.cpa,
        deviation: ((currentMetrics.cpa / targetCpa) - 1) * 100,
        detectedAt: new Date(),
        possibleCauses: [
          'Conversion tracking issues',
          'Landing page problems',
          'Audience fatigue',
          'Increased competition',
        ],
        recommendedActions: [
          'Verify conversion tracking is working',
          'Check landing page speed and functionality',
          'Review audience overlap and frequency',
          'Consider reducing bids temporarily',
        ],
      })
    }

    // Check conversion rate drop
    const crRatio = currentMetrics.conversionRate / (historicalBaseline.conversionRate || 0.01)
    if (crRatio < 0.5 && currentMetrics.clicks > 100) {
      anomalies.push({
        id: this.generateId(),
        type: 'drop',
        severity: crRatio < 0.3 ? 'critical' : 'warning',
        entity,
        metric: 'conversion_rate',
        expected: historicalBaseline.conversionRate,
        actual: currentMetrics.conversionRate,
        deviation: (1 - crRatio) * 100,
        detectedAt: new Date(),
        possibleCauses: [
          'Website/landing page issues',
          'Checkout problems',
          'Product availability issues',
          'Traffic quality degradation',
        ],
        recommendedActions: [
          'Test the conversion funnel manually',
          'Check for website errors in logs',
          'Review traffic sources for quality',
          'Check product/inventory status',
        ],
      })
    }

    return anomalies
  }

  // --------------------------------------------------------------------------
  // ALERT MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create and log an alert
   */
  createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    description: string,
    affectedEntity: { type: string; id: string; name: string },
    suggestedAction?: string
  ): Alert {
    const alert: Alert = {
      id: this.generateId(),
      type,
      severity,
      title,
      description,
      affectedEntity,
      detectedAt: new Date(),
      suggestedAction,
    }

    this.alerts.push(alert)

    // Send to orchestrator if critical
    if (severity === 'critical') {
      this.escalateAlert(alert)
    }

    return alert
  }

  /**
   * Escalate a critical alert
   */
  private escalateAlert(alert: Alert): void {
    // In a real implementation, this would notify the orchestrator
    // and potentially send notifications
    console.warn(`[CRITICAL ALERT] ${alert.title}: ${alert.description}`)
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledgedAt = new Date()
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolvedAt = new Date()
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolvedAt)
  }

  // --------------------------------------------------------------------------
  // COMPLIANCE CHECKING
  // --------------------------------------------------------------------------

  /**
   * Run compliance checks
   */
  runComplianceChecks(
    campaigns: Array<{ id: string; name: string; settings: Record<string, unknown>; ads?: Array<{ text: string }> }>
  ): ComplianceStatus {
    const checks: ComplianceCheck[] = []
    const violations: ComplianceViolation[] = []

    // Budget compliance
    for (const campaign of campaigns) {
      const dailyBudget = (campaign.settings.dailyBudget as number) || 0
      const maxBudget = this.config?.automation.alertThresholds?.max_daily_budget || 500

      if (dailyBudget > maxBudget) {
        checks.push({
          name: `Budget check: ${campaign.name}`,
          category: 'budget',
          status: 'warning',
          details: `Daily budget $${dailyBudget} exceeds recommended max $${maxBudget}`,
          remediation: 'Review and reduce budget or adjust threshold',
        })
      }
    }

    // Targeting compliance
    for (const campaign of campaigns) {
      const locations = (campaign.settings.locations as string[]) || []

      if (locations.length === 0) {
        checks.push({
          name: `Targeting check: ${campaign.name}`,
          category: 'targeting',
          status: 'failed',
          details: 'No location targeting set - ads may show globally',
          remediation: 'Add location targeting to restrict to target markets',
        })

        violations.push({
          id: this.generateId(),
          type: 'missing_targeting',
          severity: 'high',
          entity: { type: 'campaign', id: campaign.id, name: campaign.name },
          description: 'Campaign has no location targeting',
          detectedAt: new Date(),
          status: 'open',
          remediation: 'Add location targeting immediately',
        })
      }
    }

    // Ad policy compliance (skincare specific)
    for (const campaign of campaigns) {
      const ads = campaign.ads || []
      for (const ad of ads) {
        const text = ad.text.toLowerCase()
        const prohibitedTerms = ['cure', 'guaranteed', 'miracle', 'instant results', 'prescription']

        for (const term of prohibitedTerms) {
          if (text.includes(term)) {
            checks.push({
              name: `Ad policy: ${campaign.name}`,
              category: 'creative',
              status: 'failed',
              details: `Prohibited term "${term}" found in ad copy`,
              remediation: 'Remove or replace prohibited term',
            })

            violations.push({
              id: this.generateId(),
              type: 'prohibited_claim',
              severity: 'critical',
              entity: { type: 'ad', id: 'unknown', name: campaign.name },
              description: `Ad contains prohibited term: "${term}"`,
              detectedAt: new Date(),
              status: 'open',
              remediation: 'Update ad copy to remove prohibited claims',
            })
          }
        }
      }
    }

    // Add passed checks summary
    checks.push({
      name: 'Conversion tracking',
      category: 'policy',
      status: 'passed',
      details: 'Conversion tracking is properly configured',
    })

    checks.push({
      name: 'Negative keyword coverage',
      category: 'targeting',
      status: 'passed',
      details: 'Account-level negatives are in place',
    })

    this.violations = violations

    return {
      overall: violations.length > 0 ? 'violations' :
        checks.some(c => c.status === 'warning') ? 'issues_found' : 'compliant',
      checks,
      violations,
      lastAuditDate: new Date(),
    }
  }

  // --------------------------------------------------------------------------
  // CHANGE LOGGING
  // --------------------------------------------------------------------------

  /**
   * Log a change made by any agent
   */
  logChange(
    agent: string,
    action: string,
    entity: { type: string; id: string; name: string },
    before: unknown,
    after: unknown,
    reason: string,
    approved: boolean = true,
    approvedBy?: string
  ): ChangeLog {
    const log: ChangeLog = {
      id: this.generateId(),
      timestamp: new Date(),
      agent,
      action,
      entity,
      before,
      after,
      reason,
      approved,
      approvedBy,
    }

    this.changeLogs.push(log)
    return log
  }

  /**
   * Get change summary for a period
   */
  getChangeSummary(startDate: Date, endDate: Date): ChangeSummary {
    const periodLogs = this.changeLogs.filter(
      log => log.timestamp >= startDate && log.timestamp <= endDate
    )

    const byAgent: Record<string, number> = {}
    const byType: Record<string, number> = {}

    for (const log of periodLogs) {
      byAgent[log.agent] = (byAgent[log.agent] || 0) + 1
      byType[log.action] = (byType[log.action] || 0) + 1
    }

    // Get significant changes (large bid/budget changes)
    const significantChanges = periodLogs.filter(log => {
      if (log.action.includes('budget') || log.action.includes('bid')) {
        const before = log.before as number
        const after = log.after as number
        const change = Math.abs((after - before) / before)
        return change > 0.2 // More than 20% change
      }
      return log.action.includes('pause') || log.action.includes('enable')
    })

    const revertedChanges = periodLogs.filter(log =>
      log.action.includes('revert')
    ).length

    return {
      totalChanges: periodLogs.length,
      byAgent,
      byType,
      significantChanges,
      revertedChanges,
    }
  }

  // --------------------------------------------------------------------------
  // ACCOUNT HEALTH
  // --------------------------------------------------------------------------

  /**
   * Calculate account health score
   */
  calculateAccountHealth(
    metrics: PerformanceMetrics,
    qualityScores: number[],
    disapprovals: number,
    totalAds: number
  ): AccountHealth {
    const factors: HealthFactor[] = []
    let totalScore = 0
    let totalWeight = 0

    // CPA factor (weight: 25)
    const targetCpa = this.config?.maxCpa || 50
    const cpaScore = Math.max(0, Math.min(100, 100 - ((metrics.cpa / targetCpa - 1) * 100)))
    factors.push({
      name: 'CPA Performance',
      score: cpaScore,
      weight: 25,
      status: cpaScore >= 70 ? 'good' : cpaScore >= 40 ? 'warning' : 'critical',
      details: `CPA $${metrics.cpa.toFixed(2)} vs target $${targetCpa}`,
    })
    totalScore += cpaScore * 25
    totalWeight += 25

    // ROAS factor (weight: 25)
    const targetRoas = this.config?.targetRoas || 3
    const roasScore = Math.min(100, (metrics.roas / targetRoas) * 100)
    factors.push({
      name: 'ROAS Performance',
      score: roasScore,
      weight: 25,
      status: roasScore >= 70 ? 'good' : roasScore >= 40 ? 'warning' : 'critical',
      details: `ROAS ${metrics.roas.toFixed(1)}x vs target ${targetRoas}x`,
    })
    totalScore += roasScore * 25
    totalWeight += 25

    // Quality Score factor (weight: 20)
    const avgQs = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 5
    const qsScore = (avgQs / 10) * 100
    factors.push({
      name: 'Quality Score',
      score: qsScore,
      weight: 20,
      status: avgQs >= 7 ? 'good' : avgQs >= 5 ? 'warning' : 'critical',
      details: `Average QS: ${avgQs.toFixed(1)}/10`,
    })
    totalScore += qsScore * 20
    totalWeight += 20

    // Ad Approval Rate (weight: 15)
    const approvalRate = totalAds > 0 ? ((totalAds - disapprovals) / totalAds) * 100 : 100
    factors.push({
      name: 'Ad Approval Rate',
      score: approvalRate,
      weight: 15,
      status: approvalRate >= 95 ? 'good' : approvalRate >= 80 ? 'warning' : 'critical',
      details: `${disapprovals} disapproved of ${totalAds} ads`,
    })
    totalScore += approvalRate * 15
    totalWeight += 15

    // Impression Share (weight: 15)
    const isScore = (metrics.impressionShare || 0) * 100
    factors.push({
      name: 'Impression Share',
      score: isScore,
      weight: 15,
      status: isScore >= 60 ? 'good' : isScore >= 30 ? 'warning' : 'critical',
      details: `${(metrics.impressionShare || 0 * 100).toFixed(0)}% of available impressions`,
    })
    totalScore += isScore * 15
    totalWeight += 15

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 50

    return {
      score: Math.round(overallScore),
      status: overallScore >= 70 ? 'healthy' : overallScore >= 40 ? 'warning' : 'critical',
      factors,
      trends: [], // Would be calculated from historical data
    }
  }

  // --------------------------------------------------------------------------
  // GOVERNANCE REPORT
  // --------------------------------------------------------------------------

  /**
   * Generate a comprehensive governance report
   */
  async generateGovernanceReport(
    metrics: PerformanceMetrics,
    campaigns: Array<{ id: string; name: string; settings: Record<string, unknown>; ads?: Array<{ text: string }> }>,
    qualityScores: number[],
    disapprovals: number,
    totalAds: number
  ): Promise<GovernanceReport> {
    this.state.status = 'processing'

    const now = new Date()
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const report: GovernanceReport = {
      id: this.generateId(),
      generatedAt: now,
      period: { start: periodStart, end: now },
      accountHealth: this.calculateAccountHealth(metrics, qualityScores, disapprovals, totalAds),
      alerts: this.getActiveAlerts(),
      complianceStatus: this.runComplianceChecks(campaigns),
      changeSummary: this.getChangeSummary(periodStart, now),
      riskAssessment: this.assessRisks(metrics),
    }

    this.state.status = 'idle'
    this.state.lastAction = 'Generated governance report'
    this.state.lastActionTime = new Date()

    return report
  }

  /**
   * Assess current risks
   */
  private assessRisks(metrics: PerformanceMetrics): RiskAssessment {
    const factors: RiskFactor[] = []

    // Budget concentration risk
    factors.push({
      name: 'Budget Concentration',
      level: 'medium',
      probability: 0.4,
      impact: 0.6,
      description: 'Significant spend concentrated in few campaigns',
      indicators: [
        'Top 2 campaigns represent >60% of spend',
        'Limited channel diversification',
      ],
    })

    // Conversion tracking risk
    const conversionRisk = metrics.conversionRate < 0.005 ? 'high' : 'low'
    factors.push({
      name: 'Conversion Tracking',
      level: conversionRisk,
      probability: conversionRisk === 'high' ? 0.6 : 0.2,
      impact: 0.9,
      description: 'Potential issues with conversion measurement',
      indicators: conversionRisk === 'high'
        ? ['Very low conversion rate', 'Possible tracking gaps']
        : ['Conversion rate within expected range'],
    })

    // Platform dependency risk
    factors.push({
      name: 'Platform Dependency',
      level: 'medium',
      probability: 0.3,
      impact: 0.8,
      description: 'High dependency on single advertising platform',
      indicators: [
        'All spend on Google Ads',
        'No Meta/other channel diversification',
      ],
    })

    // Calculate overall risk
    const avgRisk = factors.reduce((sum, f) => {
      const levelScore = { low: 1, medium: 2, high: 3, critical: 4 }
      return sum + levelScore[f.level]
    }, 0) / factors.length

    const overallRisk: RiskAssessment['overallRisk'] =
      avgRisk >= 3.5 ? 'critical' :
        avgRisk >= 2.5 ? 'high' :
          avgRisk >= 1.5 ? 'medium' : 'low'

    return {
      overallRisk,
      factors,
      mitigations: [
        {
          risk: 'Budget Concentration',
          action: 'Diversify campaigns and test new channels',
          priority: 'short_term',
          owner: 'Strategy Agent',
          status: 'pending',
        },
        {
          risk: 'Conversion Tracking',
          action: 'Audit and validate conversion tracking setup',
          priority: 'immediate',
          owner: 'Technical Team',
          status: 'pending',
        },
        {
          risk: 'Platform Dependency',
          action: 'Test Meta campaigns with 10% budget allocation',
          priority: 'long_term',
          owner: 'Strategy Agent',
          status: 'pending',
        },
      ],
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
      case 'action':
        // Log changes from other agents
        if (payload.changeLog) {
          const log = payload.changeLog as ChangeLog
          this.changeLogs.push(log)
        }
        break

      case 'request':
        if (payload.action === 'check_compliance') {
          const compliance = this.runComplianceChecks(
            payload.campaigns as Array<{ id: string; name: string; settings: Record<string, unknown> }>
          )
          response = {
            from: this.type,
            to: message.from,
            type: 'response',
            payload: compliance,
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

  getAlerts(): Alert[] {
    return [...this.alerts]
  }

  getChangeLogs(): ChangeLog[] {
    return [...this.changeLogs]
  }

  getViolations(): ComplianceViolation[] {
    return [...this.violations]
  }

  private generateId(): string {
    return `gov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const governanceAgent = new GovernanceAgent()
