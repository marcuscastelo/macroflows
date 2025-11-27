import { createSignal } from 'solid-js'

/**
 * Guest mode state management.
 * Tracks whether the user is currently in guest/demo mode.
 */

const GUEST_MODE_STORAGE_KEY = 'macroflows_guest_mode'

// Initialize from localStorage if available
function getInitialGuestMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true'
}

const [isGuestMode, setIsGuestModeInternal] = createSignal(
  getInitialGuestMode(),
)

/**
 * Check if the app is currently in guest mode
 */
export function isInGuestMode(): boolean {
  return isGuestMode()
}

/**
 * Enable guest mode - used when user clicks "Continuar sem login"
 */
export function enableGuestMode(): void {
  setIsGuestModeInternal(true)
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true')
  }
}

/**
 * Disable guest mode - used when user logs in or explicitly exits guest mode
 */
export function disableGuestMode(): void {
  setIsGuestModeInternal(false)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_MODE_STORAGE_KEY)
  }
}

/**
 * Get the signal accessor for reactive use in components
 */
export { isGuestMode }
