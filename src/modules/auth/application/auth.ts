import { createSignal } from 'solid-js'

import type {
  AuthState,
  AuthUser,
  SignInOptions,
  SignOutOptions,
} from '~/modules/auth/domain/auth'
import type { AuthRepository } from '~/modules/auth/domain/authRepository'
import { createSupabaseAuthRepository } from '~/modules/auth/infrastructure/supabaseAuthRepository'
import { logError } from '~/shared/error/errorHandler'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

// Auth state signals
const [authState, setAuthState] = createSignal<AuthState>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
})

// Repository instance
const authRepository: AuthRepository = createSupabaseAuthRepository()

// Auth state subscription cleanup function
let unsubscribeAuthState: (() => void) | null = null

/**
 * Initialize authentication system
 */
export function initializeAuth(): void {
  try {
    // Set up auth state change subscription
    unsubscribeAuthState = authRepository.onAuthStateChange(
      (_event, session) => {
        setAuthState((prev) => ({
          ...prev,
          session,
          user: session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
                emailConfirmedAt: session.user.email_confirmed_at,
                lastSignInAt: session.user.last_sign_in_at,
                createdAt: session.user.created_at,
                updatedAt: session.user.updated_at,
                userMetadata: session.user.user_metadata,
                appMetadata: session.user.app_metadata,
              }
            : null,
          isAuthenticated: !!session,
          isLoading: false,
        }))
      },
    )

    // Load initial session
    void loadInitialSession()
  } catch (e) {
    logError(e, {
      component: 'Auth',
      operation: 'initializeAuth',
    })
    setAuthState((prev) => ({ ...prev, isLoading: false }))
  }
}

/**
 * Load initial session on app startup
 */
async function loadInitialSession(): Promise<void> {
  try {
    const session = await authRepository.getSession()
    debug(`loadInitialSession session:`, session)
    setAuthState((prev) => ({
      ...prev,
      session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            emailConfirmedAt: session.user.email_confirmed_at,
            lastSignInAt: session.user.last_sign_in_at,
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at,
            userMetadata: session.user.user_metadata,
            appMetadata: session.user.app_metadata,
          }
        : null,
      isAuthenticated: session !== null,
      isLoading: false,
    }))
  } catch (e) {
    logError(e, {
      component: 'Auth',
      operation: 'loadInitialSession',
    })
    setAuthState((prev) => ({ ...prev, isLoading: false }))
  }
}

/**
 * Sign in with specified provider
 */
export async function signIn(options: SignInOptions): Promise<void> {
  try {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    const result = await authRepository.signIn(options)

    if (result.error) {
      throw result.error
    }

    // For OAuth providers, the user will be redirected
    if (result.url !== undefined && options.provider === 'google') {
      if (typeof window !== 'undefined') {
        window.location.href = result.url
      }
    }
  } catch (e) {
    logError(e, {
      component: 'Auth',
      operation: 'signIn',
      additionalData: { provider: options.provider },
    })
    setAuthState((prev) => ({ ...prev, isLoading: false }))
    throw e
  }
}

/**
 * Sign out current user
 */
export async function signOut(options?: SignOutOptions): Promise<void> {
  try {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    const result = await authRepository.signOut(options)

    if (result.error) {
      throw result.error
    }

    // Auth state will be updated via the subscription
  } catch (e) {
    logError(e, {
      component: 'Auth',
      operation: 'signOut',
    })
    setAuthState((prev) => ({ ...prev, isLoading: false }))
    throw e
  }
}

/**
 * Refresh current session
 */
export async function refreshSession(): Promise<void> {
  try {
    await authRepository.refreshSession()
    // Session will be updated via the subscription
  } catch (e) {
    logError(e, {
      component: 'Auth',
      operation: 'refreshSession',
    })
    throw e
  }
}

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

/**
 * Cleanup auth subscriptions
 */
export function cleanupAuth(): void {
  if (unsubscribeAuthState) {
    unsubscribeAuthState()
    unsubscribeAuthState = null
  }
}

// Export the auth state signal for reactive components
export { authState }
