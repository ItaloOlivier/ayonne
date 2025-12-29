import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  formatZodErrors,
  validate,
  validateSafe,
} from './index'
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  signupSchema,
  paginationSchema,
  discountCodeSchema,
  referralCodeSchema,
} from './schemas'

describe('Validation Utilities', () => {
  describe('formatZodErrors', () => {
    it('formats single field error', () => {
      const schema = z.object({ email: z.string().email() })
      const result = schema.safeParse({ email: 'invalid' })

      if (!result.success) {
        const errors = formatZodErrors(result.error)
        expect(errors).toHaveLength(1)
        expect(errors[0].field).toBe('email')
        expect(errors[0].message).toBeDefined()
      }
    })

    it('formats nested field errors', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      })
      const result = schema.safeParse({ user: { email: 'invalid' } })

      if (!result.success) {
        const errors = formatZodErrors(result.error)
        expect(errors).toHaveLength(1)
        expect(errors[0].field).toBe('user.email')
      }
    })

    it('formats root-level error as "body"', () => {
      const schema = z.string().min(1)
      const result = schema.safeParse('')

      if (!result.success) {
        const errors = formatZodErrors(result.error)
        expect(errors[0].field).toBe('body')
      }
    })
  })

  describe('validate', () => {
    it('returns parsed data on success', () => {
      const schema = z.object({ name: z.string() })
      const result = validate(schema, { name: 'Test' })
      expect(result).toEqual({ name: 'Test' })
    })

    it('throws on invalid data', () => {
      const schema = z.object({ name: z.string() })
      expect(() => validate(schema, { name: 123 })).toThrow()
    })
  })

  describe('validateSafe', () => {
    it('returns success: true with data on valid input', () => {
      const schema = z.object({ name: z.string() })
      const result = validateSafe(schema, { name: 'Test' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ name: 'Test' })
      }
    })

    it('returns success: false with errors on invalid input', () => {
      const schema = z.object({ name: z.string() })
      const result = validateSafe(schema, { name: 123 })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })
  })
})

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('validates and normalizes valid email', () => {
      // Note: zod validates format before transform, so we test with already valid format
      const result = emailSchema.parse('TEST@EXAMPLE.COM')
      expect(result).toBe('test@example.com')
    })

    it('rejects invalid email', () => {
      expect(() => emailSchema.parse('not-an-email')).toThrow()
    })
  })

  describe('passwordSchema', () => {
    it('accepts valid password', () => {
      const result = passwordSchema.parse('securepass123')
      expect(result).toBe('securepass123')
    })

    it('rejects too short password', () => {
      expect(() => passwordSchema.parse('12345')).toThrow()
    })

    it('rejects too long password', () => {
      expect(() => passwordSchema.parse('a'.repeat(101))).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('validates complete login data', () => {
      const result = loginSchema.parse({
        email: 'user@example.com',
        password: 'mypassword',
      })
      expect(result.email).toBe('user@example.com')
      expect(result.password).toBe('mypassword')
    })

    it('rejects empty password', () => {
      expect(() =>
        loginSchema.parse({
          email: 'user@example.com',
          password: '',
        })
      ).toThrow()
    })
  })

  describe('signupSchema', () => {
    it('validates complete signup data', () => {
      const result = signupSchema.parse({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      })
      expect(result.firstName).toBe('John')
      expect(result.lastName).toBe('Doe')
    })

    it('allows optional lastName', () => {
      const result = signupSchema.parse({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
      })
      expect(result.lastName).toBeUndefined()
    })

    it('trims firstName and lastName', () => {
      const result = signupSchema.parse({
        email: 'new@example.com',
        password: 'password123',
        firstName: '  John  ',
        lastName: '  Doe  ',
      })
      expect(result.firstName).toBe('John')
      expect(result.lastName).toBe('Doe')
    })
  })

  describe('paginationSchema', () => {
    it('provides defaults when empty', () => {
      const result = paginationSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('coerces string values to numbers', () => {
      const result = paginationSchema.parse({ page: '2', limit: '50' })
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
    })

    it('rejects limit above max', () => {
      expect(() => paginationSchema.parse({ limit: 200 })).toThrow()
    })

    it('rejects non-positive page', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow()
      expect(() => paginationSchema.parse({ page: -1 })).toThrow()
    })
  })

  describe('discountCodeSchema', () => {
    it('accepts valid discount code', () => {
      const result = discountCodeSchema.parse('SAVE20')
      expect(result).toBe('SAVE20')
    })

    it('rejects lowercase codes', () => {
      expect(() => discountCodeSchema.parse('save20')).toThrow()
    })

    it('rejects too short codes', () => {
      expect(() => discountCodeSchema.parse('AB')).toThrow()
    })

    it('rejects codes with special characters', () => {
      expect(() => discountCodeSchema.parse('SAVE-20')).toThrow()
    })
  })

  describe('referralCodeSchema', () => {
    it('accepts valid 8-character referral code', () => {
      const result = referralCodeSchema.parse('ABC12345')
      expect(result).toBe('ABC12345')
    })

    it('rejects wrong length', () => {
      expect(() => referralCodeSchema.parse('ABC123')).toThrow()
      expect(() => referralCodeSchema.parse('ABC1234567')).toThrow()
    })

    it('rejects lowercase', () => {
      expect(() => referralCodeSchema.parse('abc12345')).toThrow()
    })
  })
})
