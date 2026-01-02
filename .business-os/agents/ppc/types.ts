/**
 * PPC Agent Suite - Core Types & Interfaces
 *
 * Shared types used across all PPC agents for consistent data exchange.
 */

// ============================================================================
// BUSINESS CONTEXT
// ============================================================================

export interface BusinessContext {
  /** What is being sold */
  productType: 'product' | 'service' | 'subscription'

  /** Price points and margins */
  pricing: {
    averageOrderValue: number
    grossMargin: number
    currency: string
  }

  /** Geographic focus */
  markets: string[]

  /** Sales cycle characteristics */
  salesCycle: {
    lengthDays: number
    touchpoints: number
    assisted: boolean
  }

  /** Primary conversion event */
  primaryConversion: ConversionEvent

  /** Secondary conversion events */
  secondaryConversions?: ConversionEvent[]

  /** Legal/compliance constraints */
  restrictions?: string[]
}

export interface ConversionEvent {
  name: string
  type: 'purchase' | 'lead' | 'signup' | 'download' | 'call' | 'custom'
  value?: number
  trackingId?: string
}

// ============================================================================
// FUNNEL STRUCTURE
// ============================================================================

export interface FunnelMap {
  stages: FunnelStage[]
  dropOffRates: Record<string, number>
  averageTimeToConvert: number
}

export interface FunnelStage {
  name: string
  type: 'awareness' | 'consideration' | 'decision' | 'retention'
  entryPoints: string[]
  exitPoints: string[]
  conversionRate?: number
}

// ============================================================================
// DATA INFRASTRUCTURE
// ============================================================================

export interface DataInfrastructure {
  googleAds: {
    connected: boolean
    accountId?: string
    conversionActions?: string[]
  }

  ga4: {
    connected: boolean
    propertyId?: string
    eventsConfigured?: string[]
  }

  tagManager?: {
    connected: boolean
    containerId?: string
  }

  crm?: {
    type: string
    connected: boolean
    attributionEnabled?: boolean
  }
}

// ============================================================================
// CAMPAIGN STRUCTURES
// ============================================================================

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  budget: Budget
  targeting: Targeting
  bidStrategy: BidStrategy
  createdAt: Date
  updatedAt: Date
}

export type CampaignType =
  | 'search'
  | 'display'
  | 'shopping'
  | 'pmax'
  | 'video'
  | 'app'
  | 'discovery'

export type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'ended'
  | 'removed'

export interface Budget {
  daily: number
  monthly?: number
  lifetime?: number
  currency: string
  pacing: 'standard' | 'accelerated'
}

export interface Targeting {
  keywords?: KeywordGroup[]
  audiences?: AudienceTarget[]
  locations: LocationTarget[]
  demographics?: DemographicTarget
  devices?: DeviceTarget
  schedule?: ScheduleTarget
}

export interface BidStrategy {
  type: BidStrategyType
  targetCpa?: number
  targetRoas?: number
  maxCpc?: number
  targetImpressionShare?: number
}

export type BidStrategyType =
  | 'manual_cpc'
  | 'maximize_clicks'
  | 'maximize_conversions'
  | 'target_cpa'
  | 'target_roas'
  | 'target_impression_share'

// ============================================================================
// KEYWORDS & INTENT
// ============================================================================

export interface KeywordGroup {
  id: string
  name: string
  keywords: Keyword[]
  intent: IntentType
  matchType: MatchType
}

export interface Keyword {
  text: string
  matchType: MatchType
  bid?: number
  status: 'active' | 'paused' | 'negative'
  qualityScore?: number
  metrics?: KeywordMetrics
}

export type MatchType = 'broad' | 'phrase' | 'exact'

export type IntentType =
  | 'transactional'    // Ready to buy
  | 'commercial'       // Researching to buy
  | 'informational'    // Learning
  | 'navigational'     // Looking for specific site

