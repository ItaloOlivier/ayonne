/**
 * Feature Flags for Anthropic API Capabilities
 *
 * Control which advanced features are enabled via environment variables.
 * All features are backwards-compatible and can be toggled independently.
 */

export const FEATURES = {
  /**
   * Enable prompt caching to reduce token costs by ~90%
   * Caches static system prompts across requests
   */
  PROMPT_CACHING: process.env.FEATURE_PROMPT_CACHING !== 'false', // Enabled by default

  /**
   * Enable streaming for real-time analysis feedback
   * Shows progressive results as analysis proceeds
   */
  STREAMING: process.env.FEATURE_STREAMING === 'true',

  /**
   * Enable tool use for dynamic product lookup and recommendations
   * Allows Claude to query database during analysis
   */
  TOOL_USE: process.env.FEATURE_TOOL_USE === 'true',

  /**
   * Enable extended thinking for complex multi-condition analysis
   * Provides deeper reasoning for edge cases
   */
  EXTENDED_THINKING: process.env.FEATURE_EXTENDED_THINKING === 'true',
}

/**
 * Log current feature flag status (for debugging)
 */
export function logFeatureStatus(): void {
  console.log('[FEATURES] Current configuration:', {
    PROMPT_CACHING: FEATURES.PROMPT_CACHING,
    STREAMING: FEATURES.STREAMING,
    TOOL_USE: FEATURES.TOOL_USE,
    EXTENDED_THINKING: FEATURES.EXTENDED_THINKING,
  })
}
