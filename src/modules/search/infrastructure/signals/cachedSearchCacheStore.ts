import { createSignal } from 'solid-js'

import { type CachedSearch } from '~/modules/search/domain/cachedSearch'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

const [cachedSearches, setCachedSearches] = createSignal<
  readonly CachedSearch[]
>([])

export const cachedSearchCacheStore = {
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

      debug('Removed cached search from cache:', searchToRemove.search)
    }
  },
}
