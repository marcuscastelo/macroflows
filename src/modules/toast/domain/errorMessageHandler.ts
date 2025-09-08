/**
 * Error Message Handler
 *
 * Utilities for handling error messages in toasts, including truncation,
 * formatting, and providing expansion capabilities for long messages.
 */

import {
  type ToastError,
  type ToastExpandableErrorData,
  type ToastOptions,
} from '~/modules/toast/domain/toastTypes'
import { isDevelopment } from '~/shared/config/env'
import { isNonEmptyString } from '~/shared/utils/isNonEmptyString'
import { jsonParseWithStack } from '~/shared/utils/jsonParseWithStack'
import { logging } from '~/shared/utils/logging'

/**
 * Options for error processing in toasts.
 *
 * Subset of ToastOptions used for error message formatting, truncation, and stack display.
 */
export type ErrorProcessingOptions = Pick<
  ToastOptions,
  'maxLength' | 'preserveLineBreaks' | 'truncationSuffix' | 'includeStack'
>

/**
 * Default options for error processing (truncation, formatting, stack, etc).
 *
 * These defaults are used throughout the toast system for error display and truncation.
 * Centralize all error-related display defaults here for maintainability.
 *
 * @see ErrorProcessingOptions
 */
export const DEFAULT_ERROR_OPTIONS: Required<ErrorProcessingOptions> = {
  maxLength: 100,
  preserveLineBreaks: false,
  truncationSuffix: '...',
  includeStack: true,
}

// Centralized default error messages for maintainability and i18n
const DEFAULT_UNKNOWN_ERROR = 'Unknown error occurred'
const DEFAULT_UNEXPECTED_ERROR = 'An unexpected error occurred'

// Extracted noisy prefixes to avoid recreating array on every call
const NOISY_PREFIXES = [
  'Error: ',
  'TypeError: ',
  'ReferenceError: ',
  'SyntaxError: ',
  'Network Error: ',
  'Request failed: ',
]

/**
 * Process an error and return all expandable error data for toasts.
 *
 * Handles truncation, formatting, and detail extraction for error messages.
 * Uses DEFAULT_ERROR_OPTIONS as the default for all error display options, which can be overridden per call.
 *
 * @param error - The error to process (string, Error, or object)
 * @param options - Partial error processing options (see ErrorProcessingOptions)
 * @param providedDisplayMessage - Optional display message override
 * @returns ToastExpandableErrorData for use in UI
 */
export function createExpandableErrorData(
  error: unknown,
  options: Partial<ErrorProcessingOptions> = {},
  providedDisplayMessage?: string,
): ToastExpandableErrorData {
  const opts = { ...DEFAULT_ERROR_OPTIONS, ...options }
  const errorDetails = mapUnknownToToastError(error, opts.includeStack)
  const originalMessage = errorDetails.message

  let displayMessage: string
  let needsTruncation: boolean

  let cleanMessage = originalMessage
  // Clean up the message for display
  if (isNonEmptyString(providedDisplayMessage)) {
    cleanMessage =
      providedDisplayMessage +
      ': ' +
      cleanErrorMessage(originalMessage, opts.preserveLineBreaks)
  } else {
    cleanMessage = cleanErrorMessage(originalMessage, opts.preserveLineBreaks)
  }

  // Check if truncation is needed
  needsTruncation = cleanMessage.length > opts.maxLength
  displayMessage = needsTruncation
    ? truncateMessage(cleanMessage, opts.maxLength, opts.truncationSuffix)
    : cleanMessage

  return {
    displayMessage,
    isTruncated: needsTruncation,
    originalMessage,
    errorDetails,
    canExpand:
      needsTruncation ||
      (typeof errorDetails.stack === 'string' &&
        errorDetails.stack.trim().length > 0) ||
      !!errorDetails.context,
  }
}

/**
 * Convert unknown error to ToastError details (adapts various error types)
 */
function mapUnknownToToastError(
  error: unknown,
  includeStack: boolean,
): ToastError {
  // DEBUG: Log error and stack for investigation
  if (isDevelopment()) {
    logging.debug('mapUnknownToToastError error:', error)
  }
  if (error instanceof Error) {
    // Only serialize cause if it's a primitive or stringifiable
    let cause: unknown = error.cause
    if (typeof cause === 'object' && cause !== null) {
      try {
        cause = jsonParseWithStack(JSON.stringify(cause))
      } catch {
        cause = '[Unserializable cause]'
      }
    }
    if (typeof error.stack === 'string') {
      if (isDevelopment()) {
        logging.debug('mapUnknownToToastError error.stack:', error.stack)
      }
    } else {
      if (isDevelopment()) {
        logging.debug(
          'mapUnknownToToastError error.stack is not a string:',
          error.stack,
        )
      }
    }
    // Copia todas as propriedades próprias do erro customizado
    const customProps: Record<string, unknown> = {}
    for (const key of Object.keys(error)) {
      if (!['name', 'message', 'stack', 'cause'].includes(key)) {
        // @ts-expect-error: acesso dinâmico
        customProps[key] = error[key]
      }
    }
    return {
      message: error.message || DEFAULT_UNKNOWN_ERROR,
      fullError: error.toString(),
      stack: includeStack ? error.stack : undefined,
      context: {
        name: error.name,
        cause,
        ...customProps,
      },
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      fullError: error,
    }
  }

  if (typeof error === 'object' && error !== null) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const errorObj = error as Record<string, unknown>
    let message: string
    if (typeof errorObj.message === 'string') {
      message = errorObj.message
    } else if (typeof errorObj.error === 'string') {
      message = errorObj.error
    } else {
      message = DEFAULT_UNKNOWN_ERROR
    }
    // Limit JSON.stringify depth/size for fullError
    let fullError: string
    try {
      fullError = JSON.stringify(error, null, 2)
    } catch {
      fullError = '[Unserializable object]'
    }
    return {
      message,
      fullError,
      context: errorObj,
    }
  }

  return {
    message: DEFAULT_UNEXPECTED_ERROR,
    fullError: String(error),
  }
}

function cleanErrorMessage(
  message: string,
  preserveLineBreaks: boolean,
): string {
  let cleaned = message.trim()

  for (const prefix of NOISY_PREFIXES) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length)
      break
    }
  }

  // Handle line breaks
  if (!preserveLineBreaks) {
    cleaned = cleaned.replace(/\n\s*/g, ' ')
  } else {
    // Remove only trailing whitespace after line breaks, but preserve the line breaks
    cleaned = cleaned.replace(/\n\s*/g, '\n')
  }

  // Remove excessive whitespace (but not line breaks)
  cleaned = cleaned.replace(/[ \t\f\v]+/g, ' ').trim()

  return cleaned
}

function truncateMessage(
  message: string,
  maxLength: number,
  suffix: string,
): string {
  if (message.length <= maxLength) {
    return message
  }

  const targetLength = maxLength - suffix.length

  // Try to break at a word boundary
  const truncated = message.substring(0, targetLength)
  const lastSpace = truncated.lastIndexOf(' ')

  // If we can break at a word boundary and it's not too short, do so
  if (lastSpace > targetLength * 0.7 && lastSpace > 10) {
    return truncated.substring(0, lastSpace) + suffix
  }

  // Otherwise, hard truncate
  return truncated + suffix
}

// Add JSDoc for all exported types and functions for better maintainability
