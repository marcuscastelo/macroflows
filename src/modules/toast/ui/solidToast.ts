import toast from 'solid-toast'

import { type ToastItem } from '~/modules/toast/domain/toastTypes'
import { displayExpandableErrorToast } from '~/modules/toast/ui/ExpandableErrorToast'
import { createErrorHandler } from '~/shared/error/errorHandler'

/**
 * Displays a toast in solid-toast with the appropriate styling.
 * @param toastItem The toast item to display.
 * @returns The solid-toast ID for later dismissal.
 */
const errorHandler = createErrorHandler('infrastructure', 'Toast')

export function displaySolidToast(toastItem: ToastItem): string {
  const { message, options } = toastItem
  const { type, expandableErrorData, duration } = options
  let solidToastId: string

  // Check if this is an expandable error toast
  if (expandableErrorData && type === 'error') {
    // Use the displayExpandableErrorToast function directly
    solidToastId = displayExpandableErrorToast(toastItem)
    return solidToastId
  }

  // Prepare solid-toast options with duration
  const solidToastOptions = {
    duration,
  }

  // Standard toast rendering
  switch (type) {
    case 'success':
      solidToastId = toast.success(message, solidToastOptions)
      break
    case 'error':
      solidToastId = toast.error(message, solidToastOptions)
      break
    case 'loading':
      solidToastId = toast.loading(message, {
        ...solidToastOptions,
        duration: 0, // Loading toasts should not auto-dismiss
      })
      break
    case 'info':
      solidToastId = toast(message, solidToastOptions)
      break
    default:
      ;((_: never) => _)(type) // TODO: Create a better function for exhaustive checks
      errorHandler.error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        new Error(`Unknown toast type: ${type}`),
        {
          additionalData: { type, message },
        },
      )
      return ''
  }

  return solidToastId
}

/**
 * Dismisses a toast by its solid-toast ID.
 * @param solidToastId The solid-toast ID to dismiss.
 */
export function dismissSolidToast(solidToastId: string): void {
  toast.dismiss(solidToastId)
}
