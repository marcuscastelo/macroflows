import { dayCacheStore } from '~/modules/diet/day-diet/application/store/dayCacheStore'
import {
  type DayDiet,
  dayDietSchema,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { SUPABASE_TABLE_DAYS } from '~/modules/diet/day-diet/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

/**
 * Sets up granular realtime subscription for day diet changes
 * @param onDayDietChange - Callback for granular updates with event details
 */
export function setupDayDietRealtimeSubscription(
  onDayDietChange: (event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old?: DayDiet
    new?: DayDiet
  }) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_DAYS,
    dayDietSchema,
    onDayDietChange,
  )
}

export function initializeDayDietRealtime(): void {
  if (initialized) {
    return
  }
  logging.debug(`Day diet realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_DAYS,
    dayDietSchema,
    (event) => {
      logging.debug(`Event:`, event)

      switch (event.eventType) {
        case 'INSERT': {
          if (event.new !== undefined) {
            dayCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'UPDATE': {
          if (event.new) {
            dayCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'DELETE': {
          if (event.old) {
            dayCacheStore.removeFromCache({ by: 'id', value: event.old.id })
          }
          break
        }
      }
    },
  )
}
