/**
 * Development-only console utilities that are safe to use throughout the codebase.
 * These functions only log in development mode and are no-ops in production.
 *
 * @example
 * ```typescript
 * import { devConsole } from '~/shared/utils/devConsole'
 *
 * devConsole.debug('Debug information', data)
 * devConsole.warn('Warning message', context)
 * devConsole.log('Info message', details)
 * ```
 */

type ConsoleMethod = 'log' | 'warn' | 'debug' | 'info' | 'error'

const createDevConsoleMethod = (method: ConsoleMethod) => {
  return (...args: unknown[]): void => {
    // Only log in development mode
    if (import.meta.env.DEV) {
      console[method](...args)
    }
  }
}

/**
 * Development-only console utilities.
 * These functions are no-ops in production builds.
 */
export const devConsole = {
  /**
   * Log debug information - only appears in development
   */
  debug: createDevConsoleMethod('debug'),

  /**
   * Log informational message - only appears in development
   */
  log: createDevConsoleMethod('log'),

  /**
   * Log informational message - only appears in development
   */
  info: createDevConsoleMethod('info'),

  /**
   * Log warning message - only appears in development
   * Note: For application errors, use errorHandler.apiError instead
   */
  warn: createDevConsoleMethod('warn'),

  /**
   * Log error message - only appears in development
   * Note: For application errors, use errorHandler.apiError instead
   * This should only be used for development debugging
   */
  error: createDevConsoleMethod('error'),
}

/**
 * Create a namespaced development console for a specific module
 * @param namespace - Module or component name for prefixing logs
 * @returns Namespaced console utilities
 */
export const createDevConsole = (namespace: string) => {
  const prefix = `[${namespace}]`

  return {
    debug: (...args: unknown[]) => devConsole.debug(prefix, ...args),
    log: (...args: unknown[]) => devConsole.log(prefix, ...args),
    info: (...args: unknown[]) => devConsole.info(prefix, ...args),
    warn: (...args: unknown[]) => devConsole.warn(prefix, ...args),
    error: (...args: unknown[]) => devConsole.error(prefix, ...args),
  }
}
