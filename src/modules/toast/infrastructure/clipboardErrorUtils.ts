/**
 * Utilities for formatting and copying error details to clipboard.
 * Shared between ExpandableErrorToast and ErrorDetailModal.
 */
import { TOAST_MESSAGES } from '~/modules/toast/domain/toastMessages'
import { type ToastError } from '~/modules/toast/domain/toastTypes'
import { useClipboard } from '~/sections/common/hooks/useClipboard'
import { createErrorHandler } from '~/shared/error/errorHandler'

/**
 * Context for clipboard error operations.
 * @property component The component name.
 * @property operation The operation being performed.
 */
type ClipboardErrorContext = { component: string; operation: string }

/**
 * Formats error details for copying to clipboard.
 * @param errorDetails The error details to format.
 * @returns A formatted string for clipboard.
 */
const errorHandler = createErrorHandler('infrastructure', 'Toast')

export function formatErrorForClipboard(errorDetails: ToastError): string {
  const sections: string[] = []
  if (
    typeof errorDetails.message === 'string' &&
    errorDetails.message.trim() !== ''
  ) {
    sections.push(`${TOAST_MESSAGES.ERROR_TITLE}: ${errorDetails.message}`)
  }
  if (
    typeof errorDetails.fullError === 'string' &&
    errorDetails.fullError.trim() !== '' &&
    errorDetails.fullError !== errorDetails.message
  ) {
    sections.push(`${TOAST_MESSAGES.SHOW_DETAILS}: ${errorDetails.fullError}`)
  }
  if (errorDetails.context && Object.keys(errorDetails.context).length > 0) {
    sections.push(
      `${TOAST_MESSAGES.COPY_ERROR}: ${JSON.stringify(
        errorDetails.context,
        null,
        2,
      )}`,
    )
  }
  if (
    typeof errorDetails.stack === 'string' &&
    errorDetails.stack.trim() !== ''
  ) {
    sections.push(`Stack Trace:\n${errorDetails.stack}`)
  }
  if (
    typeof errorDetails.timestamp === 'number' &&
    !isNaN(errorDetails.timestamp) &&
    errorDetails.timestamp > 0
  ) {
    sections.push(
      `Timestamp: ${new Date(errorDetails.timestamp).toISOString()}`,
    )
  }
  return `Error Report - ${new Date().toISOString()}\n` + sections.join('\n')
}

/**
 * Handles copying error details to clipboard and error reporting.
 * @param errorDetails The error details to copy.
 * @param context The context for error handling.
 */
// TODO: use _context
export async function handleCopyErrorToClipboard(
  errorDetails: ToastError,
  _context: ClipboardErrorContext,
) {
  const { write } = useClipboard()
  const clipboardContent = formatErrorForClipboard(errorDetails)
  write(clipboardContent, (error) => {
    if (error !== null) {
      errorHandler.error(error)
    }
  })
}
