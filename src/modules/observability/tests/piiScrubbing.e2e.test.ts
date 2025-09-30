/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, expect, it } from 'vitest'

import {
  scrubPII,
  scrubSentryEvent,
} from '~/modules/observability/infrastructure/piiScrubbing'

describe('PII Scrubbing E2E Tests', () => {
  describe('Email Scrubbing', () => {
    it('should scrub email addresses from strings', () => {
      const input = 'Contact us at test@example.com for support'
      const result = scrubPII(input)

      expect(result).toBe('Contact us at [REDACTED] for support')
      expect(result).not.toContain('test@example.com')
    })

    it('should scrub multiple email addresses', () => {
      const input = 'Email john@test.com or jane@test.org'
      const result = scrubPII(input)

      expect(result).toBe('Email [REDACTED] or [REDACTED]')
      expect(result).not.toContain('john@test.com')
      expect(result).not.toContain('jane@test.org')
    })

    it('should scrub emails in nested objects', () => {
      const input = {
        user: {
          contact: 'user@example.com',
          message: 'My email is test@test.com',
        },
      }
      const result = scrubPII(input) as Record<string, unknown>
      const user = result.user as Record<string, unknown>

      expect(user.contact).toBe('[REDACTED]')
      expect(user.message).toBe('My email is [REDACTED]')
    })

    it('should allow disabling email scrubbing', () => {
      const input = 'Email: test@example.com'
      const result = scrubPII(input, { scrubEmails: false })

      expect(result).toBe('Email: test@example.com')
    })
  })

  describe('Phone Number Scrubbing', () => {
    it('should scrub phone numbers from strings', () => {
      const input = 'Call us at 555-123-4567'
      const result = scrubPII(input)

      expect(result).toBe('Call us at [REDACTED]')
      expect(result).not.toContain('555-123-4567')
    })

    it('should scrub various phone formats', () => {
      const formats = [
        '(555) 123-4567',
        '555.123.4567',
        '5551234567',
        '+1 555 123 4567',
      ]

      formats.forEach((phone) => {
        const result = scrubPII(`Phone: ${phone}`)
        expect(result).not.toContain(phone)
        expect(result).toContain('[REDACTED]')
      })
    })

    it('should allow disabling phone scrubbing', () => {
      const input = 'Phone: 555-123-4567'
      const result = scrubPII(input, { scrubPhones: false })

      expect(result).toBe('Phone: 555-123-4567')
    })
  })

  describe('Credit Card Scrubbing', () => {
    it('should scrub credit card numbers without separators', () => {
      const input = 'Card: 4532123456789012'
      const result = scrubPII(input)

      expect(result).toBe('Card: [REDACTED]')
      expect(result).not.toContain('4532123456789012')
    })

    it('should scrub credit cards with dashes', () => {
      const input = 'Card: 4532-1234-5678-9012'
      const result = scrubPII(input) as string

      expect(result).toContain('[REDACTED]')
      expect(result).not.toContain('4532-1234-5678-9012')
    })

    it('should scrub credit cards with spaces', () => {
      const input = 'Card: 4532 1234 5678 9012'
      const result = scrubPII(input) as string

      expect(result).toContain('[REDACTED]')
      expect(result).not.toContain('4532 1234 5678 9012')
    })

    it('should allow disabling credit card scrubbing', () => {
      const input = 'Card: 4532123456789012'
      const result = scrubPII(input, { scrubCreditCards: false })

      expect(result).toBe('Card: 4532123456789012')
    })
  })

  describe('Password Scrubbing', () => {
    it('should scrub password fields in objects', () => {
      const input = {
        username: 'john',
        password: 'secret123',
      }
      const result = scrubPII(input) as Record<string, unknown>

      expect(result.username).toBe('john')
      expect(result.password).toBe('[REDACTED]')
    })

    it('should scrub various password field names', () => {
      const input = {
        password: 'pass1',
        passwd: 'pass2',
        pwd: 'pass3',
        secret: 'pass4',
        token: 'pass5',
        apikey: 'pass6',
        api_key: 'pass7',
        authorization: 'pass8',
      }
      const result = scrubPII(input) as Record<string, unknown>

      expect(result.password).toBe('[REDACTED]')
      expect(result.passwd).toBe('[REDACTED]')
      expect(result.pwd).toBe('[REDACTED]')
      expect(result.secret).toBe('[REDACTED]')
      expect(result.token).toBe('[REDACTED]')
      expect(result.apikey).toBe('[REDACTED]')
      expect(result.api_key).toBe('[REDACTED]')
      expect(result.authorization).toBe('[REDACTED]')
    })

    it('should scrub password fields case-insensitively', () => {
      const input = {
        PASSWORD: 'secret',
        Password: 'secret',
        passWORD: 'secret',
      }
      const result = scrubPII(input) as Record<string, unknown>

      expect(result.PASSWORD).toBe('[REDACTED]')
      expect(result.Password).toBe('[REDACTED]')
      expect(result.passWORD).toBe('[REDACTED]')
    })

    it('should allow disabling password scrubbing', () => {
      const input = { password: 'secret123' }
      const result = scrubPII(input, { scrubPasswords: false }) as Record<
        string,
        unknown
      >

      expect(result.password).toBe('secret123')
    })
  })

  describe('Array Scrubbing', () => {
    it('should scrub PII in arrays', () => {
      const input = [
        'Email: test@example.com',
        'Phone: 555-123-4567',
        { password: 'secret' },
      ]
      const result = scrubPII(input) as unknown[]

      expect(result[0]).toBe('Email: [REDACTED]')
      expect(result[1]).toBe('Phone: [REDACTED]')
      expect((result[2] as Record<string, unknown>).password).toBe('[REDACTED]')
    })

    it('should scrub nested arrays', () => {
      const input = [
        ['test@example.com', 'user@test.com'],
        [{ password: 'secret' }],
      ]
      const result = scrubPII(input) as unknown[]

      expect((result[0] as unknown[])[0]).toBe('[REDACTED]')
      expect((result[0] as unknown[])[1]).toBe('[REDACTED]')
      expect(
        ((result[1] as unknown[])[0] as Record<string, unknown>).password,
      ).toBe('[REDACTED]')
    })
  })

  describe('Complex Object Scrubbing', () => {
    it('should scrub deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              email: 'deep@example.com',
              password: 'secret',
            },
          },
        },
      }
      type Level3 = { email: string; password: string }
      type Level2 = { level3: Level3 }
      type Level1 = { level2: Level2 }
      type Result = { level1: Level1 }
      const result = scrubPII(input) as Result

      expect(result.level1.level2.level3.email).toBe('[REDACTED]')
      expect(result.level1.level2.level3.password).toBe('[REDACTED]')
    })

    it('should handle mixed data types', () => {
      const input = {
        string: 'Contact: test@example.com',
        number: 12345,
        boolean: true,
        null: null,
        undefined,
        array: ['email@test.com', 42],
        object: { password: 'secret' },
      }
      const result = scrubPII(input) as Record<string, unknown>

      expect(result.string).toBe('Contact: [REDACTED]')
      expect(result.number).toBe(12345)
      expect(result.boolean).toBe(true)
      expect(result.null).toBe(null)
      expect(result.undefined).toBe(undefined)
      expect((result.array as unknown[])[0]).toBe('[REDACTED]')
      expect((result.array as unknown[])[1]).toBe(42)
      expect((result.object as Record<string, unknown>).password).toBe(
        '[REDACTED]',
      )
    })
  })

  describe('Custom Replacement', () => {
    it('should use custom replacement string', () => {
      const input = 'Email: test@example.com'
      const result = scrubPII(input, { replacement: '***' })

      expect(result).toBe('Email: ***')
    })

    it('should use custom replacement in objects', () => {
      const input = { password: 'secret' }
      const result = scrubPII(input, { replacement: 'HIDDEN' }) as Record<
        string,
        unknown
      >

      expect(result.password).toBe('HIDDEN')
    })
  })

  describe('Sentry Event Scrubbing', () => {
    it('should scrub PII from Sentry request data', () => {
      const event = {
        request: {
          data: {
            email: 'user@example.com',
            password: 'secret123',
          },
        },
      }
      const result = scrubSentryEvent(event) as Record<string, unknown>
      const request = result.request as Record<string, unknown>

      expect(result.request).toBeDefined()
      expect((request.data as Record<string, unknown>).email).toBe(
        '[REDACTED]',
      )
      expect((request.data as Record<string, unknown>).password).toBe(
        '[REDACTED]',
      )
    })

    it('should scrub PII from Sentry headers', () => {
      const event = {
        request: {
          headers: {
            authorization: 'Bearer secret-token',
            apikey: 'my-api-key',
          },
        },
      }
      const result = scrubSentryEvent(event) as Record<string, unknown>
      const request = result.request as Record<string, unknown>

      expect(result.request).toBeDefined()
      expect((request.headers as Record<string, unknown>).authorization).toBe(
        '[REDACTED]',
      )
      expect((request.headers as Record<string, unknown>).apikey).toBe(
        '[REDACTED]',
      )
    })

    it('should scrub PII from extra context', () => {
      const event = {
        extra: {
          userEmail: 'test@example.com',
          userPhone: '555-123-4567',
        },
      }
      const result = scrubSentryEvent(event) as Record<string, unknown>

      expect(result.extra).toBeDefined()
      expect((result.extra as Record<string, unknown>).userEmail).toBe(
        '[REDACTED]',
      )
      expect((result.extra as Record<string, unknown>).userPhone).toBe(
        '[REDACTED]',
      )
    })

    it('should scrub PII from breadcrumbs', () => {
      const event = {
        breadcrumbs: [
          {
            message: 'User logged in: user@example.com',
            data: { email: 'user@example.com' },
          },
        ],
      }
      const result = scrubSentryEvent(event) as Record<string, unknown>
      const breadcrumbs = result.breadcrumbs as Array<{
        message?: unknown
        data?: unknown
      }>

      expect(result.breadcrumbs).toBeDefined()
      expect(breadcrumbs[0]?.message).toBe('User logged in: [REDACTED]')
      expect((breadcrumbs[0]?.data as Record<string, unknown>).email).toBe(
        '[REDACTED]',
      )
    })

    it('should handle empty Sentry events', () => {
      const event = {}
      const result = scrubSentryEvent(event)

      expect(result).toEqual({})
    })

    it('should scrub PII from contexts', () => {
      const event = {
        contexts: {
          user: {
            email: 'user@example.com',
          },
        },
      }
      const result = scrubSentryEvent(event) as Record<string, unknown>

      expect(result.contexts).toBeDefined()
      const contexts = result.contexts as Record<string, unknown>
      const user = contexts.user as Record<string, unknown>
      expect(user.email).toBe('[REDACTED]')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null input', () => {
      const result = scrubPII(null)
      expect(result).toBe(null)
    })

    it('should handle undefined input', () => {
      const result = scrubPII(undefined)
      expect(result).toBe(undefined)
    })

    it('should handle number input', () => {
      const result = scrubPII(12345)
      expect(result).toBe(12345)
    })

    it('should handle boolean input', () => {
      const result = scrubPII(true)
      expect(result).toBe(true)
    })

    it('should handle empty string', () => {
      const result = scrubPII('')
      expect(result).toBe('')
    })

    it('should handle empty object', () => {
      const result = scrubPII({})
      expect(result).toEqual({})
    })

    it('should handle empty array', () => {
      const result = scrubPII([])
      expect(result).toEqual([])
    })
  })
})
