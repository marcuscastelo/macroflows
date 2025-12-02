import { type CachedSearchRepository } from '~/modules/search/domain/searchRepository'

export function createCachedSearchCrudUseCases(
  cachedSearchRepository: CachedSearchRepository,
) {
  return {
    async isSearchCached(query: string): Promise<boolean> {
      return await cachedSearchRepository.isSearchCached(query)
    },

    async markSearchAsCached(query: string): Promise<void> {
      await cachedSearchRepository.markSearchAsCached(query)
    },

    async unmarkSearchAsCached(query: string): Promise<void> {
      await cachedSearchRepository.unmarkSearchAsCached(query)
    },
  }
}
