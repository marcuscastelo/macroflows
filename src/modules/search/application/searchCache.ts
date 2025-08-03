import { createSupabaseSearchCacheRepository } from '~/modules/search/infrastructure/supabase/supabaseSearchCacheRepository'
import { createErrorHandler } from '~/shared/error/errorHandler'

const searchCacheRepository = createSupabaseSearchCacheRepository()
const errorHandler = createErrorHandler('application', 'SearchCache')

/**
 * Checks if a search is cached.
 * @param search - The search string.
 * @returns True if cached, false otherwise.
 */
export const isSearchCached = async (search: string): Promise<boolean> => {
  try {
    return await searchCacheRepository.isSearchCached(search)
  } catch (error) {
    errorHandler.error(error, {
      component: 'SearchCache',
      operation: 'isSearchCached',
      additionalData: { search },
    })
    return false
  }
}

/**
 * Marks a search as cached.
 * @param search - The search string.
 * @returns True if marked, false otherwise.
 */
export const markSearchAsCached = async (search: string): Promise<boolean> => {
  try {
    await searchCacheRepository.markSearchAsCached(search)
    return true
  } catch (error) {
    errorHandler.error(error, {
      component: 'SearchCache',
      operation: 'markSearchAsCached',
      additionalData: { search },
    })
    return false
  }
}

/**
 * Unmarks a search as cached.
 * @param search - The search string.
 * @returns True if unmarked, false otherwise.
 */
export const unmarkSearchAsCached = async (
  search: string,
): Promise<boolean> => {
  try {
    await searchCacheRepository.unmarkSearchAsCached(search)
    return true
  } catch (error) {
    errorHandler.error(error, {
      component: 'SearchCache',
      operation: 'unmarkSearchAsCached',
      additionalData: { search },
    })
    return false
  }
}
