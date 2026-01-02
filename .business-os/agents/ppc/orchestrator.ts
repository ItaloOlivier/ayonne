/**
 * PPC Orchestrator Agent
 *
 * Coordinates all PPC agents and manages the operational loop.
 *
 * Responsibilities:
 * - Agent lifecycle management
 * - Message routing between agents
 * - Operational loop execution
 * - Human-in-the-loop decisions
 * - Consolidated reporting
 */

import {
  AgentType,
  AgentState,
  AgentMessage,
  MessageType,
  PPCConfig,
  BusinessContext,
  DataInfrastructure,
  FunnelMap,
  PerformanceMetrics,
} from './types'

import { StrategyAgent, strategyAgent, StrategyBrief } from './strategy-agent'
import { KeywordAgent, keywordAgent, KeywordResearch } from './keyword-agent'
import { CreativeAgent, creativeAgent, AdCopySet } from './creative-agent'
import { ExperimentationAgent, experimentationAgent, ExperimentDesign } from './experimentation-agent'
import { PerformanceAgent, performanceAgent, PerformanceSummary } from './performance-agent'
import { OptimizationAgent, optimizationAgent, OptimizationPlan } from './optimization-agent'
import { GovernanceAgent, governanceAgent, GovernanceReport } from './governance-agent'

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface OrchestratorState {
  initialized: boolean
  phase: 'setup' | 'learning' | 'optimizing' | 'scaling' | 'maintenance'
  lastLoopRun: Date | null
  loopCount: number
  pendingApprovals: PendingApproval[]
  agentStates: Record<AgentType, AgentState>
}

export interface PendingApproval {
  id: string
  type: 'optimization' | 'budget' | 'creative' | 'experiment'
  source: AgentType
  description: string
  proposal: unknown
  impact: string
  createdAt: Date
  expiresAt: Date
  status: 'pending' | 'approved' | 'rejected' | 'expired'
}

export interface OperationalLoopResult {
  loopId: string
  startTime: Date
  endTime: Date
  duration: number
  actions: LoopAction[]
  alerts: string[]
  nextLoopScheduled: Date
}

export interface LoopAction {
  agent: AgentType
  action: string
  success: boolean
  output?: unknown
  error?: string
}

export interface SystemStatus {
  health: 'healthy' | 'degraded' | 'critical'
  agents: AgentType[]
  activeExperiments: number
  pendingOptimizations: number
  openAlerts: number
  lastPerformanceUpdate: Date | null
}

