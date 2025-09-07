import { createCachedSearchRepository } from '~/modules/search/infrastructure/cachedSearchRepository'

const cachedSearchRepository = createCachedSearchRepository()

export async function isSearchCached(query: string): Promise<boolean> {
  return await cachedSearchRepository.isSearchCached(query)
}

export async function markSearchAsCached(query: string): Promise<void> {
  await cachedSearchRepository.markSearchAsCached(query)
}

export async function unmarkSearchAsCached(query: string): Promise<void> {
  await cachedSearchRepository.unmarkSearchAsCached(query)
}
