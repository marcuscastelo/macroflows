import type { Session, User } from '@supabase/supabase-js'

import type { AuthSession, AuthUser } from '~/modules/auth/domain/auth'

/**
 * Maps Supabase User to domain AuthUser
 */
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

/**
 * Maps Supabase Session to domain AuthSession
 */
function mapSupabaseSessionToAuthSession(
  session: Session | null,
): AuthSession | null {
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

/**
 * Centralized Supabase Auth mapper functions
 */
export const supabaseAuthMapper = {
  mapUserToDomain: mapSupabaseUserToAuthUser,
  mapSessionToDomain: mapSupabaseSessionToAuthSession,
} as const
