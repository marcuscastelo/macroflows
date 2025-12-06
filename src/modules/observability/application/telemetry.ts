import { initializeSentry as defaultInitializeSentry } from '~/modules/observability/infrastructure/sentry/sentry'

/**
 * Dependency injection shape for the telemetry factory.
 */
export type TelemetryDeps = {
  /**
   * Optional override for the Sentry initializer.
   * Useful in tests or alternate environments.
   */
  initializeSentry?: typeof defaultInitializeSentry
}

/**
 * Factory that creates telemetry helpers with injectable dependencies.
 *
 * Provides a single function `initializeTelemetry` that mirrors the previous
 * top-level function but allows tests or custom DI containers to provide a
 * different Sentry initializer.
 *
 * @param deps Optional dependency overrides.
 * @returns An object with an `initializeTelemetry` function.
 */
export function createTelemetry(deps?: TelemetryDeps) {
  const localInitializeSentry =
    deps?.initializeSentry ?? defaultInitializeSentry

  /**
   * Initialize telemetry for the current runtime environment.
   *
   * @param type Either 'server' or 'client' to select the appropriate Sentry init.
   */
  function initializeTelemetry(type: 'server' | 'client') {
    void localInitializeSentry(type)
  }

  return {
    initializeTelemetry,
  }
}

/**
 * Public type for DI/testing consumers.
 */
export type TelemetryModule = ReturnType<typeof createTelemetry>
