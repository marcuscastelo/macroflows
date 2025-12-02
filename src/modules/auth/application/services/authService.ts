import { type AuthStore } from '~/modules/auth/application/store/authState'
import {
  type SignInOptions,
  type SignOutOptions,
} from '~/modules/auth/domain/auth'
import { type AuthGateway } from '~/modules/auth/domain/authGateway'
import { createSupabaseAuthGateway } from '~/modules/auth/infrastructure/supabase/supabaseAuthGateway'
import { showError } from '~/modules/toast/application/toastManager'
import {
  fetchUser,
  insertUserSilently,
  setCurrentUser,
} from '~/modules/user/application/user'
import { createDefaultUserFromAuthSession } from '~/modules/user/application/userCreationHelper'
import { logging } from '~/shared/utils/logging'

export function createAuthService(
  authStore: AuthStore,
  authGateway: AuthGateway = createSupabaseAuthGateway(),
) {
  async function signIn(options: SignInOptions): Promise<void> {
    try {
      authStore.setAuthState((prev) => ({ ...prev, isLoading: true }))

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
      logging.error('Auth signIn error:', e)
      authStore.setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw e
    }
  }

  /**
   * Sign out current user
   */
  async function signOut(options?: SignOutOptions): Promise<void> {
    try {
      authStore.setAuthState((prev) => ({ ...prev, isLoading: true }))

      const result = await authGateway.signOut(options)

      if (result.error) {
        authStore.setAuthState(() => ({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }))
        throw result.error
      }

      // Auth state will be updated via the subscription
    } catch (e) {
      logging.error('Auth signOut error:', e)
      authStore.setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw e
    }
  }

  /**
   * Initialize authentication system
   */
  function initializeAuth(): void {
    try {
      authGateway.onAuthStateChange((_event, session) => {
        authStore.setAuthState((prev) => ({
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

        if (session?.user.id !== undefined) {
          fetchUser(session.user.id)
            .then(async (user) => {
              logging.debug('User: ', { user })
              if (user === null) {
                logging.info(
                  'User profile not found, creating default profile for OAuth user',
                )
                const newUser = createDefaultUserFromAuthSession(session)
                const createdUser = await insertUserSilently(newUser)
                setCurrentUser(createdUser)
                if (createdUser !== null) {
                  logging.info('User profile created successfully')
                } else {
                  showError(
                    `Couldn't create user profile for ${JSON.stringify(session.user)}`,
                  )
                  signOut().catch(showError)
                }
              }
            })
            .catch(showError)
        }
      })

      // Load initial session
      void loadInitialSession()
    } catch (e) {
      logging.error('Auth initializeAuth error:', e)
      authStore.setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  /**
   * Load initial session on app startup
   */
  async function loadInitialSession(): Promise<void> {
    try {
      const session = await authGateway.getSession()
      logging.debug(`loadInitialSession session:`, { session })
      authStore.setAuthState(() => ({
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
      logging.error('Auth loadInitialSession error:', e)
      authStore.setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw e
    }
  }

  return {
    signIn,
    signOut,
    initializeAuth,
    loadInitialSession,
  }
}