export interface KeywordMetrics {
  impressions: number
  clicks: number
  ctr: number
  averageCpc: number
  conversions: number
  conversionRate: number
  cost: number
}

export interface NegativeKeyword {
  text: string
  level: 'campaign' | 'adgroup' | 'account'
  reason?: string
}

// ============================================================================
// AUDIENCES
// ============================================================================

export interface AudienceTarget {
  id: string
  name: string
  type: AudienceType
  size?: number
  bid_modifier?: number
}

export type AudienceType =
  | 'remarketing'
  | 'similar'
  | 'in_market'
  | 'affinity'
  | 'custom_intent'
  | 'customer_match'
  | 'combined'

// ============================================================================
// LOCATIONS & DEMOGRAPHICS
// ============================================================================

export interface LocationTarget {
  id: string
  name: string
  type: 'country' | 'region' | 'city' | 'postal_code' | 'radius'
  bid_modifier?: number
}

export interface DemographicTarget {
  ageRanges?: string[]
  genders?: ('male' | 'female' | 'unknown')[]
  householdIncomes?: string[]
  parentalStatus?: string[]
}

export interface DeviceTarget {
  desktop: boolean
  mobile: boolean
  tablet: boolean
  bid_modifiers?: Record<string, number>
}

export interface ScheduleTarget {
  dayParting: DayPart[]
  timezone: string
}

export interface DayPart {
  dayOfWeek: number
  startHour: number
  endHour: number
  bid_modifier?: number
}

// ============================================================================
// CREATIVES & ADS
// ============================================================================

export interface AdGroup {
  id: string
  campaignId: string
  name: string
  status: 'active' | 'paused' | 'removed'
  ads: Ad[]
  keywords?: Keyword[]
  targeting?: Partial<Targeting>
}

export interface Ad {
  id: string
  type: AdType
  status: AdStatus
  content: AdContent
  metrics?: AdMetrics
}

export type AdType =
  | 'responsive_search'
  | 'expanded_text'
  | 'responsive_display'
  | 'image'
  | 'video'
  | 'shopping'

export type AdStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'disapproved'
  | 'paused'
  | 'removed'

export interface AdContent {
  headlines?: string[]
  descriptions?: string[]
  finalUrl: string
  displayUrl?: string
  path1?: string
  path2?: string
  images?: string[]
  videos?: string[]
  callToAction?: string
}

export interface AdMetrics {
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conversionRate: number
  cost: number
  averageCpc: number
  qualityScore?: number
}

// ============================================================================
// EXPERIMENTS
// ============================================================================

export interface Experiment {
  id: string
  name: string
  hypothesis: string
  type: ExperimentType
  status: ExperimentStatus
  control: ExperimentVariant
  treatment: ExperimentVariant
  trafficSplit: number
  startDate: Date
  endDate?: Date
  results?: ExperimentResults
}

export type ExperimentType =
  | 'ad_copy'
  | 'landing_page'
  | 'bid_strategy'
  | 'audience'
  | 'keyword'
  | 'budget'

export type ExperimentStatus =
  | 'draft'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'

export interface ExperimentVariant {
  id: string
  name: string
  description: string
  changes: Record<string, unknown>
}

