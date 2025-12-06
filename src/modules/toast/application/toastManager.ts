/**
 * Toast Manager (DI-friendly)
 *
 * This file exposes a factory `createToastManager()` that returns the toast API,
 * and keeps a backward-compatible shim that exports the original functions.
 *
 * The factory allows injecting overrides (for testing or container wiring).
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
import { isBackendOutageError } from '~/shared/utils/errorUtils'
import { isNonEmptyString } from '~/shared/utils/isNonEmptyString'
import { logging } from '~/shared/utils/logging'
import { vibrate } from '~/shared/utils/vibrate'

/**
 * ToastPromiseMessages type used by showPromise
 */
type ToastPromiseMessages<T> = {
  loading?: string
  success?: string | ((data: T) => string)
  error?: string | ((error: unknown) => string)
}

/**
 * Factory that creates the toast manager API.
 *
 * Accepts optional overrides for helper functions so the manager can be wired
 * from a DI container or tested with fakes.
 */
export function createToastManager(deps?: {
  killToast?: typeof killToast
  registerToast?: typeof registerToast
  createExpandableErrorData?: typeof createExpandableErrorData
  createToastItem?: typeof createToastItem
  DEFAULT_TOAST_OPTIONS?: typeof DEFAULT_TOAST_OPTIONS
  DEFAULT_TOAST_CONTEXT?: typeof DEFAULT_TOAST_CONTEXT
  TOAST_DURATION_INFINITY?: typeof TOAST_DURATION_INFINITY
  isBackendOutageError?: typeof isBackendOutageError
  setBackendOutage?: typeof setBackendOutage
  isNonEmptyString?: typeof isNonEmptyString
  logging?: typeof logging
  vibrate?: typeof vibrate
}) {
  const {
    killToast: _killToast = (...args: Parameters<typeof killToast>) =>
      killToast(...args),
    registerToast: _registerToast = (
      ...args: Parameters<typeof registerToast>
    ) => registerToast(...args),
    createExpandableErrorData: _createExpandableErrorData = (
      ...args: Parameters<typeof createExpandableErrorData>
    ) => createExpandableErrorData(...args),
    createToastItem: _createToastItem = (
      ...args: Parameters<typeof createToastItem>
    ) => createToastItem(...args),
    DEFAULT_TOAST_OPTIONS: _DEFAULT_TOAST_OPTIONS = DEFAULT_TOAST_OPTIONS,
    DEFAULT_TOAST_CONTEXT: _DEFAULT_TOAST_CONTEXT = DEFAULT_TOAST_CONTEXT,
    TOAST_DURATION_INFINITY: _TOAST_DURATION_INFINITY = TOAST_DURATION_INFINITY,
    isBackendOutageError: _isBackendOutageError = (
      ...args: Parameters<typeof isBackendOutageError>
    ) => isBackendOutageError(...args),
    setBackendOutage: _setBackendOutage = (
      ...args: Parameters<typeof setBackendOutage>
    ) => setBackendOutage(...args),
    isNonEmptyString: _isNonEmptyString = (
      ...args: Parameters<typeof isNonEmptyString>
    ) => isNonEmptyString(...args),
    logging: _logging = logging,
    vibrate: _vibrate = (...args: Parameters<typeof vibrate>) =>
      vibrate(...args),
  } = deps ?? {}

  function shouldSkipToast(options: ToastOptions): boolean {
    const { context, type, showSuccess, showLoading } = options

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

  function mergeToastOptions(
    providedOptions?: Partial<ToastOptions>,
  ): ToastOptions {
    const context = providedOptions?.context ?? _DEFAULT_TOAST_CONTEXT
    return {
      ..._DEFAULT_TOAST_OPTIONS[context],
      ...providedOptions,
    }
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

  function show(
    message: string,
    providedOptions: Partial<ToastOptions>,
  ): string {
    const options: ToastOptions = mergeToastOptions(providedOptions)
    if (shouldSkipToast(options)) return ''

    const toastItem = _createToastItem(message, options)
    _registerToast(toastItem)
    return toastItem.id
  }

  function showError(
    error: unknown,
    providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
    providedDisplayMessage?: string,
  ): string {
    _vibrate(200)
    setTimeout(() => _vibrate(200), 400)

    if (_isBackendOutageError(error)) {
      _setBackendOutage(true)
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

    const expandableErrorData = _createExpandableErrorData(
      error,
      options,
      providedDisplayMessage,
    )

    return show(expandableErrorData.displayMessage, {
      ...options,
      expandableErrorData,
    })
  }

  function showSuccess(
    message: string,
    providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
  ): string {
    return show(message, { ...providedOptions, type: 'success' })
  }

  function showLoading(
    message: string,
    providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
  ): string {
    return show(message, {
      duration: _TOAST_DURATION_INFINITY,
      ...providedOptions,
      type: 'info',
    })
  }

  function showInfo(
    message: string,
    providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
  ): string {
    return show(message, { ...providedOptions, type: 'info' })
  }

  function handlePromiseLoading<T>(
    filteredMessages: ToastPromiseMessages<T>,
    providedOptions?: Partial<ToastOptions>,
  ): string | null {
    if (_isNonEmptyString(filteredMessages.loading)) {
      _logging.debug(`Promise loading toast: "${filteredMessages.loading}"`)
      return showLoading(filteredMessages.loading!, providedOptions)
    } else {
      _logging.debug(
        'No loading toast message provided, skipping loading toast',
      )
    }
    return null
  }

  function handlePromiseSuccess<T>(
    data: T,
    filteredMessages: ToastPromiseMessages<T>,
    providedOptions?: Partial<ToastOptions>,
  ) {
    const successMsg = resolveValueOrFunction(filteredMessages.success, data)
    if (_isNonEmptyString(successMsg)) {
      _logging.debug('Showing success toast', { successMsg })
      showSuccess(successMsg!, providedOptions)
    } else {
      _logging.debug(
        'No success toast message provided, skipping success toast',
      )
    }
  }

  function handlePromiseError<T>(
    err: unknown,
    filteredMessages: ToastPromiseMessages<T>,
    providedOptions?: Partial<ToastOptions>,
  ) {
    const errorMsg = resolveValueOrFunction(filteredMessages.error, err)
    if (_isNonEmptyString(errorMsg)) {
      _logging.debug('Showing error toast with custom message', {
        errorMsg,
        err,
      })
      showError(err, providedOptions, errorMsg)
    } else {
      _logging.debug('Showing error toast with message from error', { err })
      showError(err, providedOptions)
    }
  }

  function handleLoadingToastRemoval(loadingToastId: string | null) {
    _logging.debug('Removing loading toast', { loadingToastId })
    if (typeof loadingToastId === 'string' && loadingToastId.length > 0) {
      _killToast(loadingToastId)
    }
  }

  async function showPromise<T>(
    promise: Promise<T>,
    messages: ToastPromiseMessages<T>,
    providedOptions?: Partial<ToastOptions>,
  ): Promise<T> {
    const filteredMessages = filterPromiseMessages(messages, providedOptions)

    const loadingToastId = handlePromiseLoading(
      filteredMessages,
      providedOptions,
    )
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

  return {
    show,
    showError,
    showSuccess,
    showLoading,
    showInfo,
    showPromise,
  }
}

/**
 * Backward-compatible wrappers that call a fresh manager on each invocation.
 *
 * We call `createToastManager()` at call time (not at module initialization)
 * so test-time spies/mocks that replace the underlying helpers (like
 * `registerToast` / `killToast`) are respected by the manager.
 */
export function show(
  message: string,
  providedOptions: Partial<ToastOptions>,
): string {
  return createToastManager().show(message, providedOptions)
}

export function showError(
  error: unknown,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
  providedDisplayMessage?: string,
): string {
  return createToastManager().showError(
    error,
    providedOptions,
    providedDisplayMessage,
  )
}

export function showSuccess(
  message: string,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
): string {
  return createToastManager().showSuccess(message, providedOptions)
}

export function showLoading(
  message: string,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
): string {
  return createToastManager().showLoading(message, providedOptions)
}

export function showInfo(
  message: string,
  providedOptions?: Omit<Partial<ToastOptions>, 'type'>,
): string {
  return createToastManager().showInfo(message, providedOptions)
}

export async function showPromise<T>(
  promise: Promise<T>,
  messages: ToastPromiseMessages<T>,
  providedOptions?: Partial<ToastOptions>,
): Promise<T> {
  return createToastManager().showPromise(promise, messages, providedOptions)
}
