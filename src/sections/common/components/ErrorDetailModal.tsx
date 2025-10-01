/**
 * Error Detail Modal Component
 *
 * A modal component that displays detailed error information,
 * allowing users to view full stack traces and copy error details.
 */

import { createSignal, Show } from 'solid-js'
import { Portal } from 'solid-js/web'

import { type ToastError } from '~/modules/toast/domain/toastTypes'
import { handleCopyErrorToClipboard } from '~/modules/toast/infrastructure/clipboardErrorUtils'

export type ErrorDetailModalProps = {
  /** The error details to display */
  errorDetails: ToastError
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when the modal is closed */
  onClose: () => void
}

/**
 * Modal component for displaying detailed error information
 */
export function ErrorDetailModal(props: ErrorDetailModalProps) {
  const [isCopied, setIsCopied] = createSignal(false)

  const handleCopy = async () => {
    await handleCopyErrorToClipboard(props.errorDetails, {
      component: 'ErrorDetailModal',
      operation: 'handleCopy',
    })
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          class="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-detail-modal-title"
        >
          {/* Backdrop */}
          <div
            class="fixed inset-0 bg-black/60 transition-opacity dark:bg-slate-900/80"
            onClick={() => props.onClose()}
            aria-hidden="true"
          />

          {/* Modal */}
          <div class="flex min-h-full items-center justify-center">
            <div class="relative border-2 border-gray-600 p-1 bg-[#1f2937] text-[#f3f4f6] rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-hidden m-4">
              {/* Header */}
              <div class="bg-slate-900 px-6 py-4 border-b border-red-700 dark:bg-slate-800 dark:border-red-800">
                <div class="flex items-center justify-between">
                  <h3
                    id="error-detail-modal-title"
                    class="text-lg font-medium text-red-400 flex items-center"
                  >
                    <svg
                      class="h-5 w-5 text-red-500 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Error Details
                  </h3>
                  <button
                    type="button"
                    class="text-red-400 hover:text-red-500 focus:outline-hidden"
                    onClick={() => props.onClose()}
                  >
                    <span class="sr-only">Close</span>
                    <svg
                      class="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {/* Main error message */}
                <div class="mb-4">
                  <h4 class="font-medium text-red-300 mb-1">Error Message</h4>
                  <div class="bg-slate-900 text-red-200 p-3 rounded-md dark:bg-slate-800">
                    {props.errorDetails.message}
                  </div>
                </div>

                {/* Full error if available and different */}
                <Show
                  when={
                    typeof props.errorDetails.fullError === 'string' &&
                    props.errorDetails.fullError.trim() !== '' &&
                    props.errorDetails.fullError !== props.errorDetails.message
                  }
                >
                  <div class="mb-4">
                    <h4 class="font-medium text-red-300 mb-1">Full Error</h4>
                    <div class="bg-slate-900 text-red-200 p-3 rounded-md whitespace-pre-wrap dark:bg-slate-800">
                      {props.errorDetails.fullError}
                    </div>
                  </div>
                </Show>

                {/* Context information if available */}
                <Show
                  when={
                    props.errorDetails.context &&
                    Object.keys(props.errorDetails.context).length > 0
                  }
                >
                  <div class="mb-4">
                    <h4 class="font-medium text-blue-300 mb-1">
                      Context Information
                    </h4>
                    <pre class="bg-slate-900 text-blue-200 p-3 rounded-md text-sm overflow-x-auto dark:bg-slate-800">
                      {JSON.stringify(props.errorDetails.context, null, 2)}
                    </pre>
                  </div>
                </Show>
                {/* Stack trace if available */}
                <Show
                  when={
                    typeof props.errorDetails.stack === 'string' &&
                    props.errorDetails.stack.trim() !== ''
                  }
                >
                  <div class="mb-4">
                    <h4 class="font-medium text-yellow-300 mb-1">
                      Stack Trace
                    </h4>
                    <pre class="bg-slate-900 text-yellow-200 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap dark:bg-slate-800">
                      {props.errorDetails.stack}
                    </pre>
                  </div>
                </Show>

                {/* Timestamp if available */}
                <Show when={props.errorDetails.timestamp}>
                  <div class="text-sm text-gray-400">
                    Occurred at:{' '}
                    {typeof props.errorDetails.timestamp === 'number'
                      ? new Date(props.errorDetails.timestamp).toLocaleString()
                      : 'Unknown'}
                  </div>
                </Show>
              </div>

              {/* Footer with actions */}
              <div class="bg-slate-900 px-6 py-3 flex justify-end border-t border-red-800 dark:bg-slate-800">
                <button
                  type="button"
                  class="mr-2 inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-slate-800 hover:bg-slate-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                  onClick={() => void handleCopy()}
                >
                  <Show
                    when={isCopied()}
                    fallback={
                      <>
                        <svg
                          class="mr-1.5 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy to Clipboard
                      </>
                    }
                  >
                    <>
                      <svg
                        class="mr-1.5 h-4 w-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span class="text-green-400">Copied!</span>
                    </>
                  </Show>
                </button>
                <button
                  type="button"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-400 cursor-pointer"
                  onClick={() => props.onClose()}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  )
}
