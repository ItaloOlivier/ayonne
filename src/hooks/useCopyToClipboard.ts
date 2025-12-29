/**
 * Custom hook for copying text to clipboard with fallback
 *
 * Consolidates duplicate clipboard logic from 7+ growth components:
 * - DiscountBadge, DiscountTimer, GuestEmailCapture
 * - ReferralBanner, ReferralDashboard, SpinWheel, TransformationReveal
 */

import { useState, useCallback } from 'react'

interface UseCopyToClipboardResult {
  /** Whether the text was recently copied (resets after timeout) */
  copied: boolean
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>
  /** Reset copied state */
  reset: () => void
}

/**
 * Hook for clipboard operations with automatic fallback for older browsers
 *
 * @param resetTimeout - How long to show "copied" state (default: 2000ms)
 * @returns {copied, copy, reset}
 *
 * @example
 * const { copied, copy } = useCopyToClipboard()
 *
 * <button onClick={() => copy(discountCode)}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useCopyToClipboard(resetTimeout = 2000): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false)

  const reset = useCallback(() => {
    setCopied(false)
  }, [])

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) return false

    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)

        if (!successful) {
          throw new Error('execCommand failed')
        }
      }

      setCopied(true)

      if (resetTimeout > 0) {
        setTimeout(() => setCopied(false), resetTimeout)
      }

      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }, [resetTimeout])

  return { copied, copy, reset }
}

export default useCopyToClipboard