export interface FirstRunChecklist {
  conversionTracking: { verified: boolean; details?: string }
  budgetCaps: { verified: boolean; daily?: number; monthly?: number }
  primaryKpi: { agreed: boolean; metric?: string; target?: number }
  phase: { identified: boolean; current?: 'test' | 'scale' | 'optimize' }
  killThresholds: { set: boolean; maxCpaMultiplier?: number; minRoas?: number }
}

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class PPCOrchestrator {
  private state: OrchestratorState
  private config: PPCConfig | null = null
  private messageQueue: AgentMessage[] = []
  private loopInterval: NodeJS.Timeout | null = null

  // Agent references
  private agents: {
    strategy: StrategyAgent
    keyword: KeywordAgent
    creative: CreativeAgent
    experimentation: ExperimentationAgent
    performance: PerformanceAgent
    optimization: OptimizationAgent
    governance: GovernanceAgent
  }

  constructor() {
    this.state = {
      initialized: false,
      phase: 'setup',
      lastLoopRun: null,
      loopCount: 0,
      pendingApprovals: [],
      agentStates: {} as Record<AgentType, AgentState>,
    }

    this.agents = {
      strategy: strategyAgent,
      keyword: keywordAgent,
      creative: creativeAgent,
      experimentation: experimentationAgent,
      performance: performanceAgent,
      optimization: optimizationAgent,
      governance: governanceAgent,
    }
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  /**
   * Initialize the orchestrator and all agents
   */
  async initialize(config: PPCConfig): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = []

    // Validate configuration
    const validationIssues = this.validateConfig(config)
    if (validationIssues.length > 0) {
      issues.push(...validationIssues)
    }

    this.config = config

    // Initialize all agents
    try {
      await Promise.all([
        this.agents.strategy.initialize(config),
        this.agents.keyword.initialize(config),
        this.agents.creative.initialize(config),
        this.agents.experimentation.initialize(config),
        this.agents.performance.initialize(config),
        this.agents.optimization.initialize(config),
        this.agents.governance.initialize(config),
      ])
    } catch (error) {
      issues.push(`Agent initialization failed: ${error}`)
    }

    // Update state
    this.state.initialized = issues.length === 0
    this.state.phase = config.phase === 'test' ? 'learning' : config.phase === 'scale' ? 'scaling' : 'optimizing'
    this.updateAgentStates()

    return { success: this.state.initialized, issues }
  }

  /**
   * Validate configuration completeness
   */
  private validateConfig(config: PPCConfig): string[] {
    const issues: string[] = []

    if (!config.business) {
      issues.push('Business context is required')
    }
    if (!config.infrastructure?.googleAds?.connected) {
      issues.push('Google Ads connection is required')
    }
    if (!config.maxCpa || config.maxCpa <= 0) {
      issues.push('Valid max CPA must be defined')
    }
    if (!config.targetRoas || config.targetRoas <= 0) {
      issues.push('Valid target ROAS must be defined')
    }

    return issues
  }

  /**
   * Run the first-run checklist
   */
  runFirstRunChecklist(): FirstRunChecklist {
    if (!this.config) {
      throw new Error('Orchestrator not initialized')
    }

    return {
      conversionTracking: {
        verified: !!this.config.infrastructure?.googleAds?.conversionActions?.length,
        details: this.config.infrastructure?.googleAds?.conversionActions?.join(', '),
      },
      budgetCaps: {
        verified: true, // Would check actual budget caps
        daily: 100, // Would come from account
        monthly: 3000,
      },
      primaryKpi: {
        agreed: !!this.config.business?.primaryConversion,
        metric: this.config.business?.primaryConversion?.type,
        target: this.config.maxCpa,
      },
      phase: {
        identified: !!this.config.phase,
        current: this.config.phase,
      },
      killThresholds: {
        set: !!this.config.thresholds,
        maxCpaMultiplier: this.config.thresholds?.maxCpaMultiplier,
        minRoas: 1 / (this.config.thresholds?.maxCpaMultiplier || 2),
      },
    }
  }

  // --------------------------------------------------------------------------
  // OPERATIONAL LOOP
  // --------------------------------------------------------------------------

  /**
   * Run a single iteration of the operational loop
   */
  async runOperationalLoop(): Promise<OperationalLoopResult> {
    if (!this.state.initialized || !this.config) {
      throw new Error('Orchestrator must be initialized before running loop')
    }

    const loopId = this.generateId()
    const startTime = new Date()
    const actions: LoopAction[] = []
    const alerts: string[] = []

    try {
      // Step 1: Observe current performance
      const performanceAction = await this.observePerformance()
      actions.push(performanceAction)

      // Step 2: Check for anomalies and alerts
      const governanceAction = await this.checkGovernance()
      actions.push(governanceAction)
      if (governanceAction.output) {
        const report = governanceAction.output as GovernanceReport
        alerts.push(...report.alerts.map(a => a.title))
      }

      // Step 3: Generate optimization recommendations
      const optimizationAction = await this.generateOptimizations()
      actions.push(optimizationAction)

      // Step 4: Execute approved actions
      const executionAction = await this.executeApprovedActions()
      actions.push(executionAction)

      // Step 5: Update experiments
      const experimentAction = await this.updateExperiments()
      actions.push(experimentAction)

    } catch (error) {
      actions.push({
        agent: 'orchestrator',
        action: 'loop_error',
        success: false,
        error: String(error),
      })
    }

    const endTime = new Date()

    // Update state
    this.state.lastLoopRun = endTime
    this.state.loopCount++
    this.updateAgentStates()

    return {
      loopId,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      actions,
      alerts,
      nextLoopScheduled: new Date(endTime.getTime() + 60 * 60 * 1000), // 1 hour
    }
  }

  /**
   * Observe current performance
   */
  private async observePerformance(): Promise<LoopAction> {
    try {
      // In a real implementation, this would fetch data from Google Ads API
      const mockMetrics: PerformanceMetrics = {
        impressions: 10000,
        clicks: 200,
        ctr: 0.02,
        cost: 500,
        conversions: 10,
        conversionValue: 1500,
        conversionRate: 0.05,
        cpa: 50,
        roas: 3,
        averageCpc: 2.5,
      }

      const summary = await this.agents.performance.generatePerformanceSummary(
        { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() },
        { overall: mockMetrics }
      )

      return {
        agent: 'performance',
        action: 'observe_performance',
        success: true,
        output: summary,
      }
    } catch (error) {
      return {
        agent: 'performance',
        action: 'observe_performance',
        success: false,
        error: String(error),
      }
    }
  }

  /**
   * Check governance and alerts
   */
  private async checkGovernance(): Promise<LoopAction> {
    try {
      const mockMetrics: PerformanceMetrics = {
        impressions: 10000,
        clicks: 200,
        ctr: 0.02,
        cost: 500,
        conversions: 10,
        conversionValue: 1500,
        conversionRate: 0.05,
        cpa: 50,
        roas: 3,
        averageCpc: 2.5,
      }

      const report = await this.agents.governance.generateGovernanceReport(
        mockMetrics,
        [], // Would pass actual campaigns
        [7, 8, 6], // Mock quality scores
        1, // Mock disapprovals
        10, // Mock total ads
      )

      return {
        agent: 'governance',
        action: 'check_governance',
        success: true,
        output: report,
      }
    } catch (error) {
      return {
        agent: 'governance',
        action: 'check_governance',
        success: false,
        error: String(error),
      }
    }
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizations(): Promise<LoopAction> {
    try {
      const plan = await this.agents.optimization.generateOptimizationPlan({
        campaigns: [], // Would come from API
        keywords: [],
        ads: [],
      })

      // Queue actions requiring approval
      for (const action of plan.actions) {
        if (plan.requiresApproval) {
          this.queueForApproval({
            id: this.generateId(),
            type: 'optimization',
            source: 'optimization',
            description: action.reasoning,
            proposal: action,
            impact: `${action.expectedImpact.direction} ${action.expectedImpact.metric} by ${action.expectedImpact.expectedChange}%`,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'pending',
          })
        }
      }

      return {
        agent: 'optimization',
        action: 'generate_optimizations',
        success: true,
        output: plan,
      }
    } catch (error) {
      return {
        agent: 'optimization',
        action: 'generate_optimizations',
        success: false,
        error: String(error),
      }
    }
  }

  /**
   * Execute approved actions
   */
  private async executeApprovedActions(): Promise<LoopAction> {
    const approvedActions = this.state.pendingApprovals.filter(a => a.status === 'approved')
    let executed = 0

    for (const approval of approvedActions) {
      try {
        if (approval.type === 'optimization') {
          await this.agents.optimization.applyAction(approval.proposal as any)
          executed++
        }
        // Remove from queue
        this.state.pendingApprovals = this.state.pendingApprovals.filter(a => a.id !== approval.id)
      } catch (error) {
        console.error(`Failed to execute action ${approval.id}:`, error)
      }
    }

    return {
      agent: 'orchestrator',
      action: 'execute_approved',
      success: true,
      output: { executed, total: approvedActions.length },
    }
  }

  /**
   * Update experiment status
   */
  private async updateExperiments(): Promise<LoopAction> {
    const activeExperiments = this.agents.experimentation.getActiveExperiments()

    return {
      agent: 'experimentation',
      action: 'update_experiments',
      success: true,
      output: { activeCount: activeExperiments.length },
    }
  }

  /**
   * Start automatic operational loop
   */
  startLoop(intervalMs: number = 60 * 60 * 1000): void {
    if (this.loopInterval) {
      this.stopLoop()
    }

    // Run immediately
    this.runOperationalLoop()

    // Then run on interval
    this.loopInterval = setInterval(() => {
      this.runOperationalLoop()
    }, intervalMs)
  }

  /**
   * Stop automatic operational loop
   */
  stopLoop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval)
      this.loopInterval = null
    }
  }

  // --------------------------------------------------------------------------
  // APPROVAL MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Queue an action for approval
   */
  private queueForApproval(approval: PendingApproval): void {
    this.state.pendingApprovals.push(approval)
  }

  /**
   * Approve a pending action
   */
  approveAction(approvalId: string): boolean {
    const approval = this.state.pendingApprovals.find(a => a.id === approvalId)
    if (approval && approval.status === 'pending') {
      approval.status = 'approved'
      return true
    }
    return false
  }

  /**
   * Reject a pending action
   */
  rejectAction(approvalId: string, reason: string): boolean {
    const approval = this.state.pendingApprovals.find(a => a.id === approvalId)
    if (approval && approval.status === 'pending') {
      approval.status = 'rejected'
      return true
    }
    return false
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): PendingApproval[] {
    return this.state.pendingApprovals.filter(a => a.status === 'pending')
  }

  // --------------------------------------------------------------------------
  // MESSAGE ROUTING
  // --------------------------------------------------------------------------

  /**
   * Route a message between agents
   */
  async routeMessage(message: AgentMessage): Promise<AgentMessage | null> {
    const targetAgent = this.agents[message.to as keyof typeof this.agents]

    if (!targetAgent) {
      console.error(`Unknown agent: ${message.to}`)
      return null
    }

    // Log message
    this.messageQueue.push(message)

    // Route to agent
    return await targetAgent.handleMessage(message)
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(message: Omit<AgentMessage, 'to'>): Promise<void> {
    for (const agentType of Object.keys(this.agents) as AgentType[]) {
      await this.routeMessage({ ...message, to: agentType })
    }
  }

  // --------------------------------------------------------------------------
  // CONSOLIDATED ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Generate a comprehensive strategy brief
   */
  async generateStrategyBrief(): Promise<StrategyBrief> {
    return await this.agents.strategy.createStrategyBrief()
  }

  /**
   * Perform keyword research
   */
  async performKeywordResearch(seeds: string[]): Promise<KeywordResearch> {
    return await this.agents.keyword.performKeywordResearch(seeds)
  }

  /**
   * Generate ad copy
   */
  async generateAdCopy(campaign: string, adGroup: string, keywords: string[]): Promise<AdCopySet> {
    return await this.agents.creative.generateAdCopySet(campaign, adGroup, keywords)
  }

  /**
   * Design an experiment
   */
  async designExperiment(
    name: string,
    hypothesis: string,
    type: 'ad_copy' | 'bid_strategy' | 'audience' | 'landing_page' | 'budget' | 'keyword',
    controlConfig: Record<string, unknown>,
    treatmentConfig: Record<string, unknown>
  ): Promise<ExperimentDesign> {
    return await this.agents.experimentation.designExperiment(
      name, hypothesis, type, controlConfig, treatmentConfig
    )
  }

  // --------------------------------------------------------------------------
  // STATUS & REPORTING
  // --------------------------------------------------------------------------

  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus {
    this.updateAgentStates()

    const healthyAgents = Object.values(this.state.agentStates).filter(s => s.status !== 'error')
    const health = healthyAgents.length === 7 ? 'healthy' :
      healthyAgents.length >= 5 ? 'degraded' : 'critical'

    return {
      health,
      agents: Object.keys(this.agents) as AgentType[],
      activeExperiments: this.agents.experimentation.getActiveExperiments().length,
      pendingOptimizations: this.getPendingApprovals().length,
      openAlerts: this.agents.governance.getActiveAlerts().length,
      lastPerformanceUpdate: this.state.lastLoopRun,
    }
  }

  /**
   * Get orchestrator state
   */
  getState(): OrchestratorState {
    return { ...this.state }
  }

  /**
   * Update cached agent states
   */
  private updateAgentStates(): void {
    this.state.agentStates = {
      strategy: this.agents.strategy.getState(),
      keyword: this.agents.keyword.getState(),
      creative: this.agents.creative.getState(),
      experimentation: this.agents.experimentation.getState(),
      performance: this.agents.performance.getState(),
      optimization: this.agents.optimization.getState(),
      governance: this.agents.governance.getState(),
      orchestrator: {
        agent: 'orchestrator',
        status: 'idle',
        pendingTasks: this.state.pendingApprovals.length,
        errors: [],
      },
    }
  }

  private generateId(): string {
    return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const ppcOrchestrator = new PPCOrchestrator()

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export {
  strategyAgent,
  keywordAgent,
  creativeAgent,
  experimentationAgent,
  performanceAgent,
  optimizationAgent,
  governanceAgent,
}
