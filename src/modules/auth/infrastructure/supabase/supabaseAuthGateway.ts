import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import type {
  AuthSession,
  AuthUser,
  SignInOptions,
  SignOutOptions,
} from '~/modules/auth/domain/auth'
import type { AuthGateway } from '~/modules/auth/domain/authGateway'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

function mapUserToDomain(user: User | null): AuthUser | null {
  if (user === null) return null

  return {
    id: user.id,
    email: user.email ?? 'unknown@example.com',
    emailConfirmedAt: user.email_confirmed_at ?? undefined,
    lastSignInAt: user.last_sign_in_at ?? undefined,
    createdAt:
      user.created_at !== '' ? user.created_at : new Date().toISOString(),
    updatedAt:
      user.updated_at !== undefined && user.updated_at !== ''
        ? user.updated_at
        : new Date().toISOString(),
    userMetadata: user.user_metadata,
    appMetadata: user.app_metadata,
  }
}

function mapSessionToDomain(session: Session | null): AuthSession | null {
  if (session === null) return null

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? 0,
    token_type: session.token_type,
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      email_confirmed_at: session.user.email_confirmed_at ?? undefined,
      last_sign_in_at: session.user.last_sign_in_at ?? undefined,
      created_at:
        session.user.created_at !== ''
          ? session.user.created_at
          : new Date().toISOString(),
      updated_at:
        session.user.updated_at !== undefined && session.user.updated_at !== ''
          ? session.user.updated_at
          : new Date().toISOString(),
      user_metadata: session.user.user_metadata,
      app_metadata: session.user.app_metadata,
    },
  }
}

export function createSupabaseAuthGateway(): AuthGateway {
  return {
    async getSession(): Promise<AuthSession | null> {
      try {
        const { data, error } = await supabase.auth.getSession()
        logging.debug(`getSession: data:`, { data, error })

        if (error !== null) {
          throw new Error('Failed to get session', { cause: error })
        }

        return mapSessionToDomain(data.session)
      } catch (error) {
        logging.error('SupabaseAuthRepository getSession error:', error)
        throw error
      }
    },

    async getUser(): Promise<AuthUser | null> {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error !== null) {
          throw new Error('Failed to get user', { cause: error })
        }

        return mapUserToDomain(data.user)
      } catch (error) {
        logging.error('SupabaseAuthRepository getUser error:', error)
        throw error
      }
    },

    async signIn(
      options: SignInOptions,
    ): Promise<{ url?: string; error?: Error }> {
      try {
        if (options.provider === 'google') {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: options.redirectTo,
            },
          })
          return {
            url: data.url ?? undefined,
            error:
              error !== null
                ? new Error('Google sign in failed', { cause: error })
                : undefined,
          }
        }

        return {
          error: new Error(`Provider ${options.provider} not implemented yet`),
        }
      } catch (error) {
        logging.error('SupabaseAuthRepository signIn error:', error)
        return {
          error: error instanceof Error ? error : new Error(String(error)),
        }
      }
    },

    async signOut(_options?: SignOutOptions): Promise<{ error?: Error }> {
      try {
        const { error } = await supabase.auth.signOut()
        return {
          error:
            error !== null
              ? new Error('Sign out failed', { cause: error })
              : undefined,
        }
      } catch (error) {
        logging.error('SupabaseAuthRepository signOut error:', error)
        return {
          error: error instanceof Error ? error : new Error(String(error)),
        }
      }
    },

    onAuthStateChange(
      callback: (event: string, session: AuthSession | null) => void,
    ): () => void {
      try {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (event: AuthChangeEvent, session: Session | null) => {
            callback(event, mapSessionToDomain(session))
          },
        )

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        logging.error('SupabaseAuthRepository onAuthStateChange error:', error)
        return () => {}
      }
    },
  }
}
