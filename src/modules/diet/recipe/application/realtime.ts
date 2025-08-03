import { recipeCacheStore } from '~/modules/diet/recipe/infrastructure/signals/recipeCacheStore'
import { setupRecipeRealtimeSubscription } from '~/modules/diet/recipe/infrastructure/supabase/realtime'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false
export function initializeRecipeRealtime() {
  if (initialized) {
    return
  }
  debug(`Recipe realtime initialized!`)
  initialized = true

  setupRecipeRealtimeSubscription((event) => {
    debug(`Recipe realtime event ${event.eventType}:`, event)

    switch (event.eventType) {
      case 'INSERT': {
        if (event.new !== undefined) {
          recipeCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'UPDATE': {
        if (event.new) {
          recipeCacheStore.upsertToCache(event.new)
        }
        break
      }

      case 'DELETE': {
        if (event.old) {
          recipeCacheStore.removeFromCache({ by: 'id', value: event.old.id })
        }
        break
      }
    }
  })
}
