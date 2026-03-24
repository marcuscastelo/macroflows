/**
 * User-configurable toast settings.
 */
export type ToastSettings = {
  /** Show success toasts for background operations */
  showBackgroundSuccess: boolean
  /** Show loading toasts for background operations */
  showBackgroundLoading: boolean
  /** Automatically dismiss error toasts */
  autoDismissErrors: boolean
  /** Default duration for toasts in milliseconds */
  defaultDuration: number
  /** Group similar toasts together */
  groupSimilarToasts: boolean
  /** Show detailed error information in toasts */
  showDetailedErrors: boolean
}
