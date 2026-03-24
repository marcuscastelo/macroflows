import { type CachedSearchRepository } from '~/modules/search/domain/searchRepository'
import { createSupabaseCachedSearchGateway } from '~/modules/search/infrastructure/supabase/supabaseCachedSearchGateway'

export function createCachedSearchRepository(): CachedSearchRepository {
  const gateway = createSupabaseCachedSearchGateway()

  return {
    isSearchCached: async (searchQuery) =>
      await gateway.isSearchCached(searchQuery),
    markSearchAsCached: async (searchQuery) =>
      await gateway.markSearchAsCached(searchQuery),
    unmarkSearchAsCached: async (searchQuery) =>
      await gateway.unmarkSearchAsCached(searchQuery),
  }
}
