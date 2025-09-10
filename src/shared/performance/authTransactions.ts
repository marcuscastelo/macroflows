import {
  performanceManager,
  withTransaction,
} from '~/shared/config/performance'

/**
 * Authentication Transaction Wrappers
 *
 * These functions wrap major authentication-related user flows with performance tracking
 */

/**
 * Track user login operations
 */
export async function trackUserLogin<T>(
  email: string,
  loginMethod: 'email' | 'oauth' | 'magic_link',
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'auth.login',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_login_credentials',
          'validation',
          {
            email,
            loginMethod,
            emailDomain: email.split('@')[1] ?? 'unknown',
          },
        )

        performanceManager.addSpan(
          transactionId,
          'check_user_cache',
          'cache.read',
          { email },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'authenticate_user',
          'api.call',
          { email, loginMethod },
        )

        performanceManager.addSpan(
          transactionId,
          'load_user_session',
          'db.query',
          { email },
        )

        performanceManager.addSpan(
          transactionId,
          'cache_user_session',
          'cache.write',
          { email },
        )
      }

      return result
    },
    {
      entityType: 'user_login',
      entityId: email,
    },
  )
}

/**
 * Track user logout operations
 */
export async function trackUserLogout<T>(
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'auth.logout',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_logout_request',
          'validation',
          { userId },
        )

        performanceManager.addSpan(
          transactionId,
          'invalidate_user_session',
          'api.call',
          { userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'clear_user_cache',
          'cache.write',
          { userId },
        )

        performanceManager.addSpan(
          transactionId,
          'cleanup_local_storage',
          'cache.write',
          { userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'user_logout',
      entityId: userId,
    },
  )
}

/**
 * Track user registration operations
 */
export async function trackUserRegistration<T>(
  email: string,
  registrationMethod: 'email' | 'oauth',
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'auth.register',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_registration_data',
          'validation',
          {
            email,
            registrationMethod,
            emailDomain: email.split('@')[1] ?? 'unknown',
          },
        )

        performanceManager.addSpan(
          transactionId,
          'check_existing_user',
          'db.query',
          { email },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'create_user_account',
          'api.call',
          { email, registrationMethod },
        )

        performanceManager.addSpan(
          transactionId,
          'setup_user_defaults',
          'db.query',
          { email },
        )

        performanceManager.addSpan(
          transactionId,
          'send_welcome_email',
          'api.call',
          { email },
        )
      }

      return result
    },
    {
      entityType: 'user_registration',
      entityId: email,
    },
  )
}

/**
 * Track password reset operations
 */
export async function trackPasswordReset<T>(
  email: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'auth.password_reset',
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'validate_reset_request',
          'validation',
          { email },
        )

        performanceManager.addSpan(
          transactionId,
          'check_user_exists',
          'db.query',
          { email },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'generate_reset_token',
          'calculation',
          { email },
        )

        performanceManager.addSpan(
          transactionId,
          'send_reset_email',
          'api.call',
          { email },
        )

        performanceManager.addSpan(
          transactionId,
          'log_reset_attempt',
          'db.query',
          { email },
        )
      }

      return result
    },
    {
      entityType: 'password_reset',
      entityId: email,
    },
  )
}

/**
 * Track session validation operations
 */
export async function trackSessionValidation<T>(
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return await withTransaction(
    'auth.login', // Reuse login transaction type for session validation
    async (transactionId) => {
      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'check_session_cache',
          'cache.read',
          { userId },
        )

        performanceManager.addSpan(
          transactionId,
          'validate_session_token',
          'validation',
          { userId },
        )
      }

      const result = await operation()

      if (transactionId !== null) {
        performanceManager.addSpan(
          transactionId,
          'refresh_session_data',
          'api.call',
          { userId },
        )

        performanceManager.addSpan(
          transactionId,
          'update_session_cache',
          'cache.write',
          { userId },
        )
      }

      return result
    },
    {
      userId,
      entityType: 'session_validation',
      entityId: userId,
    },
  )
}

/**
 * Utility to track authentication API calls
 */
export function trackAuthApiCall(
  transactionId: string | null,
  operation: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(transactionId, operation, 'api.call', {
    service: 'supabase_auth',
    ...metadata,
  })
}

/**
 * Utility to track authentication cache operations
 */
export function trackAuthCache(
  transactionId: string | null,
  operation: 'hit' | 'miss' | 'write' | 'clear',
  cacheKey: string,
  metadata?: Record<string, unknown>,
): void {
  if (transactionId === null) return

  performanceManager.addSpan(
    transactionId,
    `auth_cache_${operation}`,
    operation === 'write' || operation === 'clear'
      ? 'cache.write'
      : 'cache.read',
    {
      cacheKey,
      cacheMiss: operation === 'miss',
      ...metadata,
    },
  )
}
