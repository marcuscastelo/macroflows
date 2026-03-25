import { type CachedSearchRepository } from '~/modules/search/domain/searchRepository'

export function createCachedSearchCrudUseCases(
  cachedSearchRepository: CachedSearchRepository,
) {
  return createCachedSearchCrud({
    repository: cachedSearchRepository,
  })
}

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

  async function isSearchCached(query: string): Promise<boolean> {
    return await repository.isSearchCached(query)
  }

  async function markSearchAsCached(query: string): Promise<void> {
    await repository.markSearchAsCached(query)
  }

  async function unmarkSearchAsCached(query: string): Promise<void> {
    await repository.unmarkSearchAsCached(query)
  }

  return {
    isSearchCached,
    markSearchAsCached,
    unmarkSearchAsCached,
  }
}

export type CachedSearchCrud = ReturnType<typeof createCachedSearchCrud>
