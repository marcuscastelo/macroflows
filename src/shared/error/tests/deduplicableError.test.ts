/**
 * Deduplicable Error Tests
 *
 * Unit tests for the DeduplicableError class and the toast deduplication logic.
 */

import { describe, expect, it, vi } from 'vitest'

vi.mock('~/shared/utils/logging', () => ({
  logging: {
    debug: vi.fn(),
  },
}))

vi.mock('~/shared/config/env', () => ({
  isDevelopment: vi.fn(() => false),
}))

import { showError } from '~/modules/toast/application/toastManager'
import * as toastQueue from '~/modules/toast/application/toastQueue'
import * as errorMessageHandler from '~/modules/toast/domain/errorMessageHandler'
import {
  DeduplicableError,
  isDeduplicableError,
  MacroTargetNotFoundForDayError,
  WeightNotFoundForDayError,
} from '~/shared/error/deduplicableError'

describe('DeduplicableError', () => {
  it('DeduplicableError has errorId property', () => {
    const error = new DeduplicableError('Test error', 'test-error-id')
    expect(error.message).toBe('Test error')
    expect(error.errorId).toBe('test-error-id')
    expect(error.name).toBe('DeduplicableError')
  })

  it('WeightNotFoundForDayError has stable errorId', () => {
    const day1 = new Date('2024-01-01')
    const day2 = new Date('2024-01-02')

    const error1 = new WeightNotFoundForDayError(day1)
    const error2 = new WeightNotFoundForDayError(day2)

    // Both errors should have the same errorId (stable for deduplication)
    expect(error1.errorId).toBe(WeightNotFoundForDayError.ERROR_ID)
    expect(error2.errorId).toBe(WeightNotFoundForDayError.ERROR_ID)
    expect(error1.errorId).toBe(error2.errorId)

    // But different messages (for debugging)
    expect(error1.message).toContain('2024-01-01')
    expect(error2.message).toContain('2024-01-02')

    // Preserves the day
    expect(error1.day).toEqual(day1)
    expect(error2.day).toEqual(day2)
  })

  it('MacroTargetNotFoundForDayError has stable errorId', () => {
    const day1 = new Date('2024-01-01')
    const day2 = new Date('2024-01-02')

    const error1 = new MacroTargetNotFoundForDayError(day1)
    const error2 = new MacroTargetNotFoundForDayError(day2)

    // Both errors should have the same errorId (stable for deduplication)
    expect(error1.errorId).toBe(MacroTargetNotFoundForDayError.ERROR_ID)
    expect(error2.errorId).toBe(MacroTargetNotFoundForDayError.ERROR_ID)
    expect(error1.errorId).toBe(error2.errorId)

    // But different messages (for debugging)
    expect(error1.message).toContain('2024-01-01')
    expect(error2.message).toContain('2024-01-02')

    // Preserves the day
    expect(error1.day).toEqual(day1)
    expect(error2.day).toEqual(day2)
  })

  it('isDeduplicableError returns true for DeduplicableError instances', () => {
    const deduplicableError = new DeduplicableError('Test', 'test-id')
    const weightError = new WeightNotFoundForDayError(new Date())
    const macroError = new MacroTargetNotFoundForDayError(new Date())
    const regularError = new Error('Regular error')

    expect(isDeduplicableError(deduplicableError)).toBe(true)
    expect(isDeduplicableError(weightError)).toBe(true)
    expect(isDeduplicableError(macroError)).toBe(true)
    expect(isDeduplicableError(regularError)).toBe(false)
    expect(isDeduplicableError('string error')).toBe(false)
    expect(isDeduplicableError(null)).toBe(false)
    expect(isDeduplicableError(undefined)).toBe(false)
  })
})

describe('showError with DeduplicableError', () => {
  it('extracts deduplicationKey from DeduplicableError', () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    vi.spyOn(
      errorMessageHandler,
      'createExpandableErrorData',
    ).mockImplementation((msg, opts, displayMsg) => ({
      displayMessage: String(displayMsg ?? msg),
      raw: String(msg),
      options: opts,
      isTruncated: false,
      originalMessage: String(msg),
      errorDetails: { message: String(msg), fullError: String(msg) },
      canExpand: false,
    }))

    const error = new WeightNotFoundForDayError(new Date('2024-01-01'))
    showError(error, { context: 'user-action' })

    expect(registerToast).toHaveBeenCalled()
    const toastArg = registerToast.mock.calls[0]?.[0]
    expect(toastArg).toBeDefined()
    expect(toastArg?.options.deduplicationKey).toBe(
      WeightNotFoundForDayError.ERROR_ID,
    )
  })

  it('regular errors have null deduplicationKey', () => {
    const registerToast = vi
      .spyOn(toastQueue, 'registerToast')
      .mockImplementation((item) => item.id)
    vi.spyOn(
      errorMessageHandler,
      'createExpandableErrorData',
    ).mockImplementation((msg, opts, displayMsg) => ({
      displayMessage: String(displayMsg ?? msg),
      raw: String(msg),
      options: opts,
      isTruncated: false,
      originalMessage: String(msg),
      errorDetails: { message: String(msg), fullError: String(msg) },
      canExpand: false,
    }))

    const error = new Error('Regular error')
    showError(error, { context: 'user-action' })

    expect(registerToast).toHaveBeenCalled()
    const toastArg = registerToast.mock.calls[0]?.[0]
    expect(toastArg).toBeDefined()
    expect(toastArg?.options.deduplicationKey).toBe(null)
  })
})
