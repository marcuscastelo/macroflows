import { lazy } from 'solid-js'

/**
 * Type-safe lazy import utility for SolidJS components and utilities.
 * Extracts specific exports from a module and wraps them with lazy loading.
 */

type LazyExport<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => R
  : T

type ExtractExports<T, K extends keyof T> = {
  [P in K]: LazyExport<T[P]>
}

type AllExports<T> = {
  [K in keyof T]: LazyExport<T[K]>
}

/**
 * Creates lazy-loaded versions of all exports from a module
 */
function lazyImport<T extends Record<string, unknown>>(
  moduleFactory: () => Promise<T>,
): AllExports<T>

/**
 * Creates lazy-loaded versions of specific exports from a module
 */
// eslint-disable-next-line no-redeclare
function lazyImport<T extends Record<string, unknown>, K extends keyof T>(
  moduleFactory: () => Promise<T>,
  keys: K[],
): ExtractExports<T, K>

// eslint-disable-next-line no-redeclare
function lazyImport<T extends Record<string, unknown>, K extends keyof T>(
  moduleFactory: () => Promise<T>,
  keys?: K[],
): unknown {
  const modulePromise = moduleFactory()

  if (keys) {
    // Return only specified keys
    const result: Record<string, unknown> = {}
    for (const key of keys) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      result[key as string] = lazy(() =>
        modulePromise.then((module) => ({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          default: module[key] as never,
        })),
      )
    }
    return result
  }

  // Return all exports as lazy components using Proxy
  const cache: Record<string, unknown> = {}

  return new Proxy(cache, {
    get(target: Record<string, unknown>, prop: string | symbol) {
      const key = String(prop)
      if (!(key in target)) {
        target[key] = lazy(() =>
          modulePromise.then((module) => ({
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            default: module[key] as never,
          })),
        )
      }
      return target[key]
    },
  })
}

export { lazyImport }

/**
 * Usage Examples:
 *
 * // Type-safe lazy loading of all SolidJS exports
 * const { Show, For, Switch, createSignal } = lazyImport(() => import('solid-js'))
 *
 * // Type-safe lazy loading of specific exports (reduced bundle size)
 * const { Show: LazyShow, For: LazyFor } = lazyImport(
 *   () => import('solid-js'),
 *   ['Show', 'For']
 * )
 *
 * // Works with custom modules too
 * const { MyComponent, utils } = lazyImport(() => import('~/components/MyComponent'))
 *
 * // Type checking will prevent accessing non-existent exports
 * // const { NonExistent } = lazyImport(() => import('solid-js')) // TypeScript error!
 */
