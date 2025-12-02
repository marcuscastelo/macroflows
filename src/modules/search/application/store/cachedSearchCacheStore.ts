import { createSignal } from 'solid-js'

import { type CachedSearch } from '~/modules/search/domain/cachedSearch'
import { logging } from '~/shared/utils/logging'

export function createCachedSearchCacheStore() {
  const [cachedSearches, setCachedSearches] = createSignal<
    readonly CachedSearch[]
  >([])

  return {
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
        logging.debug('Updated cached search in cache:', { cachedSearch })
      } else {
        // Add new
        setCachedSearches([cachedSearch, ...current])
        logging.debug('Added new cached search to cache:', { cachedSearch })
      }
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

        logging.debug('Removed cached search from cache:', { searchToRemove })
      }
    },
  }
}
