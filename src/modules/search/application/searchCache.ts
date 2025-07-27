// Application layer for search cache operations - orchestrates infrastructure calls
export {
  isSearchCached,
  markSearchAsCached,
  unmarkSearchAsCached,
} from '~/modules/search/infrastructure/supabaseSearchCacheRepository'
