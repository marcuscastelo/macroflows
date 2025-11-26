/**
 * Toast Queue Manager
 *
 * Manages a queue of toasts to ensure only one toast is visible at a time,
 * with intelligent prioritization and deduplication.
 * Uses a fixed 100ms setInterval for processing instead of dynamic timeouts.
 */

import { createEffect, createSignal } from 'solid-js'

import {
  TOAST_DURATION_INFINITY,
  type ToastItem,
} from '~/modules/toast/domain/toastTypes'
import {
  dismissSolidToast,
  displaySolidToast,
} from '~/modules/toast/ui/solidToast'
import { logging } from '~/shared/utils/logging'

// Global queue state
const [paused, setPaused] = createSignal(true)
const pauseProcess = () => setPaused(true)
const resumeProcess = () => setPaused(false)

const [queue, setQueue] = createSignal<ToastItem[]>([])
const enqueue = (toastItem: ToastItem) =>
  setQueue((prevQueue) => [...prevQueue, toastItem])
const dequeue = (id: ToastItem['id']) =>
  setQueue((prevQueue) => prevQueue.filter((toast) => toast.id !== id))

type ToastItemWithDismiss = ToastItem & {
  dismiss: () => void
}

const [visibleToasts, setVisibleToasts] = createSignal<ToastItemWithDismiss[]>(
  [],
)
const addToVisibleToasts = (toastItem: ToastItemWithDismiss) =>
  setVisibleToasts((prev) => [...prev, toastItem])
const removeFromVisibleToasts = (id: ToastItemWithDismiss['id']) =>
  setVisibleToasts((prev) => prev.filter((toast) => toast.id !== id))
const findInVisibleToasts = (id: ToastItemWithDismiss['id']) =>
  visibleToasts().find((toast) => toast.id === id) ?? null

createEffect(() => {
  logging.debug('Initialized')
  setTimeout(() => {
    resumeProcess()
  }, 100) // Initial delay to allow setup
})

createEffect(() => {
  logging.debug(paused() ? 'Paused' : 'Resumed')
})

createEffect(() => {
  const currentVisibleToasts = visibleToasts()
  logging.debug(`Current visibleToasts length: ${currentVisibleToasts.length}`)
})

// Auto-process queue when needed (immediate processing for new toasts)
createEffect(() => {
  const currentQueue = queue()
  if (paused()) {
    return
  }
  logging.debug(`Effect: Checking queue: ${currentQueue.length} items`)
  if (currentQueue.length === 0) {
    logging.debug('Effect: No toasts to process')
    return
  }

  const [toastItem, ...restQueue] = currentQueue
  if (toastItem !== undefined) void processToastItem(toastItem)
  setQueue(restQueue)
})

async function processToastItem(toastItem: ToastItem) {
  // Actually display the toast and store solid-toast ID in the queue item
  logging.debug(`Display toast: "${toastItem.message}", ID: ${toastItem.id}`)
  const solidToastId = displaySolidToast(toastItem)

  let timeoutId: NodeJS.Timeout | null = null
  const dismiss = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    logging.debug(`Dismiss toast: "${toastItem.message}", ID: ${toastItem.id}`)
    dismissSolidToast(solidToastId)
    removeFromVisibleToasts(toastItem.id)
    resumeProcess()
  }

  const duration = toastItem.options.duration
  pauseProcess()
  if (duration !== TOAST_DURATION_INFINITY) {
    timeoutId = setTimeout(() => {
      dismiss()
    }, toastItem.options.duration)
  }

  addToVisibleToasts({
    ...toastItem,
    dismiss,
  })
}

/**
 * Registers a toast item (enqueue and process).
 * @param toastItem The toast item to register.
 */
export function registerToast(toastItem: ToastItem): void {
  if (isDuplicateToast(toastItem)) {
    logging.debug(
      `Duplicate toast detected: "${toastItem.message}", ID: ${toastItem.id}`,
      toastItem,
    )
    return
  }
  // TODO: Implement priority sorting if needed (avoid infinite loading toasts preventing others)
  logging.debug(
    `Registering toast: "${toastItem.message}", ID: ${toastItem.id}\n\tDetails:`,
    toastItem,
  )
  enqueue(toastItem)
}

/**
 * Kills (removes) a toast by ID, dismissing it if visible.
 * @param id The ID of the toast to kill.
 */
export function killToast(id: ToastItem['id']): void {
  logging.debug('Killing toast:', { id })
  dequeue(id)
  const toastInVisibleToasts = findInVisibleToasts(id) // Check if it's visible
  if (toastInVisibleToasts) {
    toastInVisibleToasts.dismiss()
  }
}

