import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getCustomerIdFromCookie: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { getCustomerIdFromCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('Image Consent API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/account/image-consent', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue(null)

      const { GET } = await import('./route')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 404 when customer not found', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue('customer-123')
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null)

      const { GET } = await import('./route')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Customer not found')
    })

    it('returns consent preference when authenticated', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue('customer-123')
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        imageStorageConsent: 'ALLOWED',
        consentUpdatedAt: new Date('2024-01-15'),
      } as never)

      const { GET } = await import('./route')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.imageStorageConsent).toBe('ALLOWED')
      expect(data.isAllowed).toBe(true)
      expect(data.isDenied).toBe(false)
      expect(data.isNotSet).toBe(false)
    })

    it('returns NOT_SET consent correctly', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue('customer-123')
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        imageStorageConsent: 'NOT_SET',
        consentUpdatedAt: null,
      } as never)

      const { GET } = await import('./route')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.imageStorageConsent).toBe('NOT_SET')
      expect(data.isAllowed).toBe(false)
      expect(data.isDenied).toBe(false)
      expect(data.isNotSet).toBe(true)
    })
  })

  describe('PATCH /api/account/image-consent', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue(null)

      const { PATCH } = await import('./route')
      const request = new Request('http://localhost/api/account/image-consent', {
        method: 'PATCH',
        body: JSON.stringify({ imageStorageConsent: 'ALLOWED' }),
      })
      const response = await PATCH(request as never)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 400 for invalid consent value', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue('customer-123')

      const { PATCH } = await import('./route')
      const request = new Request('http://localhost/api/account/image-consent', {
        method: 'PATCH',
        body: JSON.stringify({ imageStorageConsent: 'INVALID' }),
      })
      const response = await PATCH(request as never)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid consent value')
    })

    it('updates consent to ALLOWED', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue('customer-123')
      vi.mocked(prisma.customer.update).mockResolvedValue({
        imageStorageConsent: 'ALLOWED',
        consentUpdatedAt: new Date(),
      } as never)

      const { PATCH } = await import('./route')
      const request = new Request('http://localhost/api/account/image-consent', {
        method: 'PATCH',
        body: JSON.stringify({ imageStorageConsent: 'ALLOWED' }),
      })
      const response = await PATCH(request as never)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imageStorageConsent).toBe('ALLOWED')
      expect(data.isAllowed).toBe(true)
    })

    it('updates consent to DENIED', async () => {
      vi.mocked(getCustomerIdFromCookie).mockResolvedValue('customer-123')
      vi.mocked(prisma.customer.update).mockResolvedValue({
        imageStorageConsent: 'DENIED',
        consentUpdatedAt: new Date(),
      } as never)

      const { PATCH } = await import('./route')
      const request = new Request('http://localhost/api/account/image-consent', {
        method: 'PATCH',
        body: JSON.stringify({ imageStorageConsent: 'DENIED' }),
      })
      const response = await PATCH(request as never)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imageStorageConsent).toBe('DENIED')
      expect(data.isDenied).toBe(true)
    })
  })
})
