/**
 * Toast Manager
 *
 * Central manager for the intelligent toast system.
 * Handles toast creation, queue management, and integration with solid-toast.
 */

import {
  killToast,
  registerToast,
} from '~/modules/toast/application/toastQueue'
import { createExpandableErrorData } from '~/modules/toast/domain/errorMessageHandler'
import {
  createToastItem,
  DEFAULT_TOAST_CONTEXT,
  DEFAULT_TOAST_OPTIONS,
  TOAST_DURATION_INFINITY,
  type ToastOptions,
} from '~/modules/toast/domain/toastTypes'
import { setBackendOutage } from '~/shared/error/backendOutageSignal'
import { isBackendOutageError } from '~/shared/error/errorHandler'
import { isNonEmptyString } from '~/shared/utils/isNonEmptyString'
import { logging } from '~/shared/utils/logging'
import { vibrate } from '~/shared/utils/vibrate'

/**
 * Returns true if the toast should be skipped based on context, audience, and type.
 *
 * @param options - ToastOptions including context, type, showSuccess, showLoading.
 * @returns True if the toast should be skipped, false otherwise.
 */
function shouldSkipToast(options: ToastOptions): boolean {
  const { context, type, showSuccess, showLoading } = options

  // Always show error toasts
  if (type === 'error') return false

  const isBackgroundOrSystem = context === 'background'

  if (type === 'success' && isBackgroundOrSystem && showSuccess !== true) {
    return true
  }

  if (type === 'loading' && isBackgroundOrSystem && showLoading !== true) {
    return true
  }

  return false
}

function filterPromiseMessages<T>(
  messages: ToastPromiseMessages<T>,
  providedOptions?: Partial<ToastOptions>,
): ToastPromiseMessages<T> {
  const options = mergeToastOptions(providedOptions)
  const filteredMessages = {
    loading: !shouldSkipToast({ ...options, type: 'loading' })
      ? messages.loading
      : undefined,
    success: !shouldSkipToast({ ...options, type: 'success' })
      ? messages.success
      : undefined,
    error: !shouldSkipToast({ ...options, type: 'error' })
      ? messages.error
      : undefined,
  }

  return filteredMessages
}

/**
 * Resolves a value or a function with the provided argument.
 * If valueOrFn is a function, calls it with arg; otherwise, returns valueOrFn.
 *
 * @template T, R
 * @param valueOrFn - Value or function to resolve.
 * @param arg - Argument to pass if valueOrFn is a function.
 * @returns The resolved value or undefined.
 */
function resolveValueOrFunction<T, R>(
  valueOrFn: R | ((arg: T) => R) | undefined,
  arg: T,
): R | undefined {
  if (valueOrFn === undefined) return undefined
  if (typeof valueOrFn === 'function') {
    // Type assertion needed for generic function parameter
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return (valueOrFn as (arg: T) => R)(arg)
  }
  return valueOrFn
}

/**
 * Shows a toast with merged options, skipping if context rules apply.
 * @param message The message to display.
 * @param providedOptions Partial toast options.
 * @returns The toast ID, or empty string if skipped.
 */
export function show(
  message: string,
  providedOptions: Partial<ToastOptions>,
): string {
  const options: ToastOptions = mergeToastOptions(providedOptions)
  if (shouldSkipToast(options)) return ''

  const toastItem = createToastItem(message, options)
  registerToast(toastItem)
  return toastItem.id
}

/**
 * Shows an error toast, processing the error for display and truncation.
 *
 * Uses createExpandableErrorData and DEFAULT_ERROR_OPTIONS to ensure consistent error formatting, truncation, and stack display.
 * Error display options can be overridden via providedOptions.
 *
 * @param error - The error to display.
 * @param providedOptions - Partial toast options (except type). Error display options are merged with defaults from errorMessageHandler.ts.
 * @returns The toast ID.
 */
export function showError(
  error: unknown,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
  providedDisplayMessage?: string,
): string {
  vibrate(200)
  setTimeout(() => vibrate(200), 400)
  if (isBackendOutageError(error)) {
    setBackendOutage(true)
    // Show a custom outage toast (pt-BR):
    return show(
      'Falha de conexão com o servidor. Algumas funções podem estar indisponíveis.',
      {
        ...mergeToastOptions({
          ...providedOptions,
          type: 'error',
          context: 'background',
        }),
        duration: 8000,
      },
    )
  }
  const options = mergeToastOptions({ ...providedOptions, type: 'error' })

  // Pass the original error object to preserve stack/context
  const expandableErrorData = createExpandableErrorData(
    error,
    options,
    providedDisplayMessage,
  )

  return show(expandableErrorData.displayMessage, {
    ...options,
    expandableErrorData,
  })
}

