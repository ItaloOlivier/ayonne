import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, RATE_LIMITS, getIpFromRequest } from './rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-key-1', { maxRequests: 3, windowMs: 60000 })
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('should block requests over limit', () => {
      const config = { maxRequests: 2, windowMs: 60000 }
      const key = 'test-key-2'

      // First two requests should succeed
      expect(checkRateLimit(key, config).success).toBe(true)
      expect(checkRateLimit(key, config).success).toBe(true)

      // Third request should fail
      const result = checkRateLimit(key, config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', () => {
      const config = { maxRequests: 1, windowMs: 60000 }
      const key = 'test-key-3'

      // First request succeeds
      expect(checkRateLimit(key, config).success).toBe(true)

      // Second request fails
      expect(checkRateLimit(key, config).success).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(61000)

      // Request should succeed again
      expect(checkRateLimit(key, config).success).toBe(true)
    })

    it('should track remaining correctly', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      const key = 'test-key-4'

      expect(checkRateLimit(key, config).remaining).toBe(4)
      expect(checkRateLimit(key, config).remaining).toBe(3)
      expect(checkRateLimit(key, config).remaining).toBe(2)
      expect(checkRateLimit(key, config).remaining).toBe(1)
      expect(checkRateLimit(key, config).remaining).toBe(0)
    })
  })

  describe('getIpFromRequest', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      })
      expect(getIpFromRequest(request)).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.2' }
      })
      expect(getIpFromRequest(request)).toBe('192.168.1.2')
    })

    it('should return unknown when no IP headers present', () => {
      const request = new Request('http://localhost')
      expect(getIpFromRequest(request)).toBe('unknown')
    })
  })

  describe('RATE_LIMITS presets', () => {
    it('should have correct validation limits', () => {
      expect(RATE_LIMITS.VALIDATE.maxRequests).toBe(10)
      expect(RATE_LIMITS.VALIDATE.windowMs).toBe(60000)
    })

    it('should have correct auth limits', () => {
      expect(RATE_LIMITS.AUTH.maxRequests).toBe(5)
      expect(RATE_LIMITS.AUTH.windowMs).toBe(900000) // 15 minutes
    })
  })
})
