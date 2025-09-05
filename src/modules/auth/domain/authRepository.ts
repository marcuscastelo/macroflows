import type {
  AuthSession,
  AuthUser,
  SignInOptions,
  SignOutOptions,
} from './auth'

export type AuthRepository = {
  /**
   * Get the current authentication session
   */
  getSession: () => Promise<AuthSession | null>

  /**
   * Get the current authenticated user
   */
  getUser: () => Promise<AuthUser | null>

  /**
   * Sign in with the specified provider
   */
  signIn: (options: SignInOptions) => Promise<{ url?: string; error?: Error }>

  /**
   * Sign out the current user
   */
  signOut: (options?: SignOutOptions) => Promise<{ error?: Error }>

  /**
   * Refresh the current session
   */
  refreshSession: () => Promise<AuthSession | null>

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange: (
    callback: (event: string, session: AuthSession | null) => void,
  ) => () => void
}
