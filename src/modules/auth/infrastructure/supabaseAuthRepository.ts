import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import type {
  AuthSession,
  AuthUser,
  SignInOptions,
  SignOutOptions,
} from '~/modules/auth/domain/auth'
import type { AuthRepository } from '~/modules/auth/domain/authRepository'
import { supabase } from '~/shared/utils/supabase'

function mapSupabaseUserToAuthUser(user: User | null): AuthUser | null {
  if (!user) return null

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

function mapSupabaseSessionToAuthSession(
  session: Session | null,
): AuthSession | null {
  if (!session) return null

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

export function createSupabaseAuthRepository(): AuthRepository {
  return {
    async getSession(): Promise<AuthSession | null> {
      const { data, error } = await supabase.auth.getSession()
      if (error !== null) {
        throw new Error('Failed to get session', { cause: error })
      }
      return mapSupabaseSessionToAuthSession(data.session)
    },

    async getUser(): Promise<AuthUser | null> {
      const { data, error } = await supabase.auth.getUser()
      if (error !== null) {
        throw new Error('Failed to get user', { cause: error })
      }
      return mapSupabaseUserToAuthUser(data.user)
    },

    async signIn(
      options: SignInOptions,
    ): Promise<{ url?: string; error?: Error }> {
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

      // For future email/password implementation
      return {
        error: new Error(`Provider ${options.provider} not implemented yet`),
      }
    },

    async signOut(_options?: SignOutOptions): Promise<{ error?: Error }> {
      const { error } = await supabase.auth.signOut()
      return {
        error:
          error !== null
            ? new Error('Sign out failed', { cause: error })
            : undefined,
      }
    },

    async refreshSession(): Promise<AuthSession | null> {
      const { data, error } = await supabase.auth.refreshSession()
      if (error !== null) {
        throw new Error('Failed to refresh session', { cause: error })
      }
      return mapSupabaseSessionToAuthSession(data.session)
    },

    onAuthStateChange(
      callback: (event: string, session: AuthSession | null) => void,
    ): () => void {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          callback(event, mapSupabaseSessionToAuthSession(session))
        },
      )

      return () => {
        subscription.unsubscribe()
      }
    },
  }
}
