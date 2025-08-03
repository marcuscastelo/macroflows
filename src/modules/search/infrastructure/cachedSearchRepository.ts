import { type CachedSearchRepository } from '~/modules/search/domain/searchRepository'
import { createSupabaseCachedSearchGateway } from '~/modules/search/infrastructure/supabase/supabaseCachedSearchGateway'

export function createCachedSearchRepository(): CachedSearchRepository {
  const gateway = createSupabaseCachedSearchGateway()

  return {
    isSearchCached: async (searchQuery) => {
      return await gateway.isSearchCached(searchQuery)
    },
    markSearchAsCached: async (searchQuery) => {
      return await gateway.markSearchAsCached(searchQuery)
    },
    unmarkSearchAsCached: async (searchQuery) => {
      return await gateway.unmarkSearchAsCached(searchQuery)
    },
  }
}
