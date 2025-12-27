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

  /**
   * Enable image preprocessing for consistent quality
   * Normalizes exposure, white balance, and contrast before AI analysis
   */
  IMAGE_PREPROCESSING: process.env.FEATURE_IMAGE_PREPROCESSING !== 'false', // Enabled by default

  /**
   * Enable smart auto-capture during photo taking
   * Automatically captures when quality thresholds are met and face is positioned
   */
  SMART_AUTO_CAPTURE: process.env.FEATURE_SMART_AUTO_CAPTURE !== 'false', // Enabled by default
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
    IMAGE_PREPROCESSING: FEATURES.IMAGE_PREPROCESSING,
    SMART_AUTO_CAPTURE: FEATURES.SMART_AUTO_CAPTURE,
  })
}
