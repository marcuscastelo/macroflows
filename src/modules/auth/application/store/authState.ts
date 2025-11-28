import { createSignal } from 'solid-js'

import { type AuthState, type AuthUser } from '~/modules/auth/domain/auth'

// Auth state signals
export const [authState, setAuthState] = createSignal<AuthState>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
})

/**
 * Get current auth state
 */
export function getAuthState(): AuthState {
  return authState()
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): AuthUser | null {
  return authState().user
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return authState().isAuthenticated
}

/**
 * Check if auth is loading
 */
export function isAuthLoading(): boolean {
  return authState().isLoading
}
