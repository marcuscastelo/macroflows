import type {
  AuthSession,
  AuthUser,
  SignInOptions,
  SignOutOptions,
} from '~/modules/auth/domain/auth'

export type AuthGateway = {
  getSession: () => Promise<AuthSession | null>
  getUser: () => Promise<AuthUser | null>
  signIn: (options: SignInOptions) => Promise<{ url?: string; error?: Error }>
  signOut: (options?: SignOutOptions) => Promise<{ error?: Error }>
  onAuthStateChange: (
    callback: (event: string, session: AuthSession | null) => void,
  ) => () => void
}
