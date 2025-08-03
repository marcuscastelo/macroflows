import type { CachedSearch } from '~/modules/search/domain/cachedSearch'
import type { Database } from '~/shared/supabase/database.types'

type SupabaseCachedSearch =
  Database['public']['Tables']['cached_searches']['Row']
type SupabaseCachedSearchInsert =
  Database['public']['Tables']['cached_searches']['Insert']

/**
 * Maps Supabase cached search row to domain CachedSearch
 */
export function mapSupabaseCachedSearchToDomain(
  supabaseData: SupabaseCachedSearch,
): CachedSearch {
  return {
    search: supabaseData.search,
  }
}

/**
 * Maps domain CachedSearch to Supabase insert format
 */
export function mapDomainCachedSearchToSupabase(
  domainData: Pick<CachedSearch, 'search'>,
): SupabaseCachedSearchInsert {
  return {
    search: domainData.search,
  }
}

/**
 * Centralized Supabase Search Cache mapper functions
 */
export const supabaseSearchCacheMapper = {
  mapToDomain: mapSupabaseCachedSearchToDomain,
  mapToSupabase: mapDomainCachedSearchToSupabase,
} as const
