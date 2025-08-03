import type { CachedSearch } from './cachedSearch'

/**
 * Repository interface for search cache operations
 */
export type SearchCacheRepository = {
  /**
   * Checks if a search query is cached
   */
  isSearchCached(searchQuery: string): Promise<boolean>

  /**
   * Marks a search query as cached
   */
  markSearchAsCached(searchQuery: string): Promise<void>

  /**
   * Removes a search query from cache
   */
  unmarkSearchAsCached(searchQuery: string): Promise<void>

  /**
   * Gets all cached searches (optional - for future use)
   */
  getAllCachedSearches?(): Promise<readonly CachedSearch[]>
}
