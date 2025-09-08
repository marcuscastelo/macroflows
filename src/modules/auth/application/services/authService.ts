import {
  type SignInOptions,
  type SignOutOptions,
} from '~/modules/auth/domain/auth'
import { type AuthGateway } from '~/modules/auth/domain/authGateway'
import { setAuthState } from '~/modules/auth/infrastructure/signals/authState'
import { createSupabaseAuthGateway } from '~/modules/auth/infrastructure/supabase/supabaseAuthGateway'
import { logError } from '~/shared/error/errorHandler'
import { logging } from '~/shared/utils/logging'

export function createAuthService(
  authGateway: AuthGateway = createSupabaseAuthGateway(),
) {
  /**
   * Sign in with specified provider
   */
  async function signIn(options: SignInOptions): Promise<void> {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      const result = await authGateway.signIn(options)

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
  async function signOut(options?: SignOutOptions): Promise<void> {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      const result = await authGateway.signOut(options)

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
  async function refreshSession(): Promise<void> {
    try {
      await authGateway.refreshSession()
      // Session will be updated via the subscription
    } catch (e) {
      logError(e, {
        component: 'Auth',
        operation: 'refreshSession',
      })
      throw e
    }
  }

  // Auth state subscription cleanup function
  let unsubscribeAuthState: (() => void) | null = null

  /**
   * Initialize authentication system
   */
  function initializeAuth(): void {
    try {
      // Set up auth state change subscription
      unsubscribeAuthState = authGateway.onAuthStateChange(
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
      const session = await authGateway.getSession()
      logging.debug(`loadInitialSession session:`, { session })
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
   * Cleanup auth subscriptions
   */
  function cleanupAuth(): void {
    if (unsubscribeAuthState) {
      unsubscribeAuthState()
      unsubscribeAuthState = null
    }
  }

  return {
    signIn,
    signOut,
    refreshSession,
    initializeAuth,
    loadInitialSession,
    cleanupAuth,
  }
}

// Default instance for convenience
const defaultAuthService = createAuthService()

// Export individual functions for easier importing
export const {
  signIn,
  signOut,
  refreshSession,
  initializeAuth,
  loadInitialSession,
  cleanupAuth,
} = defaultAuthService

// Also export the default instance
export default defaultAuthService
