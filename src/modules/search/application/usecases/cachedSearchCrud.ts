import { createCachedSearchRepository } from '~/modules/search/infrastructure/cachedSearchRepository'

const cachedSearchRepository = createCachedSearchRepository()

export async function isSearchCached(query: string): Promise<boolean> {
  const isCached = await cachedSearchRepository.isSearchCached(query)

  // trackSearchCache removed - using withUserFlowSpan directly now

  return isCached
}

export async function markSearchAsCached(query: string): Promise<void> {
  await cachedSearchRepository.markSearchAsCached(query)

  // trackSearchCache removed - using withUserFlowSpan directly now
}

export async function unmarkSearchAsCached(query: string): Promise<void> {
  await cachedSearchRepository.unmarkSearchAsCached(query)
}
