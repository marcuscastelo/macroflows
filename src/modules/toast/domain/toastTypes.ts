/**
 * Toast System Configuration
 *
 * Defines the core types and configuration options for the intelligent toast system.
 */

/**
 * Special duration value for infinite toast duration (manual dismiss only)
 */
export const TOAST_DURATION_INFINITY = Infinity

/**
 * ToastContext defines the origin of the event that triggered the toast.
 * - 'user-action': Direct user interaction (e.g., button click, form submit)
 * - 'background': Automatic/background operations (e.g., sync, bootstrap, polling)
 */
export type ToastContext = 'user-action' | 'background'

/**
 * ToastType defines the type of toast notification.
 * - 'success': Indicates a successful operation
 * - 'loading': Indicates a loading or pending operation
 * - 'error': Indicates an error or failure
 * - 'info': Indicates informational message
 */
export type ToastType = 'success' | 'loading' | 'error' | 'info'

/**
 * ToastOptions configures the display behavior of a toast notification.
 * @property context The origin of the event that triggered the toast
 * @property type The type of the toast
 * @property duration Auto-dismiss timeout in milliseconds
 * @property dismissible Whether this toast can be dismissed by the user
 * @property showLoading Whether to show a loading toast for promises
 * @property showSuccess Whether to show a success toast for promises
 * @property maxLength Maximum length for toast messages before truncation
 * @property preserveLineBreaks Whether to preserve line breaks in error messages
 * @property truncationSuffix Suffix to append to truncated error messages
 * @property includeStack Whether to include stack trace in error details
 * @property expandableErrorData Data for expandable error toasts
 */
export type ToastOptions = {
  context: ToastContext
  type: ToastType
  duration: number
  dismissible: boolean
  showLoading: boolean
  showSuccess: boolean
  maxLength: number
  preserveLineBreaks: boolean
  truncationSuffix: string
  includeStack: boolean
  expandableErrorData: ToastExpandableErrorData | null
}

/**
 * ToastExpandableErrorData contains processed fields for expandable error messages.
 * @property displayMessage The message to display in the toast
 * @property isTruncated Whether the message was truncated
 * @property originalMessage The original, untruncated message
 * @property errorDetails The error details object
 * @property canExpand Whether the error message can be expanded
 */
export type ToastExpandableErrorData = {
  displayMessage: string
  isTruncated: boolean
  originalMessage: string
  errorDetails: ToastError
  canExpand: boolean
}

/**
 * DEFAULT_TOAST_CONTEXT defines the default context for toasts.
 */
export const DEFAULT_TOAST_CONTEXT: ToastContext = 'user-action'

/**
 * DEFAULT_TOAST_OPTIONS provides default options for each context.
 */
export const DEFAULT_TOAST_OPTIONS: Record<ToastContext, ToastOptions> = {
  'user-action': {
    showLoading: false,
    showSuccess: false,
    maxLength: 100,
    duration: 3000,
    dismissible: true,
    context: 'user-action',
    type: 'info',
    preserveLineBreaks: false,
    truncationSuffix: '...',
    includeStack: true,
    expandableErrorData: null,
  },
  background: {
    showLoading: false,
    showSuccess: false,
    maxLength: 150,
    duration: 2000,
    dismissible: true,
    context: 'background',
    type: 'info',
    preserveLineBreaks: false,
    truncationSuffix: '...',
    includeStack: true,
    expandableErrorData: null,
  },
}

/**
 * TOAST_PRIORITY defines priority levels for toast queue management.
 * Higher numbers = higher priority.
 */
export const TOAST_PRIORITY: Record<ToastType, number> = {
  error: 4,
  info: 2,
  success: 1,
  loading: 0,
}

/**
 * ToastItem represents a toast in the queue.
 *
 * @property id - Unique identifier for the toast
 * @property message - The message to display
 * @property options - Toast display options
 * @property timestamp - Creation timestamp
 * @property priority - Toast priority for queue management
 * @property displayedAt - Timestamp when toast was displayed (for auto-dismiss timing)
 */
export type ToastItem = {
  id: string
  message: string
  options: ToastOptions
  timestamp: number
  priority: number
}

/**
 * ToastError contains error details for expandable error messages.
 *
 * @property message - Error message
 * @property fullError - Full error string
 * @property stack - Optional stack trace
 * @property context - Optional error context
 * @property timestamp - Optional error timestamp
 */
export type ToastError = {
  message: string
  fullError: string
  stack?: string
  context?: Record<string, unknown>
  timestamp?: number
}

export function createToastItem(
  message: string,
  options: ToastItem['options'],
): ToastItem {
  return {
    id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    message,
    options,
    timestamp: Date.now(),
    priority: TOAST_PRIORITY[options.type],
  }
}
