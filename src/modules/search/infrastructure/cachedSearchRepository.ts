import { cachedSearchSchema } from '~/modules/search/domain/cachedSearch'
import { type CachedSearchRepository } from '~/modules/search/domain/searchRepository'
import { cachedSearchCacheStore } from '~/modules/search/infrastructure/signals/cachedSearchCacheStore'
import { createSupabaseCachedSearchGateway } from '~/modules/search/infrastructure/supabase/supabaseCachedSearchGateway'
import { parseWithStack } from '~/shared/utils/parseWithStack'

export function createCachedSearchRepository(): CachedSearchRepository {
  const gateway = createSupabaseCachedSearchGateway()

  return {
    isSearchCached: async (searchQuery) => {
      const result = await gateway.isSearchCached(searchQuery)
      if (result) {
        cachedSearchCacheStore.upsertToCache(
          parseWithStack(cachedSearchSchema, { search: searchQuery }),
        )
      } else {
        cachedSearchCacheStore.removeFromCache({
          by: 'search',
          value: searchQuery,
        })
      }
      return result
    },
    markSearchAsCached: async (searchQuery) => {
      await gateway.markSearchAsCached(searchQuery)
      cachedSearchCacheStore.upsertToCache(
        parseWithStack(cachedSearchSchema, {
          search: searchQuery,
        }),
      )
    },
    unmarkSearchAsCached: async (searchQuery) => {
      await gateway.unmarkSearchAsCached(searchQuery)
      cachedSearchCacheStore.removeFromCache({
        by: 'search',
        value: searchQuery,
      })
    },
  }
}