/**
 * Checks if two toasts are duplicates based on deduplication key or message + type.
 */
function areToastsDuplicates(
  toast: ToastItem,
  newToast: ToastItem,
  newDeduplicationKey: string | null,
): boolean {
  // If both toasts have deduplication keys, use those for comparison
  if (newDeduplicationKey !== null && toast.options.deduplicationKey !== null) {
    return (
      toast.options.deduplicationKey === newDeduplicationKey &&
      toast.options.type === newToast.options.type
    )
  }
  // Otherwise, fall back to message + type comparison
  return (
    toast.message === newToast.message &&
    toast.options.type === newToast.options.type
  )
}

/**
 * Check for duplicate messages to avoid spam.
 * Uses deduplicationKey when available, otherwise falls back to message + type comparison.
 */
function isDuplicateToast(newToast: ToastItem): boolean {
  const newDeduplicationKey = newToast.options.deduplicationKey

  // Check if a toast with the same deduplication key or message+type is currently visible
  if (
    visibleToasts().some((toast) =>
      areToastsDuplicates(toast, newToast, newDeduplicationKey),
    )
  ) {
    return true
  }

  // Check if a toast with the same deduplication key or message+type is already in the queue
  if (
    queue().some((toast) =>
      areToastsDuplicates(toast, newToast, newDeduplicationKey),
    )
  ) {
    return true
  }

  return false
}

/**
 * Sort toasts by priority (higher priority first)
 */
// function sortByPriority(toasts: ToastItem[]): ToastItem[] {
//   return [...toasts].sort((a, b) => b.priority - a.priority)
// }

/**
 * Pop and display the next toast in the queue, respecting its duration
 */
export function popAndDisplayToast(): void {
  const currentQueue = queue()
  if (currentQueue.length === 0) return

  const toast = currentQueue[0]
  if (!toast) return

  // Remove the toast from the queue
  setQueue(currentQueue.slice(1))

  displaySolidToast(toast)
}

// /**
//  * Remove current toast and mark transition time
//  */
// function removeCurrentToast(): void {
//   const current = currentToast()
//   if (current !== null) {
//     logging.debug('[ToastQueue] Removing current toast:', current.message)

//     // Dismiss the actual solid-toast if it exists
//     if (current.solidToastId !== undefined) {
//       dismissToast(current.solidToastId)
//     }

//     // Remove the first item from queue (which is the current toast)
//     const currentQueue = queue()
//     const remainingQueue = currentQueue.slice(1)
//     setQueue(remainingQueue)

//     // Mark transition time
//     lastTransitionTime = Date.now()
//   }
// }

// /**
//  * Remove a specific toast by ID from queue or current toast
//  */
// export function dequeueById(toastId: string): boolean {
//   const current = currentToast()

//   // Check if the toast to remove is currently displayed (first in queue)
//   if (current !== null && current.id === toastId) {
//     logging.debug(
//       '[ToastQueue] Dequeuing current toast by ID:',
//       toastId,
//       current.message,
//     )
//     removeCurrentToast()
//     return true
//   }

//   // Otherwise, remove from queue
//   const currentQueue = queue()
//   const removedToast = currentQueue.find((toast) => toast.id === toastId)

//   if (removedToast !== undefined) {
//     // Dismiss the solid-toast if it exists
//     if (removedToast.solidToastId !== undefined) {
//       dismissToast(removedToast.solidToastId)
//     }

//     const newQueue = currentQueue.filter((toast) => toast.id !== toastId)
//     setQueue(newQueue)

//     logging.debug(
//       '[ToastQueue] Removed toast from queue by ID:',
//       toastId,
//       removedToast.message,
//     )
//     return true
//   }

//   logging.debug('[ToastQueue] Toast not found for dequeue by ID:', toastId)
//   return false
// }

// /**
//  * Clear all toasts
//  */
// export function clear(): void {
//   logging.debug('[ToastQueue] Clearing all toasts')

//   // Dismiss all solid-toasts
//   queue().forEach((toastItem) => {
//     if (toastItem.solidToastId !== undefined) {
//       dismissToast(toastItem.solidToastId)
//     }
//   })

//   setQueue([])
//   lastTransitionTime = 0
// }

// /**
//  * Get current toast (reactive)
//  */
// export function getCurrentToast() {
//   return currentToast()
// }

// /**
//  * Get queue status for debugging
//  */
// export function getStatus() {
//   return {
//     currentToast: currentToast(),
//     queueLength: queue().length,
//     isInTransition: isInTransition(),
//     nextToast: queue()[0] ?? null,
//     lastTransitionTime,
//   }
// }
