import { describe, expect, it, vi } from 'vitest'

import { createExpandableErrorData } from '~/modules/toast/domain/errorMessageHandler'

vi.mock('~/shared/config/env', () => ({
  isDevelopment: vi.fn(() => false),
}))

vi.mock('~/shared/utils/logging', () => ({
  logging: {
    debug: vi.fn(),
  },
}))

describe('createExpandableErrorData', () => {
  it('truncates long messages and sets isTruncated', () => {
    const error = 'A'.repeat(200)
    const result = createExpandableErrorData(error, { maxLength: 50 })
    expect(result.displayMessage.length).toBeLessThanOrEqual(50)
    expect(result.isTruncated).toBe(true)
    expect(result.displayMessage.endsWith('...')).toBe(true)
  })

  it('removes noisy prefixes', () => {
    const error = 'Error: Something went wrong'
    const result = createExpandableErrorData(error)
    expect(result.displayMessage).toBe('Something went wrong')
  })

  it('handles Error objects with stack', () => {
    const error = new Error('fail')
    const result = createExpandableErrorData(error)
    expect(result.errorDetails.message).toBe('fail')
    expect(result.errorDetails.stack).toBeDefined()
    expect(result.canExpand).toBe(true)
  })

  it('handles objects with message property', () => {
    const error = { message: 'obj error', foo: 1 }
    const result = createExpandableErrorData(error)
    expect(result.errorDetails.message).toBe('obj error')
    expect(result.errorDetails.context).toHaveProperty('foo', 1)
  })

  it('handles objects with error property', () => {
    const error = { error: 'error prop', bar: 2 }
    const result = createExpandableErrorData(error)
    expect(result.errorDetails.message).toBe('error prop')
    expect(result.errorDetails.context).toHaveProperty('bar', 2)
  })

  it('handles unknown types gracefully', () => {
    const result = createExpandableErrorData(12345)
    expect(result.errorDetails.message).toBe('An unexpected error occurred')
    expect(result.displayMessage).toBe('An unexpected error occurred')
  })

  it('preserves line breaks if option is set', () => {
    const error = 'line1\n   line2\nline3'
    const result = createExpandableErrorData(error, {
      preserveLineBreaks: true,
    })
    expect(result.displayMessage).toBe('line1\nline2\nline3')
  })

  it('removes excessive whitespace', () => {
    const error = 'Error:    lots   of   space   '
    const result = createExpandableErrorData(error)
    expect(result.displayMessage).toBe('lots of space')
  })

  it('uses custom truncation suffix', () => {
    const error = 'A'.repeat(200)
    const result = createExpandableErrorData(error, {
      maxLength: 50,
      truncationSuffix: '[cut]',
    })
    expect(result.displayMessage.endsWith('[cut]')).toBe(true)
  })

  it('canExpand is true if context exists', () => {
    const error = { message: 'msg', foo: 'bar' }
    const result = createExpandableErrorData(error, { maxLength: 5 })
    expect(result.canExpand).toBe(true)
  })

  it('handles non-serializable cause gracefully', () => {
    const error = new Error('fail')
    // Assign a circular reference to error.cause for test
    error.cause = { circular: error }
    const result = createExpandableErrorData(error)
    expect(result.errorDetails.context).toHaveProperty('cause')
    // cause should be a string indicating unserializable, or an object if serializable
    const cause = result.errorDetails.context?.cause
    expect(
      typeof cause === 'string' ||
        (typeof cause === 'object' && cause !== null),
    ).toBe(true)
  })
})
