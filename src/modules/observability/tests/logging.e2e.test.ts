/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { trace } from '@opentelemetry/api'
import { type Span } from '@opentelemetry/sdk-trace-base'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logging } from '~/shared/utils/logging'

type MockSpan = {
  addEvent: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
  setAttribute: ReturnType<typeof vi.fn>
  setAttributes: ReturnType<typeof vi.fn>
}

type MockTracer = {
  startSpan: ReturnType<typeof vi.fn>
}

describe('Logging E2E Tests', () => {
  let mockSpan: MockSpan
  let mockTracer: MockTracer

  beforeEach(() => {
    vi.clearAllMocks()

    mockSpan = {
      addEvent: vi.fn(),
      end: vi.fn(),
      setAttribute: vi.fn(),
      setAttributes: vi.fn(),
    }

    mockTracer = {
      startSpan: vi.fn(() => mockSpan),
    }

    vi.spyOn(trace, 'getTracer').mockReturnValue(
      mockTracer as unknown as ReturnType<typeof trace.getTracer>,
    )
    vi.spyOn(trace, 'getActiveSpan').mockReturnValue(undefined)
  })

  describe('Logging Persistence', () => {
    it('should create debug log events with proper structure', () => {
      const message = 'Debug test message'
      const data = { userId: 'test-123', action: 'test-action' }

      logging.debug(message, data)

      expect(mockTracer.startSpan).toHaveBeenCalled()
      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.debug',
        expect.objectContaining({
          'log.body': message,
          'log.severity': 'debug',
          timestamp: expect.any(Number),
          userId: 'test-123',
          action: 'test-action',
        }),
      )
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should create info log events with proper structure', () => {
      const message = 'Info test message'
      const data = { operation: 'data-sync' }

      logging.info(message, data)

      expect(mockTracer.startSpan).toHaveBeenCalled()
      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.info',
        expect.objectContaining({
          'log.body': message,
          'log.severity': 'info',
          operation: 'data-sync',
        }),
      )
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should create warn log events with proper structure', () => {
      const message = 'Warning test message'
      const data = { warning: 'deprecation-warning' }

      logging.warn(message, data)

      expect(mockTracer.startSpan).toHaveBeenCalled()
      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.warn',
        expect.objectContaining({
          'log.body': message,
          'log.severity': 'warn',
          warning: 'deprecation-warning',
        }),
      )
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should create error log events with proper structure', () => {
      const message = 'Error test message'
      const error = new Error('Test error')
      const data = { context: 'user-action' }

      logging.error(message, error, data)

      expect(mockTracer.startSpan).toHaveBeenCalled()
      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.error',
        expect.objectContaining({
          'log.body': message,
          'log.severity': 'error',
          error: 'Test error',
          context: 'user-action',
        }),
      )
      expect(mockSpan.end).toHaveBeenCalled()
    })
  })

  describe('Logging Context', () => {
    it('should include timestamp in log events', () => {
      const beforeTimestamp = Date.now()
      logging.info('Test message')
      const afterTimestamp = Date.now()

      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.info',
        expect.objectContaining({
          timestamp: expect.any(Number),
        }),
      )

      const callArgs = mockSpan.addEvent.mock.calls[0]?.[1]
      expect(callArgs?.timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(callArgs?.timestamp).toBeLessThanOrEqual(afterTimestamp)
    })

    it('should use active span when available', () => {
      const mockActiveSpan = {
        addEvent: vi.fn(),
      }
      vi.spyOn(trace, 'getActiveSpan').mockReturnValue(
        mockActiveSpan as unknown as Span,
      )

      logging.info('Test message')

      expect(mockActiveSpan.addEvent).toHaveBeenCalledWith(
        'log.info',
        expect.objectContaining({
          'log.body': 'Test message',
        }),
      )
      expect(mockTracer.startSpan).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling in Logging', () => {
    it('should handle error objects correctly', () => {
      const error = new Error('Test error object')
      logging.error('Error occurred', error)

      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.error',
        expect.objectContaining({
          error: 'Test error object',
        }),
      )
    })

    it('should handle non-error values', () => {
      logging.error('Error occurred', 'String error')

      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.error',
        expect.objectContaining({
          error: 'String error',
        }),
      )
    })

    it('should handle undefined error', () => {
      logging.error('Error occurred', undefined)

      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'log.error',
        expect.objectContaining({
          error: undefined,
        }),
      )
    })
  })

  describe('Logging Integration', () => {
    it('should create proper span attributes', () => {
      logging.info('Test message')

      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          attributes: expect.objectContaining({
            'code.filepath': expect.any(String),
            'code.function': expect.any(String),
            'log.severity': 'info',
          }),
        }),
      )
    })

    it('should properly end spans', () => {
      logging.info('Test message')

      expect(mockSpan.end).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple log calls independently', () => {
      logging.debug('First log')
      logging.info('Second log')
      logging.warn('Third log')

      expect(mockTracer.startSpan).toHaveBeenCalledTimes(3)
      expect(mockSpan.end).toHaveBeenCalledTimes(3)
    })
  })
})
