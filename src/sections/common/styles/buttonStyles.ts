/**
 * Shared button styles for clipboard action buttons
 * Uses minimum 44px touch target for mobile accessibility (WCAG 2.5.5)
 */
export const COPY_BUTTON_STYLES =
  'btn-ghost btn cursor-pointer uppercase ml-auto mt-1 px-2 text-white hover:scale-105 min-h-[44px] min-w-[44px] touch-manipulation'

/**
 * Styles for clipboard action buttons with larger touch targets
 * Minimum 44px for mobile accessibility compliance
 */
export const CLIPBOARD_ACTION_BUTTON_STYLES =
  'btn-ghost btn cursor-pointer px-2 text-white hover:scale-105 min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-transform'
