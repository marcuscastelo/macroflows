/**
 * Expandable Error Toast Component
 *
 * A SolidJS component for displaying error messages with a "Show Details" option
 * that opens a modal with full error information.
 */

import toast from 'solid-toast'

import { killToast } from '~/modules/toast/application/toastQueue'
import { TOAST_MESSAGES } from '~/modules/toast/domain/toastMessages'
import {
  type ToastError,
  type ToastItem,
  type ToastType,
} from '~/modules/toast/domain/toastTypes'
import { modalManager } from '~/shared/modal/core/modalManager'

/**
 * Props for ExpandableToast component.
 */
type ExpandableToastProps = {
  message: string
  isTruncated: boolean
  originalMessage: string
  errorDetails: ToastError
  canExpand: boolean
  onDismiss?: () => void
  type: ToastType
}

// Fallback error details for missing or incomplete error data
const FALLBACK_ERROR_DETAILS: ToastError = {
  message: TOAST_MESSAGES.FALLBACK_ERROR_DETAILS,
  stack: '',
  context: {},
  timestamp: Date.now(),
  fullError: '',
}

/**
 * Props for ExpandableToastContent component.
 */
type ExpandableToastContentProps = {
  message: string
  isTruncated: boolean
  originalMessage: string
  canExpand: boolean
  errorDetails: ToastError
  type: ToastType
}

/**
 * Expandable Error Toast Component.
 *
 * Shows a truncated error message with an option to open a modal with details.
 * @param props ExpandableToastProps
 */
