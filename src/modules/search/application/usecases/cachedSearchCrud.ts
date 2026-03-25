import { type CachedSearchRepository } from '~/modules/search/domain/searchRepository'

/**
 * Factory that creates cached-search CRUD use-cases.
 *
 * Requires a ready cached-search repository so application wiring stays in the
 * DI container while tests can provide fakes directly.
 *
 * @param deps Required cached-search repository dependency.
 * @returns An object with cached-search helper functions.
 */
export function createCachedSearchCrud(deps: {
  repository: CachedSearchRepository
}) {
  const repository = deps.repository

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
 * Type for DI/testing consumers.
 */
export type CachedSearchCrud = ReturnType<typeof createCachedSearchCrud>
