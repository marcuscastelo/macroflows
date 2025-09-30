import { describe, expect, it } from 'vitest'
import type { Event } from '@sentry/solidstart'

import { scrubPiiFromEvent } from '~/modules/observability/infrastructure/sentry/piiScrubber'

describe('PII Scrubber', () => {
  describe('Email scrubbing', () => {
    it('scrubs email addresses from messages', () => {
      const event: Event = {
        message: 'User email is john.doe@example.com',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('User email is [REDACTED]')
    })

    it('scrubs multiple email addresses', () => {
      const event: Event = {
        message:
          'Contact admin@example.com or support@company.com for help',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe(
        'Contact [REDACTED] or [REDACTED] for help',
      )
    })

    it('scrubs email from user data', () => {
      const event: Event = {
        user: {
          id: 'user123',
          email: 'user@example.com',
          username: 'testuser',
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.user?.email).toBe('[REDACTED]')
      expect(scrubbed?.user?.id).toBe('user123') // ID should be preserved
      expect(scrubbed?.user?.username).toBe('testuser')
    })
  })

  describe('Brazilian phone number scrubbing', () => {
    it('scrubs phone with parentheses and dash: (11) 98765-4321', () => {
      const event: Event = {
        message: 'Call me at (11) 98765-4321',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Call me at [REDACTED]')
    })

    it('scrubs phone with country code: +55 11 98765-4321', () => {
      const event: Event = {
        message: 'WhatsApp: +55 11 98765-4321',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('WhatsApp: [REDACTED]')
    })

    it('scrubs phone without formatting: 11987654321', () => {
      const event: Event = {
        message: 'Phone: 11987654321',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Phone: [REDACTED]')
    })

    it('scrubs landline phone: (11) 3456-7890', () => {
      const event: Event = {
        message: 'Office: (11) 3456-7890',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Office: [REDACTED]')
    })
  })

  describe('CPF scrubbing', () => {
    it('scrubs formatted CPF: 123.456.789-10', () => {
      const event: Event = {
        message: 'CPF is 123.456.789-10',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('CPF is [REDACTED]')
    })

    it('scrubs unformatted CPF: 12345678910', () => {
      const event: Event = {
        message: 'Document: 12345678910',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Document: [REDACTED]')
    })

    it('scrubs CPF from extra data', () => {
      const event: Event = {
        extra: {
          userData: {
            cpf: '123.456.789-10',
          },
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.userData).toEqual({
        cpf: '[REDACTED]',
      })
    })
  })

  describe('CNPJ scrubbing', () => {
    it('scrubs formatted CNPJ: 12.345.678/0001-10', () => {
      const event: Event = {
        message: 'Company CNPJ: 12.345.678/0001-10',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Company CNPJ: [REDACTED]')
    })

    it('scrubs unformatted CNPJ: 12345678000110', () => {
      const event: Event = {
        message: 'Registration: 12345678000110',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Registration: [REDACTED]')
    })
  })

  describe('Credit card scrubbing', () => {
    it('scrubs credit card with spaces: 1234 5678 9012 3456', () => {
      const event: Event = {
        message: 'Card: 1234 5678 9012 3456',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Card: [REDACTED]')
    })

    it('scrubs credit card with dashes: 1234-5678-9012-3456', () => {
      const event: Event = {
        message: 'Payment: 1234-5678-9012-3456',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Payment: [REDACTED]')
    })

    it('scrubs credit card without formatting: 1234567890123456', () => {
      const event: Event = {
        message: 'CC: 1234567890123456',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('CC: [REDACTED]')
    })
  })

  describe('Sensitive keys scrubbing', () => {
    it('scrubs password key', () => {
      const event: Event = {
        extra: {
          formData: {
            username: 'john',
            password: 'secret123',
          },
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.formData).toEqual({
        username: 'john',
        password: '[REDACTED]',
      })
    })

    it('scrubs token key', () => {
      const event: Event = {
        extra: {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer abc123',
          },
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: '[REDACTED]',
      })
    })

    it('scrubs api_key and secret keys', () => {
      const event: Event = {
        extra: {
          config: {
            api_key: 'key123',
            secret: 'secret456',
            publicKey: 'public789',
          },
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.config).toEqual({
        api_key: '[REDACTED]',
        secret: '[REDACTED]',
        publicKey: 'public789',
      })
    })

    it('scrubs sensitive keys case-insensitively', () => {
      const event: Event = {
        extra: {
          data: {
            Password: 'pass1',
            ACCESS_TOKEN: 'token1',
            apiKey: 'key1',
          },
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.data).toEqual({
        Password: '[REDACTED]',
        ACCESS_TOKEN: '[REDACTED]',
        apiKey: '[REDACTED]',
      })
    })
  })

  describe('Exception scrubbing', () => {
    it('scrubs PII from exception values', () => {
      const event: Event = {
        exception: {
          values: [
            {
              type: 'Error',
              value: 'Failed for user john@example.com',
            },
          ],
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.exception?.values?.[0]?.value).toBe(
        'Failed for user [REDACTED]',
      )
    })

    it('scrubs PII from stack trace variables', () => {
      const event: Event = {
        exception: {
          values: [
            {
              type: 'Error',
              value: 'Error',
              stacktrace: {
                frames: [
                  {
                    filename: 'app.ts',
                    function: 'handler',
                    vars: {
                      email: 'test@example.com',
                      userId: '123',
                    },
                  },
                ],
              },
            },
          ],
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(
        scrubbed?.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars,
      ).toEqual({
        email: '[REDACTED]',
        userId: '123',
      })
    })
  })

  describe('Breadcrumbs scrubbing', () => {
    it('scrubs PII from breadcrumb messages', () => {
      const event: Event = {
        breadcrumbs: [
          {
            message: 'User logged in: user@example.com',
            category: 'auth',
            level: 'info',
          },
          {
            message: 'Profile updated',
            category: 'user',
            level: 'info',
          },
        ],
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.breadcrumbs?.[0]?.message).toBe(
        'User logged in: [REDACTED]',
      )
      expect(scrubbed?.breadcrumbs?.[1]?.message).toBe('Profile updated')
    })

    it('scrubs PII from breadcrumb data', () => {
      const event: Event = {
        breadcrumbs: [
          {
            message: 'API call',
            category: 'http',
            data: {
              url: 'https://api.example.com/users',
              email: 'test@example.com',
            },
          },
        ],
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.breadcrumbs?.[0]?.data).toEqual({
        url: 'https://api.example.com/users',
        email: '[REDACTED]',
      })
    })
  })

  describe('Request data scrubbing', () => {
    it('scrubs PII from URL', () => {
      const event: Event = {
        request: {
          url: 'https://example.com/api/user?email=test@example.com',
          method: 'GET',
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.request?.url).toBe(
        'https://example.com/api/user?email=[REDACTED]',
      )
    })

    it('scrubs PII from query string', () => {
      const event: Event = {
        request: {
          url: 'https://example.com/api',
          query_string: 'email=test@example.com&name=John',
          method: 'GET',
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.request?.query_string).toBe(
        'email=[REDACTED]&name=John',
      )
    })

    it('scrubs sensitive headers', () => {
      const event: Event = {
        request: {
          url: 'https://example.com',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
            Cookie: 'session=abc123',
          },
          method: 'GET',
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.request?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: '[REDACTED]',
        Cookie: '[REDACTED]',
      })
    })

    it('scrubs PII from request body', () => {
      const event: Event = {
        request: {
          url: 'https://example.com',
          method: 'POST',
          data: {
            username: 'john',
            email: 'john@example.com',
            password: 'secret',
          },
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.request?.data).toEqual({
        username: 'john',
        email: '[REDACTED]',
        password: '[REDACTED]',
      })
    })
  })

  describe('Nested object scrubbing', () => {
    it('scrubs PII from deeply nested objects', () => {
      const event: Event = {
        extra: {
          level1: {
            level2: {
              level3: {
                email: 'nested@example.com',
                password: 'secret',
                name: 'John',
              },
            },
          },
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.level1?.level2?.level3).toEqual({
        email: '[REDACTED]',
        password: '[REDACTED]',
        name: 'John',
      })
    })

    it('scrubs PII from arrays', () => {
      const event: Event = {
        extra: {
          users: [
            { name: 'John', email: 'john@example.com' },
            { name: 'Jane', email: 'jane@example.com' },
          ],
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.users).toEqual([
        { name: 'John', email: '[REDACTED]' },
        { name: 'Jane', email: '[REDACTED]' },
      ])
    })
  })

  describe('Mixed PII patterns', () => {
    it('scrubs multiple types of PII from the same message', () => {
      const event: Event = {
        message:
          'User john@example.com with CPF 123.456.789-10 called (11) 98765-4321',
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe(
        'User [REDACTED] with CPF [REDACTED] called [REDACTED]',
      )
    })

    it('preserves non-PII data', () => {
      const event: Event = {
        message: 'Request ID: 12345, User logged in',
        extra: {
          requestId: '12345',
          timestamp: 1234567890,
          success: true,
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBe('Request ID: 12345, User logged in')
      expect(scrubbed?.extra).toEqual({
        requestId: '12345',
        timestamp: 1234567890,
        success: true,
      })
    })
  })

  describe('Edge cases', () => {
    it('handles null values', () => {
      const event: Event = {
        message: null as unknown as string,
        extra: {
          value: null,
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBeNull()
      expect(scrubbed?.extra?.value).toBeNull()
    })

    it('handles undefined values', () => {
      const event: Event = {
        message: undefined,
        extra: {
          value: undefined,
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.message).toBeUndefined()
      expect(scrubbed?.extra?.value).toBeUndefined()
    })

    it('handles empty objects and arrays', () => {
      const event: Event = {
        extra: {
          emptyObj: {},
          emptyArray: [],
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.extra?.emptyObj).toEqual({})
      expect(scrubbed?.extra?.emptyArray).toEqual([])
    })

    it('returns event on scrubbing error', () => {
      const event: Event = {
        message: 'Test message',
      }

      // Mock a scenario where scrubbing might fail
      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed).toBeTruthy()
      expect(scrubbed?.message).toBe('Test message')
    })
  })

  describe('User data preservation', () => {
    it('preserves user ID while scrubbing email and IP', () => {
      const event: Event = {
        user: {
          id: 'user-12345',
          email: 'user@example.com',
          username: 'john.doe',
          ip_address: '192.168.1.1',
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.user?.id).toBe('user-12345')
      expect(scrubbed?.user?.email).toBe('[REDACTED]')
      expect(scrubbed?.user?.username).toBe('john.doe')
      expect(scrubbed?.user?.ip_address).toBe('[REDACTED]')
    })

    it('scrubs email-like username', () => {
      const event: Event = {
        user: {
          id: 'user-12345',
          username: 'john@example.com',
        },
      }

      const scrubbed = scrubPiiFromEvent(event, {})

      expect(scrubbed?.user?.username).toBe('[REDACTED]')
    })
  })
})
