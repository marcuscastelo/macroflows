import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import type {
  AuthSession,
  AuthUser,
  SignInOptions,
  SignOutOptions,
} from '~/modules/auth/domain/auth'
import type { AuthGateway } from '~/modules/auth/domain/authGateway'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

import { supabaseAuthMapper } from './supabaseAuthMapper'

export function createSupabaseAuthGateway(): AuthGateway {
  return {
    async getSession(): Promise<AuthSession | null> {
      try {
        const { data, error } = await supabase.auth.getSession()
        logging.debug(`getSession: data:`, { data, error })

        if (error !== null) {
          throw new Error('Failed to get session', { cause: error })
        }

        return supabaseAuthMapper.mapSessionToDomain(data.session)
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

        return supabaseAuthMapper.mapUserToDomain(data.user)
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

    async refreshSession(): Promise<AuthSession | null> {
      try {
        const { data, error } = await supabase.auth.refreshSession()

        if (error !== null) {
          throw new Error('Failed to refresh session', { cause: error })
        }

        return supabaseAuthMapper.mapSessionToDomain(data.session)
      } catch (error) {
        logging.error('SupabaseAuthRepository refreshSession error:', error)
        throw error
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
            callback(event, supabaseAuthMapper.mapSessionToDomain(session))
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
