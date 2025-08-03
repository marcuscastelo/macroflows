import { createNormalizedSearch } from '~/modules/search/domain/cachedSearch'
import type { SearchCacheRepository } from '~/modules/search/domain/searchCacheRepository'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { supabase } from '~/shared/supabase/supabase'

import { supabaseSearchCacheMapper } from './supabaseSearchCacheMapper'

const TABLE = 'cached_searches'
const errorHandler = createErrorHandler('infrastructure', 'SearchCache')

export function createSupabaseSearchCacheRepository(): SearchCacheRepository {
  return {
    async isSearchCached(searchQuery: string): Promise<boolean> {
      try {
        const normalizedSearch = createNormalizedSearch(searchQuery)

        const { data, error } = await supabase
          .from(TABLE)
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
        errorHandler.error(error, {
          component: 'SupabaseSearchCacheRepository',
          operation: 'isSearchCached',
          additionalData: { searchQuery },
        })
        throw error
      }
    },

    async markSearchAsCached(searchQuery: string): Promise<void> {
      try {
        const normalizedSearch = createNormalizedSearch(searchQuery)

        // Check if already cached to avoid unnecessary database operations
        if (await this.isSearchCached(searchQuery)) {
          return
        }

        const insertData = supabaseSearchCacheMapper.mapToSupabase({
          search: normalizedSearch,
        })

        const { error } = await supabase.from(TABLE).upsert(insertData).select()

        if (error !== null) {
          throw new Error('Failed to mark search as cached', { cause: error })
        }
      } catch (error) {
        errorHandler.error(error, {
          component: 'SupabaseSearchCacheRepository',
          operation: 'markSearchAsCached',
          additionalData: { searchQuery },
        })
        throw error
      }
    },

    async unmarkSearchAsCached(searchQuery: string): Promise<void> {
      try {
        const normalizedSearch = createNormalizedSearch(searchQuery)

        const { error } = await supabase
          .from(TABLE)
          .delete()
          .eq('search', normalizedSearch)

        if (error !== null) {
          throw new Error('Failed to unmark search as cached', { cause: error })
        }
      } catch (error) {
        errorHandler.error(error, {
          component: 'SupabaseSearchCacheRepository',
          operation: 'unmarkSearchAsCached',
          additionalData: { searchQuery },
        })
        throw error
      }
    },

    async getAllCachedSearches() {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select('*')
          .order('created_at', { ascending: false })

        if (error !== null) {
          throw new Error('Failed to get all cached searches', { cause: error })
        }

        return data.map(supabaseSearchCacheMapper.mapToDomain)
      } catch (error) {
        errorHandler.error(error, {
          component: 'SupabaseSearchCacheRepository',
          operation: 'getAllCachedSearches',
        })
        throw error
      }
    },
  }
}
