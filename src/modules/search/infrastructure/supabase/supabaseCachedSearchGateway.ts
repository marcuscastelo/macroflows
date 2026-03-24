import {
  createNewCachedSearch,
  createNormalizedSearch,
} from '~/modules/search/domain/cachedSearch'
import { type CachedSearchGateway } from '~/modules/search/domain/searchGateway'
import { type Database } from '~/shared/supabase/database.types'
import { supabase } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

const SUPABASE_TABLE_CACHED_SEARCHES = 'cached_searches'

type InsertCachedSearchDTO =
  Database['public']['Tables']['cached_searches']['Insert']

function toInsertDTO(
  domainData: ReturnType<typeof createNewCachedSearch>,
): InsertCachedSearchDTO {
  return {
    search: domainData.search,
  }
}

export function createSupabaseCachedSearchGateway(): CachedSearchGateway {
  async function isSearchCached(searchQuery: string): Promise<boolean> {
    try {
      const normalizedSearch = createNormalizedSearch(searchQuery)

      const { data, error } = await supabase
        .from(SUPABASE_TABLE_CACHED_SEARCHES)
        .select('search')
        .eq('search', normalizedSearch)
        .limit(1)

      if (error !== null) {
        throw new Error('Failed to check if search is cached', {
          cause: error,
        })
      }

      return data.length > 0
    } catch (error) {
      logging.error(
        'SupabaseSearchCacheRepository isSearchCached error:',
        error,
      )
      throw error
    }
  }

  async function markSearchAsCached(searchQuery: string): Promise<void> {
    try {
      const normalizedSearch = createNormalizedSearch(searchQuery)

      // Check if already cached to avoid unnecessary database operations
      if (await isSearchCached(searchQuery)) {
        return
      }

      const insertData = toInsertDTO(
        createNewCachedSearch({
          search: normalizedSearch,
        }),
      )

      const { error } = await supabase
        .from(SUPABASE_TABLE_CACHED_SEARCHES)
        .upsert(insertData)
        .select()

      if (error !== null) {
        throw new Error('Failed to mark search as cached', { cause: error })
      }
    } catch (error) {
      logging.error(
        'SupabaseSearchCacheRepository markSearchAsCached error:',
        error,
      )
      throw error
    }
  }

  async function unmarkSearchAsCached(searchQuery: string): Promise<void> {
    try {
      const normalizedSearch = createNormalizedSearch(searchQuery)

      const { error } = await supabase
        .from(SUPABASE_TABLE_CACHED_SEARCHES)
        .delete()
        .eq('search', normalizedSearch)

      if (error !== null) {
        throw new Error('Failed to unmark search as cached', { cause: error })
      }
    } catch (error) {
      logging.error(
        'SupabaseSearchCacheRepository unmarkSearchAsCached error:',
        error,
      )
      throw error
    }
  }

  return {
    isSearchCached,
    markSearchAsCached,
    unmarkSearchAsCached,
  }
}
