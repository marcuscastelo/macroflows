import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import type {
  AuthSession,
  AuthUser,
  SignInOptions,
  SignOutOptions,
} from '~/modules/auth/domain/auth'
import type { AuthRepository } from '~/modules/auth/domain/authRepository'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

import { supabaseAuthMapper } from './supabaseAuthMapper'

const debug = createDebug()
const errorHandler = createErrorHandler('infrastructure', 'Auth')

export function createSupabaseAuthRepository(): AuthRepository {
  return {
    async getSession(): Promise<AuthSession | null> {
      try {
        const { data, error } = await supabase.auth.getSession()
        debug(`getSession: data:`, data, `error:`, error)

        if (error !== null) {
          throw new Error('Failed to get session', { cause: error })
        }

        return supabaseAuthMapper.mapSessionToDomain(data.session)
      } catch (error) {
        errorHandler.error(error, {
          component: 'SupabaseAuthRepository',
          operation: 'getSession',
        })
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
        errorHandler.error(error, {
          component: 'SupabaseAuthRepository',
          operation: 'getUser',
        })
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

        // For future email/password implementation
        return {
          error: new Error(`Provider ${options.provider} not implemented yet`),
        }
      } catch (error) {
        errorHandler.error(error, {
          component: 'SupabaseAuthRepository',
          operation: 'signIn',
          additionalData: { provider: options.provider },
        })
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
        errorHandler.error(error, {
          component: 'SupabaseAuthRepository',
          operation: 'signOut',
        })
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
        errorHandler.error(error, {
          component: 'SupabaseAuthRepository',
          operation: 'refreshSession',
        })
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
        errorHandler.error(error, {
          component: 'SupabaseAuthRepository',
          operation: 'onAuthStateChange',
        })
        // Return a no-op function for safety
        return () => {}
      }
    },
  }
}
