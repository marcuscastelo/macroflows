import {
  type CachedSearch,
  cachedSearchSchema,
} from '~/modules/search/domain/cachedSearch'
import { SUPABASE_TABLE_CACHED_SEARCHES } from '~/modules/search/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

export function initializeCachedSearchRealtime(callbacks: {
  onInsert: (newRecord: CachedSearch) => void
  onUpdate: (newRecord: CachedSearch) => void
  onDelete: (oldRecord: CachedSearch) => void
}): void {
  if (initialized) {
    return
  }
  logging.debug(`Cached search realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_CACHED_SEARCHES,
    cachedSearchSchema,
    (event) => {
      logging.debug(`Event:`, event)

      switch (event.eventType) {
        case 'INSERT': {
          if (event.new !== undefined) {
            callbacks.onInsert(event.new)
          }
          break
        }

        case 'UPDATE': {
          if (event.new) {
            callbacks.onUpdate(event.new)
          }
          break
        }

        case 'DELETE': {
          if (event.old) {
            callbacks.onDelete(event.old)
          }
          break
        }
      }
    },
  )
}
