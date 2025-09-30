import { trace } from '@opentelemetry/api'
import { describe, expect, it, vi } from 'vitest'

import { handleApiError } from '~/shared/error/errorHandler'
import { logging } from '~/shared/utils/logging'

vi.mock('~/shared/utils/logging', () => ({
  logging: {
    error: vi.fn(),
  },
}))

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn(() => ({
      startSpan: vi.fn(() => ({
        addEvent: vi.fn(),
        end: vi.fn(),
      })),
    })),
  },
}))

describe('handleApiError', () => {
  it('handles Error instances correctly', () => {
    const error = new Error('Test error')
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
    }

    handleApiError(error, context)

    expect(logging.error).toHaveBeenCalledWith(
      'TestComponent.testOperation error: Test error',
      error,
      undefined,
    )
  })

  it('handles Error instances with additional data', () => {
    const error = new Error('Test error')
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
      additionalData: { userId: '123', action: 'fetch' },
    }

    handleApiError(error, context)

    expect(logging.error).toHaveBeenCalledWith(
      'TestComponent.testOperation error: Test error',
      error,
      { userId: '123', action: 'fetch' },
    )
  })

  it('handles string errors', () => {
    const error = 'String error message'
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
    }

    handleApiError(error, context)

    expect(logging.error).toHaveBeenCalledWith(
      'TestComponent.testOperation error: String error message',
      error,
      undefined,
    )
  })

  it('handles unknown error types', () => {
    const error = { custom: 'error object' }
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
    }

    handleApiError(error, context)

    expect(logging.error).toHaveBeenCalled()
  })

  it('handles null errors', () => {
    const error = null
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
    }

    handleApiError(error, context)

    expect(logging.error).toHaveBeenCalled()
  })

  it('creates OpenTelemetry span with correct attributes', () => {
    const error = new Error('Test error')
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
      additionalData: { key: 'value' },
    }

    const mockSpan = {
      addEvent: vi.fn(),
      end: vi.fn(),
    }
    const mockStartSpan = vi.fn(() => mockSpan)
    const mockGetTracer = vi.fn(() => ({ startSpan: mockStartSpan }))
    vi.mocked(trace.getTracer).mockImplementation(mockGetTracer)

    handleApiError(error, context)

    expect(mockGetTracer).toHaveBeenCalledWith('macroflows')
    expect(mockStartSpan).toHaveBeenCalledWith(
      'error.TestComponent.testOperation',
      expect.objectContaining({
        attributes: expect.objectContaining({
          'error.type': 'Error',
          'error.message': 'Test error',
          'code.component': 'TestComponent',
          'code.operation': 'testOperation',
          key: 'value',
        }),
      }),
    )
    expect(mockSpan.addEvent).toHaveBeenCalledWith('error.handled', {
      'error.message': 'Test error',
      'error.handled': true,
    })
    expect(mockSpan.end).toHaveBeenCalled()
  })

  it('handles errors with stack traces', () => {
    const error = new Error('Test error with stack')
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
    }

    handleApiError(error, context)

    expect(logging.error).toHaveBeenCalled()
  })

  it('ensures span ends even if error occurs', () => {
    const error = new Error('Test error')
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
    }

    const mockSpan = {
      addEvent: vi.fn(() => {
        throw new Error('Span error')
      }),
      end: vi.fn(),
    }
    const mockStartSpan = vi.fn(() => mockSpan)
    const mockGetTracer = vi.fn(() => ({ startSpan: mockStartSpan }))
    vi.mocked(trace.getTracer).mockImplementation(mockGetTracer)

    expect(() => handleApiError(error, context)).toThrow('Span error')
    expect(mockSpan.end).toHaveBeenCalled()
  })

  it('handles complex additional data', () => {
    const error = new Error('Test error')
    const context = {
      component: 'TestComponent',
      operation: 'testOperation',
      additionalData: {
        userId: '123',
        nested: { key: 'value' },
        array: [1, 2, 3],
      },
    }

    const mockSpan = {
      addEvent: vi.fn(),
      end: vi.fn(),
    }
    const mockStartSpan = vi.fn(() => mockSpan)
    const mockGetTracer = vi.fn(() => ({ startSpan: mockStartSpan }))
    vi.mocked(trace.getTracer).mockImplementation(mockGetTracer)

    handleApiError(error, context)

    expect(logging.error).toHaveBeenCalledWith(
      'TestComponent.testOperation error: Test error',
      error,
      {
        userId: '123',
        nested: { key: 'value' },
        array: [1, 2, 3],
      },
    )
  })
})
