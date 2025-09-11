/**
 * Error boundary component for modal content.
 * Catches and displays errors that occur during modal rendering.
 */

import type { JSXElement } from 'solid-js'
import { ErrorBoundary } from 'solid-js'

import { showError } from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

/**
 * Error fallback component displayed when modal content fails to render.
 */
function ModalErrorFallback(error: Error, _reset: () => void) {
  // Handle the error using logging system
  logging.error('Modal Error:', error)
  showError(error, {}, `Modal Error`)

  return (
    <div class="alert alert-error">
      <svg
        class="stroke-current shrink-0 w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <h3 class="font-bold">Modal Content Error</h3>
        <div class="text-xs">
          An error occurred while loading the modal content. Please try again.
        </div>
      </div>
    </div>
  )
}

/**
 * Modal error boundary component.
 * Wraps modal content to catch and handle rendering errors.
 */

export function ModalErrorBoundary(props: {
  children: JSXElement
  modalId?: string
}) {
  return (
    <ErrorBoundary fallback={ModalErrorFallback}>
      {props.children}
    </ErrorBoundary>
  )
}
