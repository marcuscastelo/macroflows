import { type AuthState, type AuthUser } from '~/modules/auth/domain/auth'
import { authState } from '~/modules/auth/infrastructure/signals/authState'
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
