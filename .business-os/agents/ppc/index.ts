/**
 * PPC Agent Suite
 *
 * Autonomous PPC Strategy, Execution & Optimization System
 *
 * This module exports all PPC agents and the orchestrator for
 * managing Google Ads campaigns.
 *
 * Usage:
 * ```typescript
 * import { ppcOrchestrator, PPCConfig } from './.business-os/agents/ppc'
 *
 * const config: PPCConfig = {
 *   business: { ... },
 *   infrastructure: { ... },
 *   funnel: { ... },
 *   maxCpa: 50,
 *   targetRoas: 3,
 *   phase: 'test',
 *   thresholds: { ... },
 *   automation: { ... },
 * }
 *
 * await ppcOrchestrator.initialize(config)
 * const status = ppcOrchestrator.getSystemStatus()
 * ```
 */

// Core Types
export * from './types'

// Agents
export {
  StrategyAgent,
  strategyAgent,
  type StrategyBrief,
  type ChannelAllocation,
  type BudgetPlan,
  type TestPriority,
  type RiskAssessment,
} from './strategy-agent'

export {
  KeywordAgent,
  keywordAgent,
  type KeywordResearch,
  type KeywordCluster,
  type ScoredKeyword,
  type KeywordOpportunity,
  type SearchTermAnalysis,
} from './keyword-agent'

export {
  CreativeAgent,
  creativeAgent,
  type AdCopySet,
  type HeadlineVariant,
  type DescriptionVariant,
  type ComplianceCheck,
  type AdTestMatrix,
  type MessagingFramework,
} from './creative-agent'

export {
  ExperimentationAgent,
  experimentationAgent,
  type ExperimentDesign,
  type ExperimentObservation,
  type StatisticalAnalysis,
  type RolloutRecommendation,
} from './experimentation-agent'

export {
  PerformanceAgent,
  performanceAgent,
  type PerformanceSummary,
  type PerformanceInsight,
  type WasteAnalysis,
  type TrendAnalysis,
  type FunnelAnalysis,
  type ChannelEfficiency,
} from './performance-agent'

export {
  OptimizationAgent,
  optimizationAgent,
  type OptimizationPlan,
  type OptimizationRule,
  type OptimizationLog,
  type ScalingDecision,
  type BidOptimization,
  type BudgetReallocation,
} from './optimization-agent'

export {
  GovernanceAgent,
  governanceAgent,
  type GovernanceReport,
  type AccountHealth,
  type ComplianceStatus,
  type ComplianceViolation,
  type SpendAnomaly,
  type RiskAssessment as GovernanceRiskAssessment,
} from './governance-agent'

// Orchestrator
export {
  PPCOrchestrator,
  ppcOrchestrator,
  type OrchestratorState,
  type PendingApproval,
  type OperationalLoopResult,
  type SystemStatus,
  type FirstRunChecklist,
} from './orchestrator'

// Google Ads Client
export {
  GoogleAdsClient,
  createGoogleAdsClient,
  type GoogleAdsConfig,
  type ApiResponse,
  type PaginatedResponse,
  type CampaignService,
  type KeywordService,
  type AdService,
  type ReportingService,
  type BudgetService,
  type BidStrategyService,
} from './google-ads-client'
