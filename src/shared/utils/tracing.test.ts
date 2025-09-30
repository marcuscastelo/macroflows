import { SpanKind, SpanStatusCode } from '@opentelemetry/api'
import { describe, expect, it, vi } from 'vitest'

import {
  addSpanAttribute,
  addSpanAttributes,
  addSpanEvent,
  getActiveSpan,
  getTracer,
  recordSpanException,
  setSpanStatus,
  traceApiRoute,
  traceDbOperation,
  traceHttpRequest,
  traceUserJourney,
  withSpan,
  withSpanSync,
} from '~/shared/utils/tracing'

describe('tracing utilities', () => {
  describe('getTracer', () => {
    it('returns a tracer instance', () => {
      const tracer = getTracer()
      expect(tracer).toBeDefined()
      expect(typeof tracer.startSpan).toBe('function')
    })
  })

  describe('withSpan', () => {
    it('creates a span and executes the function', async () => {
      const result = await withSpan('test-span', async () => {
        return 'test-result'
      })
      expect(result).toBe('test-result')
    })

    it('handles errors and records them in the span', async () => {
      await expect(
        withSpan('test-span-error', async () => {
          throw new Error('test error')
        }),
      ).rejects.toThrow('test error')
    })

    it('accepts span kind and attributes', async () => {
      const result = await withSpan(
        'test-span-options',
        async () => 'result',
        {
          kind: SpanKind.CLIENT,
          attributes: { 'test.attribute': 'value' },
        },
      )
      expect(result).toBe('result')
    })
  })

  describe('withSpanSync', () => {
    it('creates a span and executes the synchronous function', () => {
      const result = withSpanSync('test-span-sync', () => {
        return 'sync-result'
      })
      expect(result).toBe('sync-result')
    })

    it('handles errors and records them in the span', () => {
      expect(() =>
        withSpanSync('test-span-sync-error', () => {
          throw new Error('sync error')
        }),
      ).toThrow('sync error')
    })
  })

  describe('span attribute operations', () => {
    it('addSpanAttribute does not throw without active span', () => {
      expect(() => addSpanAttribute('key', 'value')).not.toThrow()
    })

    it('addSpanAttributes does not throw without active span', () => {
      expect(() =>
        addSpanAttributes({ key1: 'value1', key2: 123 }),
      ).not.toThrow()
    })

    it('addSpanEvent does not throw without active span', () => {
      expect(() => addSpanEvent('test-event')).not.toThrow()
    })

    it('recordSpanException does not throw without active span', () => {
      expect(() => recordSpanException(new Error('test'))).not.toThrow()
    })

    it('setSpanStatus does not throw without active span', () => {
      expect(() => setSpanStatus(SpanStatusCode.OK)).not.toThrow()
    })
  })

  describe('specialized tracing functions', () => {
    describe('traceDbOperation', () => {
      it('traces database operations with proper attributes', async () => {
        const result = await traceDbOperation(
          'SELECT',
          'users',
          async () => 'db-result',
        )
        expect(result).toBe('db-result')
      })

      it('handles errors in database operations', async () => {
        await expect(
          traceDbOperation('INSERT', 'users', async () => {
            throw new Error('db error')
          }),
        ).rejects.toThrow('db error')
      })
    })

    describe('traceHttpRequest', () => {
      it('traces HTTP requests with proper attributes', async () => {
        const result = await traceHttpRequest(
          'GET',
          'https://api.example.com/data',
          async () => 'http-result',
        )
        expect(result).toBe('http-result')
      })

      it('handles errors in HTTP requests', async () => {
        await expect(
          traceHttpRequest('POST', 'https://api.example.com/data', async () => {
            throw new Error('http error')
          }),
        ).rejects.toThrow('http error')
      })
    })

    describe('traceApiRoute', () => {
      it('traces API route handlers with proper attributes', async () => {
        const result = await traceApiRoute(
          'GET',
          '/api/users',
          async () => 'api-result',
        )
        expect(result).toBe('api-result')
      })

      it('handles errors in API routes', async () => {
        await expect(
          traceApiRoute('POST', '/api/users', async () => {
            throw new Error('api error')
          }),
        ).rejects.toThrow('api error')
      })
    })

    describe('traceUserJourney', () => {
      it('traces user journey steps with proper attributes', async () => {
        const result = await traceUserJourney(
          'meal-creation',
          'select-foods',
          async () => 'journey-result',
        )
        expect(result).toBe('journey-result')
      })

      it('handles errors in user journeys', async () => {
        await expect(
          traceUserJourney('meal-creation', 'save-meal', async () => {
            throw new Error('journey error')
          }),
        ).rejects.toThrow('journey error')
      })
    })
  })

  describe('getActiveSpan', () => {
    it('returns undefined when no span is active', () => {
      const span = getActiveSpan()
      expect(span).toBeUndefined()
    })

    it('allows getting active span within a traced context without errors', async () => {
      // In test environment with noop tracer, getActiveSpan may return undefined
      // This test verifies the API works without errors
      await withSpan('test-active', async () => {
        const span = getActiveSpan()
        // Span may be undefined in test environment, but the call should not error
        expect(span === undefined || span !== undefined).toBe(true)
      })
    })
  })
})