export interface ExperimentResults {
  winner: 'control' | 'treatment' | 'inconclusive'
  confidence: number
  metrics: {
    control: Record<string, number>
    treatment: Record<string, number>
    lift: Record<string, number>
  }
  recommendation: string
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface PerformanceReport {
  dateRange: DateRange
  level: 'account' | 'campaign' | 'adgroup' | 'keyword' | 'ad'
  metrics: PerformanceMetrics
  breakdown?: Record<string, PerformanceMetrics>
}

export interface DateRange {
  start: Date
  end: Date
}

export interface PerformanceMetrics {
  impressions: number
  clicks: number
  ctr: number
  cost: number
  conversions: number
  conversionValue: number
  conversionRate: number
  cpa: number
  roas: number
  averageCpc: number
  averagePosition?: number
  impressionShare?: number
  qualityScore?: number
}

export interface AttributionReport {
  model: AttributionModel
  conversions: ConversionPath[]
  channelContribution: Record<string, number>
}

export type AttributionModel =
  | 'last_click'
  | 'first_click'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'data_driven'

export interface ConversionPath {
  touchpoints: Touchpoint[]
  conversionValue: number
  conversionTime: Date
}

export interface Touchpoint {
  channel: string
  campaign?: string
  timestamp: Date
  interaction: 'impression' | 'click'
}

// ============================================================================
// OPTIMIZATION
// ============================================================================

export interface OptimizationAction {
  id: string
  type: OptimizationType
  target: OptimizationTarget
  currentValue: unknown
  proposedValue: unknown
  expectedImpact: Impact
  confidence: number
  reasoning: string
  status: 'proposed' | 'approved' | 'applied' | 'rejected' | 'reverted'
  appliedAt?: Date
  results?: OptimizationResults
}

export type OptimizationType =
  | 'bid_adjustment'
  | 'budget_reallocation'
  | 'keyword_pause'
  | 'keyword_add'
  | 'negative_add'
  | 'ad_pause'
  | 'targeting_change'
  | 'schedule_change'

export interface OptimizationTarget {
  type: 'account' | 'campaign' | 'adgroup' | 'keyword' | 'ad'
  id: string
  name: string
}

export interface Impact {
  metric: string
  expectedChange: number
  direction: 'increase' | 'decrease'
}

export interface OptimizationResults {
  metric: string
  before: number
  after: number
  change: number
  period: DateRange
}

// ============================================================================
// ALERTS & GOVERNANCE
// ============================================================================

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  affectedEntity: {
    type: string
    id: string
    name: string
  }
  detectedAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  suggestedAction?: string
}

export type AlertType =
  | 'spend_anomaly'
  | 'performance_drop'
  | 'budget_depleted'
  | 'disapproved_ad'
  | 'policy_violation'
  | 'conversion_drop'
  | 'quality_score_drop'
  | 'competitor_activity'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface ChangeLog {
  id: string
  timestamp: Date
  agent: string
  action: string
  entity: {
    type: string
    id: string
    name: string
  }
  before: unknown
  after: unknown
  reason: string
  approved: boolean
  approvedBy?: string
}

// ============================================================================
// AGENT COMMUNICATION
// ============================================================================

export interface AgentMessage {
  from: AgentType
  to: AgentType | 'orchestrator'
  type: MessageType
  payload: unknown
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  correlationId?: string
}

export type AgentType =
  | 'strategy'
  | 'keyword'
  | 'creative'
  | 'experimentation'
  | 'performance'
  | 'optimization'
  | 'governance'
  | 'orchestrator'

export type MessageType =
  | 'request'
  | 'response'
  | 'alert'
  | 'recommendation'
  | 'action'
  | 'status'

// ============================================================================
// AGENT STATE
// ============================================================================

export interface AgentState {
  agent: AgentType
  status: 'idle' | 'processing' | 'waiting' | 'error'
  lastAction?: string
  lastActionTime?: Date
  pendingTasks: number
  errors: AgentError[]
}

export interface AgentError {
  code: string
  message: string
  timestamp: Date
  recoverable: boolean
  context?: Record<string, unknown>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface PPCConfig {
  business: BusinessContext
  infrastructure: DataInfrastructure
  funnel: FunnelMap

  /** Maximum acceptable CPA */
  maxCpa: number

  /** Target ROAS */
  targetRoas: number

  /** Current phase */
  phase: 'test' | 'scale' | 'optimize'

  /** Kill thresholds */
  thresholds: {
    minConversions: number
    maxCpaMultiplier: number
    minImpressionShare: number
    minQualityScore: number
  }

  /** Automation settings */
  automation: {
    autoApplyOptimizations: boolean
    requireApprovalAbove: number
    alertThresholds: Record<string, number>
  }
}
