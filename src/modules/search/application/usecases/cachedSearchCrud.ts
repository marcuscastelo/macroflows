import { createCachedSearchRepository } from '~/modules/search/infrastructure/cachedSearchRepository'

/**
 * Factory that creates cached-search CRUD use-cases.
 *
 * Allows injecting an alternative repository factory for DI and testing.
 *
 * @param deps Optional dependency overrides.
 * @returns An object with cached-search helper functions.
 */
export function createCachedSearchCrud(deps?: {
  createCachedSearchRepository?: typeof createCachedSearchRepository
}) {
  const localCreateCachedSearchRepository =
    deps?.createCachedSearchRepository ?? createCachedSearchRepository

  const repository = localCreateCachedSearchRepository()

  /**
   * Checks whether a given search query result is already cached.
   *
   * @param query The search query to check.
   * @returns A promise resolving to `true` if cached, otherwise `false`.
   */
  async function isSearchCached(query: string): Promise<boolean> {
    return await repository.isSearchCached(query)
  }

  /**
   * Marks the given search query as cached.
   *
   * @param query The search query to mark as cached.
   * @returns A promise that resolves when the operation completes.
   */
  async function markSearchAsCached(query: string): Promise<void> {
    await repository.markSearchAsCached(query)
  }

  /**
   * Removes the cached mark for the given search query.
   *
   * @param query The search query to unmark.
   * @returns A promise that resolves when the operation completes.
   */
  async function unmarkSearchAsCached(query: string): Promise<void> {
    await repository.unmarkSearchAsCached(query)
  }

  return {
    isSearchCached,
    markSearchAsCached,
    unmarkSearchAsCached,
  }
}

/**
 * Backward-compatible shim: keep the original named exports while allowing DI consumers
 * to call `createCachedSearchCrud` directly when they need to inject dependencies.
 */
const _defaultCachedSearchCrud = createCachedSearchCrud()

export const isSearchCached = _defaultCachedSearchCrud.isSearchCached
export const markSearchAsCached = _defaultCachedSearchCrud.markSearchAsCached
export const unmarkSearchAsCached =
  _defaultCachedSearchCrud.unmarkSearchAsCached

// Also export the factory and type for DI/testing consumers
export { _defaultCachedSearchCrud as cachedSearchCrud }
export type CachedSearchCrud = ReturnType<typeof createCachedSearchCrud>
