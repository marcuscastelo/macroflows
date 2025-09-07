export type CachedSearchGateway = {
  isSearchCached(searchQuery: string): Promise<boolean>
  markSearchAsCached(searchQuery: string): Promise<void>
  unmarkSearchAsCached(searchQuery: string): Promise<void>
}
