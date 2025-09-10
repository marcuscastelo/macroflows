import { createCachedSearchRepository } from '~/modules/search/infrastructure/cachedSearchRepository'
import { trackSearchCache } from '~/shared/performance'

const cachedSearchRepository = createCachedSearchRepository()

export async function isSearchCached(
  query: string,
  transactionId?: string | null,
): Promise<boolean> {
  const isCached = await cachedSearchRepository.isSearchCached(query)

  trackSearchCache(
    transactionId ?? null,
    isCached ? 'hit' : 'miss',
    `search_${query}`,
    { query, isCached },
  )

  return isCached
}

export async function markSearchAsCached(
  query: string,
  transactionId?: string | null,
): Promise<void> {
  await cachedSearchRepository.markSearchAsCached(query)

  trackSearchCache(transactionId ?? null, 'write', `search_${query}`, {
    query,
    operation: 'mark_cached',
  })
}

export async function unmarkSearchAsCached(query: string): Promise<void> {
  await cachedSearchRepository.unmarkSearchAsCached(query)
}
