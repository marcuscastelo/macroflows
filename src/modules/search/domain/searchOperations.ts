import {
  type CachedSearch,
  createNewCachedSearch,
  createNormalizedSearch,
  type NewCachedSearch,
} from '~/modules/search/domain/cachedSearch'

export function createCachedSearchFromQuery(query: string): NewCachedSearch {
  const normalizedSearch = createNormalizedSearch(query)

  return createNewCachedSearch({
    search: normalizedSearch,
  })
}

export function isCachedSearchQueryEqual(
  cachedSearch: CachedSearch,
  query: string,
): boolean {
  const normalizedQuery = createNormalizedSearch(query)
  return cachedSearch.search === normalizedQuery
}

export function canCacheSearch(query: string): boolean {
  return query.trim().length > 0
}
