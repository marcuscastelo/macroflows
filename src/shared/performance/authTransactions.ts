import {
  performanceManager,
  withUserFlowSpan,
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
  return await withUserFlowSpan(
    'auth.login',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_login_credentials',
          'validation',
          {
            email,
            loginMethod,
            emailDomain: email.split('@')[1] ?? 'unknown',
          },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'check_user_cache',
          'cache.read',
          { email },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'authenticate_user',
          'api.call',
          { email, loginMethod },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'load_user_session',
          'db.query',
          { email },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'auth.logout',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_logout_request',
          'validation',
          { userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'invalidate_user_session',
          'api.call',
          { userId },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'clear_user_cache',
          'cache.write',
          { userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'auth.register',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_registration_data',
          'validation',
          {
            email,
            registrationMethod,
            emailDomain: email.split('@')[1] ?? 'unknown',
          },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'check_existing_user',
          'db.query',
          { email },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'create_user_account',
          'api.call',
          { email, registrationMethod },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'setup_user_defaults',
          'db.query',
          { email },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'auth.password_reset',
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'validate_reset_request',
          'validation',
          { email },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'check_user_exists',
          'db.query',
          { email },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'generate_reset_token',
          'calculation',
          { email },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'send_reset_email',
          'api.call',
          { email },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  return await withUserFlowSpan(
    'auth.login', // Reuse login transaction type for session validation
    async (spanId) => {
      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'check_session_cache',
          'cache.read',
          { userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
          'validate_session_token',
          'validation',
          { userId },
        )
      }

      const result = await operation()

      if (spanId !== null) {
        performanceManager.addSpanAttributes(
          spanId,
          'refresh_session_data',
          'api.call',
          { userId },
        )

        performanceManager.addSpanAttributes(
          spanId,
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
  spanId: string | null,
  operation: string,
  metadata?: Record<string, unknown>,
): void {
  if (spanId === null) return

  performanceManager.addSpanAttributes(spanId, operation, 'api.call', {
    service: 'supabase_auth',
    ...metadata,
  })
}

/**
 * Utility to track authentication cache operations
 */
export function trackAuthCache(
  spanId: string | null,
  operation: 'hit' | 'miss' | 'write' | 'clear',
  cacheKey: string,
  metadata?: Record<string, unknown>,
): void {
  if (spanId === null) return

  performanceManager.addSpanAttributes(
    spanId,
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
