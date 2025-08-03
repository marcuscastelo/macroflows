import { type CachedSearch } from '~/modules/search/domain/cachedSearch'
import { supabase } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

import { supabaseCachedSearchMapper } from './supabaseCachedSearchMapper'

const debug = createDebug()

function isValidCachedSearchData(data: unknown): data is { search: string } {
  return (
    data !== null &&
    data !== undefined &&
    typeof data === 'object' &&
    'search' in data &&
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    typeof (data as any).search === 'string'
  )
}

export type CachedSearchRealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: CachedSearch
  old?: CachedSearch
}

export function setupCachedSearchRealtimeSubscription(
  onEvent: (event: CachedSearchRealtimeEvent) => void,
) {
  debug('Setting up cached search realtime subscription')

  const subscription = supabase
    .channel('cached-search-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cached_searches',
      },
      (payload: {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        new?: unknown
        old?: unknown
      }) => {
        debug('Realtime payload received:', payload)

        const event: CachedSearchRealtimeEvent = {
          eventType: payload.eventType,
        }

        if (isValidCachedSearchData(payload.new)) {
          event.new = supabaseCachedSearchMapper.toDomain(payload.new)
        }

        if (isValidCachedSearchData(payload.old)) {
          event.old = supabaseCachedSearchMapper.toDomain(payload.old)
        }

        onEvent(event)
      },
    )
    .subscribe()

  return subscription
}
