import { createSignal } from 'solid-js'

import { type CachedSearch } from '~/modules/search/domain/cachedSearch'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

// Global reactive state for cached searches
export const [cachedSearches, setCachedSearches] = createSignal<
  readonly CachedSearch[]
>([])

// Local cache for quick lookup
const localSearchCache = new Set<string>()

export const cachedSearchCacheStore = {
  // Get current cached searches
  getCachedSearches: () => cachedSearches(),

  // Check if search is cached locally
  isSearchCached: (query: string): boolean => {
    const normalizedQuery = query.toLowerCase().trim()
    return localSearchCache.has(query) || localSearchCache.has(normalizedQuery)
  },

  // Mark search as cached locally
  markAsCached: (query: string) => {
    const normalizedQuery = query.toLowerCase().trim()
    localSearchCache.add(query)
    localSearchCache.add(normalizedQuery)
    debug('Marked as cached locally:', query)
  },

  // Remove from local cache
  unmarkAsCached: (query: string) => {
    const normalizedQuery = query.toLowerCase().trim()
    localSearchCache.delete(query)
    localSearchCache.delete(normalizedQuery)
    debug('Unmarked from local cache:', query)
  },

  // Upsert to cache (from realtime events)
  upsertToCache: (cachedSearch: CachedSearch) => {
    const current = cachedSearches()
    const existingIndex = current.findIndex(
      (search) => search.search === cachedSearch.search,
    )

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...current]
      updated[existingIndex] = cachedSearch
      setCachedSearches(updated)
      debug('Updated cached search in cache:', cachedSearch.search)
    } else {
      // Add new
      setCachedSearches([cachedSearch, ...current])
      debug('Added new cached search to cache:', cachedSearch.search)
    }

    // Update local cache
    localSearchCache.add(cachedSearch.search)
  },

  // Remove from cache (from realtime events)
  removeFromCache: (selector: {
    by: 'search'
    value: CachedSearch['search']
  }) => {
    const current = cachedSearches()
    const searchToRemove = current.find(
      (search) => search.search === selector.value,
    )

    if (searchToRemove) {
      const updated = current.filter(
        (search) => search.search !== selector.value,
      )
      setCachedSearches(updated)

      // Remove from local cache
      localSearchCache.delete(searchToRemove.search)

      debug('Removed cached search from cache:', searchToRemove.search)
    }
  },

  // Clear all cache
  clearCache: () => {
    setCachedSearches([])
    localSearchCache.clear()
    debug('Cleared all cached search cache')
  },
}
