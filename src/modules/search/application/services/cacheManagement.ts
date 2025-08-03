import {
  isSearchCached,
  markSearchAsCached,
} from '~/modules/search/application/usecases/cachedSearchCrud'
import {
  canCacheSearch,
  createCachedSearchFromQuery,
} from '~/modules/search/domain/searchOperations'
import { cachedSearchCacheStore } from '~/modules/search/infrastructure/signals/cachedSearchCacheStore'
import { type User } from '~/modules/user/domain/user'
import { createErrorHandler } from '~/shared/error/errorHandler'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()
const errorHandler = createErrorHandler('application', 'CacheManagement')

export async function ensureSearchIsCached(
  userId: User['id'],
  query: string,
): Promise<void> {
  try {
    if (!canCacheSearch(query)) {
      debug('Query too short to cache:', query)
      return
    }

    // Check local cache first
    const isLocalyCached = cachedSearchCacheStore.isSearchCached(query)
    if (isLocalyCached) {
      debug('Search already cached locally:', query)
      return
    }

    // Check remote cache
    const isRemoteCached = await isSearchCached(query)
    if (isRemoteCached) {
      debug('Search already cached remotely, updating local cache:', query)
      cachedSearchCacheStore.markAsCached(query)
      return
    }

    // Cache the search
    const newCachedSearch = createCachedSearchFromQuery(query)
    await markSearchAsCached(newCachedSearch.search)

    debug('Search cached successfully:', query)
    cachedSearchCacheStore.markAsCached(query)
  } catch (error) {
    errorHandler.error(error, {
      component: 'CacheManagement',
      operation: 'ensureSearchIsCached',
      additionalData: { userId, query },
    })
  }
}
