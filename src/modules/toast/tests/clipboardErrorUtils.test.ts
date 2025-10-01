import { describe, expect, it } from 'vitest'

import { TOAST_MESSAGES } from '~/modules/toast/domain/toastMessages'
import { type ToastError } from '~/modules/toast/domain/toastTypes'
import { formatErrorForClipboard } from '~/modules/toast/infrastructure/clipboardErrorUtils'

describe('formatErrorForClipboard', () => {
  it('formats all fields correctly', () => {
    const error: ToastError = {
      message: 'Test error',
      fullError: 'Full stacktrace',
      context: { foo: 'bar', num: 42 },
      stack: 'stacktrace here',
      timestamp: 1717600000000,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain(`${TOAST_MESSAGES.ERROR_TITLE}: Test error`)
    expect(result).toContain(`${TOAST_MESSAGES.SHOW_DETAILS}: Full stacktrace`)
    expect(result).toContain(`${TOAST_MESSAGES.COPY_ERROR}:`)
    expect(result).toContain('foo')
    expect(result).toContain('num')
    expect(result).toContain('Stack Trace:')
    expect(result).toContain('stacktrace here')
    expect(result).toContain('Timestamp: 2024-06-05T')
    expect(result).toContain('Error Report - ')
  })

  it('omits empty or duplicate fields', () => {
    const error: ToastError = {
      message: 'Error',
      fullError: 'Error',
      context: {},
      stack: '',
      timestamp: 0,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain(`${TOAST_MESSAGES.ERROR_TITLE}: Error`)
    expect(result).not.toContain(`${TOAST_MESSAGES.SHOW_DETAILS}:`)
    expect(result).not.toContain(`${TOAST_MESSAGES.COPY_ERROR}:`)
    expect(result).not.toContain('Stack Trace:')
    expect(result).not.toContain('Timestamp:')
  })

  it('handles missing fields gracefully', () => {
    const error = {
      message: '',
      fullError: '',
      context: undefined,
      stack: undefined,
      timestamp: undefined,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain('Error Report - ')
    expect(result).not.toContain('Message:')
    expect(result).not.toContain('Details:')
    expect(result).not.toContain('Context:')
    expect(result).not.toContain('Stack Trace:')
    expect(result).not.toContain('Timestamp:')
  })

  it('handles only message', () => {
    const error: ToastError = {
      message: 'Message only',
      fullError: '',
      context: {},
      stack: '',
      timestamp: 0,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain(`${TOAST_MESSAGES.ERROR_TITLE}: Message only`)
    expect(result).not.toContain(`${TOAST_MESSAGES.SHOW_DETAILS}:`)
    expect(result).not.toContain(`${TOAST_MESSAGES.COPY_ERROR}:`)
  })

  it('handles only stack', () => {
    const error: ToastError = {
      message: '',
      fullError: '',
      context: {},
      stack: 'stack only',
      timestamp: 0,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain('Stack Trace:')
    expect(result).toContain('stack only')
    expect(result).not.toContain('Message:')
    expect(result).not.toContain('Details:')
    expect(result).not.toContain('Context:')
    expect(result).not.toContain('Timestamp:')
  })

  it('handles only context', () => {
    const error: ToastError = {
      message: '',
      fullError: '',
      context: { foo: 'bar' },
      stack: '',
      timestamp: 0,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain(`${TOAST_MESSAGES.COPY_ERROR}:`)
    expect(result).toContain('foo')
    expect(result).not.toContain(`${TOAST_MESSAGES.ERROR_TITLE}:`)
  })

  it('handles only timestamp', () => {
    const error: ToastError = {
      message: '',
      fullError: '',
      context: {},
      stack: '',
      timestamp: 1717600000000,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain('Timestamp: 2024-06-05T')
    expect(result).not.toContain('Message:')
    expect(result).not.toContain('Details:')
    expect(result).not.toContain('Context:')
    expect(result).not.toContain('Stack Trace:')
  })

  it('handles long message and multiline stack', () => {
    const error: ToastError = {
      message: 'Long message'.repeat(10),
      fullError: '',
      context: {},
      stack: 'line1\nline2\nline3',
      timestamp: 0,
    }
    const result = formatErrorForClipboard(error)
    expect(result).toContain('Long messageLong messageLong message')
    expect(result).toContain('Stack Trace:')
    expect(result).toContain('line1')
    expect(result).toContain('line2')
    expect(result).toContain('line3')
  })
})