export function ExpandableToast(props: ExpandableToastProps) {
  const handleDismiss = () => {
    if (props.onDismiss) {
      props.onDismiss()
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      class="relative flex flex-col border-2 border-gray-600 text-gray-100 bg-gray-800 shadow-[0_3px_10px_rgba(0,0,0,0.1),0_3px_3px_rgba(0,0,0,0.05)] max-w-[350px] pointer-events-auto px-[10px] pr-6 py-2 rounded line-height-[1.3]"
    >
      <button
        type="button"
        onClick={handleDismiss}
        title="Dismiss"
        aria-label="Dismiss"
        class="absolute top-2 right-2 text-lg text-gray-400 hover:text-gray-200 z-10 cursor-pointer"
      >
        <span class="sr-only">Fechar</span>✕
      </button>
      <ExpandableToastContent
        message={props.message}
        isTruncated={props.isTruncated}
        originalMessage={props.originalMessage}
        canExpand={props.canExpand}
        errorDetails={props.errorDetails}
        type={props.type}
      />
    </div>
  )
}

/**
 * Display an expandable error toast using solid-toast directly.
 * This function is called from the toast queue system.
 * @param toastItem The toast item to display.
 * @returns The solid-toast ID.
 */
export function displayExpandableErrorToast(toastItem: ToastItem): string {
  return toast.custom(
    () => (
      <ExpandableToast
        message={
          toastItem.options.expandableErrorData?.displayMessage ??
          toastItem.message
        }
        isTruncated={
          toastItem.options.expandableErrorData?.isTruncated ?? false
        }
        originalMessage={
          toastItem.options.expandableErrorData?.originalMessage ?? ''
        }
        errorDetails={
          toastItem.options.expandableErrorData?.errorDetails ??
          FALLBACK_ERROR_DETAILS
        }
        canExpand={toastItem.options.expandableErrorData?.canExpand ?? false}
        onDismiss={() => {
          killToast(toastItem.id)
        }}
        type={toastItem.options.type}
      />
    ),
    {
      duration: toastItem.options.duration,
    },
  )
}

/**
 * Success Checkmark Icon Component
 *
 * A SolidJS component for displaying a checkmark icon with animation.
 */
function SuccessCheckmarkIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="1.25rem"
      height="1.25rem"
      class="overflow-visible"
    >
      {/* Animated green circle */}
      <circle cx="16" cy="16" r="0" fill="#34C759">
        <animate
          attributeName="opacity"
          values="0; 1; 1"
          dur="0.35s"
          begin="100ms"
          fill="freeze"
        />
        <animate
          attributeName="r"
          values="0; 17.5; 16"
          dur="0.35s"
          begin="100ms"
          fill="freeze"
        />
      </circle>
      {/* Expanding green background */}
      <circle cx="16" cy="16" r="12" opacity="0" fill="#34C759">
        <animate
          attributeName="opacity"
          values="1; 0"
          dur="1s"
          begin="350ms"
          fill="freeze"
        />
        <animate
          attributeName="r"
          values="12; 26"
          dur="1s"
          begin="350ms"
          fill="freeze"
        />
      </circle>
      {/* White checkmark */}
      <path
        fill="none"
        stroke-width="4"
        stroke-dasharray="22"
        stroke-dashoffset="22"
        stroke-linecap="round"
        stroke-miterlimit="10"
        d="M9.8,17.2l3.8,3.6c0.1,0.1,0.3,0.1,0.4,0l9.6-9.7"
        stroke="#FCFCFC"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="22;0"
          dur="0.25s"
          begin="250ms"
          fill="freeze"
        />
      </path>
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="1.25rem"
      height="1.25rem"
      class="overflow-visible"
    >
      {/* Animated red circle */}
      <circle cx="16" cy="16" r="0" fill="#FF3B30">
        <animate
          attributeName="opacity"
          values="0; 1; 1"
          dur="0.35s"
          begin="100ms"
          fill="freeze"
          calcMode="spline"
          keyTimes="0; 0.6; 1"
          keySplines="0.25 0.71 0.4 0.88; .59 .22 .87 .63"
        />
        <animate
          attributeName="r"
          values="0; 17.5; 16"
          dur="0.35s"
          begin="100ms"
          fill="freeze"
          calcMode="spline"
          keyTimes="0; 0.6; 1"
          keySplines="0.25 0.71 0.4 0.88; .59 .22 .87 .63"
        />
      </circle>
      {/* Expanding red background */}
      <circle cx="16" cy="16" r="12" opacity="0" fill="#FF3B30">
        <animate
          attributeName="opacity"
          values="1; 0"
          dur="1s"
          begin="320ms"
          fill="freeze"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.0 0.0 0.2 1"
        />
        <animate
          attributeName="r"
          values="12; 26"
          dur="1s"
          begin="320ms"
          fill="freeze"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.0 0.0 0.2 1"
        />
      </circle>
      {/* White exclamation mark */}
      <path
        fill="none"
        stroke-width="4"
        stroke-dasharray="9"
        stroke-dashoffset="9"
        stroke-linecap="round"
        d="M16,7l0,9"
        stroke="#FFFFFF"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="9;0"
          dur="0.2s"
          begin="250ms"
          fill="freeze"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.0, 0.0, 0.58, 1.0"
        />
      </path>
      <circle cx="16" cy="23" r="2.5" opacity="0" fill="#FFFFFF">
        <animate
          attributeName="opacity"
          values="0;1"
          dur="0.25s"
          begin="350ms"
          fill="freeze"
          calcMode="spline"
          keyTimes="0; 1"
          keySplines="0.0, 0.0, 0.58, 1.0"
        />
      </circle>
    </svg>
  )
}

/**
 * Toast Content Component
 *
 * A SolidJS component for displaying the content of the toast.
 */
function ExpandableToastContent(props: ExpandableToastContentProps) {
  const handleShowDetails = () => {
    modalManager.openModal({
      type: 'error',
      title: 'Error Details',
      errorDetails: props.errorDetails,
      priority: 'high',
      closeOnOutsideClick: true,
      closeOnEscape: true,
      showCloseButton: true,
    })
  }
  return (
    <div class="flex flex-col flex-1 mx-[10px] my-1">
      <div class="flex items-center gap-2">
        {props.type === 'error' ? <ErrorIcon /> : <SuccessCheckmarkIcon />}
        <span class="whitespace-pre-line">{props.message}</span>
      </div>
      <div class={props.canExpand ? 'flex gap-2 mt-2' : 'hidden'}>
        <button
          type="button"
          class="px-2 py-1 rounded bg-gray-700 text-gray-100 text-xs hover:bg-gray-600 transition-colors"
          onClick={handleShowDetails}
          aria-label="Show error details"
        >
          {TOAST_MESSAGES.SHOW_DETAILS}
        </button>
      </div>
    </div>
  )
}