/**
 * Shows a success toast.
 *
 * @param message - The message to display.
 * @param providedOptions - Partial toast options (except type).
 * @returns {string} The toast ID.
 */
export function showSuccess(
  message: string,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
): string {
  return show(message, { ...providedOptions, type: 'success' as const })
}

/**
 * Shows a loading toast with infinite duration.
 *
 * @param message - The message to display.
 * @param providedOptions - Partial toast options (except type).
 * @returns {string} The toast ID.
 */
export function showLoading(
  message: string,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
): string {
  return show(message, {
    duration: TOAST_DURATION_INFINITY,
    ...providedOptions,
    type: 'info' as const,
  })
}

/**
 * Shows an info toast.
 *
 * @param message - The message to display.
 * @param providedOptions - Partial toast options (except type).
 * @returns {string} The toast ID.
 */
export function showInfo(
  message: string,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
): string {
  return show(message, { ...providedOptions, type: 'info' as const })
}

function handlePromiseLoading<T>(
  filteredMessages: ToastPromiseMessages<T>,
  providedOptions?: Partial<ToastOptions>,
): string | null {
  if (isNonEmptyString(filteredMessages.loading)) {
    logging.debug(`Promise loading toast: "${filteredMessages.loading}"`)
    return showLoading(filteredMessages.loading, providedOptions)
  } else {
    logging.debug('No loading toast message provided, skipping loading toast')
  }
  return null
}

function handlePromiseSuccess<T>(
  data: T,
  filteredMessages: ToastPromiseMessages<T>,
  providedOptions?: Partial<ToastOptions>,
) {
  const successMsg = resolveValueOrFunction(filteredMessages.success, data)
  if (isNonEmptyString(successMsg)) {
    logging.debug('Showing success toast', { successMsg })
    showSuccess(successMsg, providedOptions)
  } else {
    logging.debug('No success toast message provided, skipping success toast')
  }
}

function handlePromiseError<T>(
  err: unknown,
  filteredMessages: ToastPromiseMessages<T>,
  providedOptions?: Partial<ToastOptions>,
) {
  const errorMsg = resolveValueOrFunction(filteredMessages.error, err)
  if (isNonEmptyString(errorMsg)) {
    logging.debug('Showing error toast with custom message', { errorMsg, err })
    showError(err, providedOptions, errorMsg)
  } else {
    logging.debug('Showing error toast with message from error', { err })
    showError(err, providedOptions)
  }
}

function handleLoadingToastRemoval(loadingToastId: string | null) {
  logging.debug('Removing loading toast', { loadingToastId })
  if (typeof loadingToastId === 'string' && loadingToastId.length > 0) {
    killToast(loadingToastId)
  }
}

/**
 * Handles a promise with context-aware toast notifications for loading, success, and error states.
 * Shows a loading toast while the promise is pending (unless suppressed).
 * Replaces loading with success or error toast on resolution/rejection.
 * Skips toasts in background context unless explicitly enabled.
 * Supports static or function messages for success and error.
 *
 * @template T
 * @param promise - The promise to monitor.
 * @param messages - Toast messages for loading, success, and error. Success and error can be strings or functions.
 * @param options - Additional toast options.
 * @returns {Promise<T>} The resolved value of the promise.
 */
export async function showPromise<T>(
  promise: Promise<T>,
  messages: ToastPromiseMessages<T>,
  providedOptions?: Partial<ToastOptions>,
): Promise<T> {
  const filteredMessages = filterPromiseMessages(messages, providedOptions)

  const loadingToastId = handlePromiseLoading(filteredMessages, providedOptions)
  try {
    const data = await promise
    handlePromiseSuccess(data, filteredMessages, providedOptions)
    return data
  } catch (err) {
    handlePromiseError(err, filteredMessages, providedOptions)
    throw err
  } finally {
    handleLoadingToastRemoval(loadingToastId)
  }
}

/**
 * Merges provided ToastOptions with defaults for the given context.
 * Ensures all required fields are present.
 *
 * @param providedOptions - Partial ToastOptions to override defaults.
 * @returns {ToastOptions} Complete ToastOptions object.
 */
function mergeToastOptions(
  providedOptions?: Partial<ToastOptions>,
): ToastOptions {
  const context = providedOptions?.context ?? DEFAULT_TOAST_CONTEXT
  return {
    ...DEFAULT_TOAST_OPTIONS[context],
    ...providedOptions,
  }
}

// ToastPromiseMessages type for promise-based toast messages
type ToastPromiseMessages<T> = {
  loading?: string
  success?: string | ((data: T) => string)
  error?: string | ((error: unknown) => string)
}
