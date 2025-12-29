import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import {
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  parseJsonBody,
} from './api-helpers'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getCurrentCustomer: vi.fn(),
}))

describe('API Helpers', () => {
  describe('unauthorizedResponse', () => {
    it('returns 401 with default message', () => {
      const response = unauthorizedResponse()
      expect(response.status).toBe(401)
    })

    it('returns 401 with custom message', () => {
      const response = unauthorizedResponse('Custom auth error')
      expect(response.status).toBe(401)
    })
  })

  describe('badRequestResponse', () => {
    it('returns 400 with error message', () => {
      const response = badRequestResponse('Invalid input')
      expect(response.status).toBe(400)
    })

    it('returns 400 with details when provided', () => {
      const response = badRequestResponse('Validation failed', { field: 'email' })
      expect(response.status).toBe(400)
    })
  })

  describe('notFoundResponse', () => {
    it('returns 404 with default message', () => {
      const response = notFoundResponse()
      expect(response.status).toBe(404)
    })

    it('returns 404 with custom resource name', () => {
      const response = notFoundResponse('User')
      expect(response.status).toBe(404)
    })
  })

  describe('serverErrorResponse', () => {
    it('returns 500 with default message', () => {
      const response = serverErrorResponse()
      expect(response.status).toBe(500)
    })

    it('returns 500 with custom message', () => {
      const response = serverErrorResponse('Database error')
      expect(response.status).toBe(500)
    })
  })

  describe('parseJsonBody', () => {
    it('parses valid JSON body', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
      } as unknown as Request

      const result = await parseJsonBody<{ email: string }>(mockRequest)

      expect(result.error).toBeNull()
      expect(result.body).toEqual({ email: 'test@example.com' })
    })

    it('returns error for invalid JSON', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Request

      const result = await parseJsonBody(mockRequest)

      expect(result.body).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error?.status).toBe(400)
    })
  })
})
