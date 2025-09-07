export type CachedSearchRepository = {
  isSearchCached(searchQuery: string): Promise<boolean>
  markSearchAsCached(searchQuery: string): Promise<void>
  unmarkSearchAsCached(searchQuery: string): Promise<void>
}
