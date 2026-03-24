import {
  type DayDiet,
  dayDietSchema,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { SUPABASE_TABLE_DAYS } from '~/modules/diet/day-diet/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

type DayDietRealtimeCallbacks = {
  onInsert: (newDayDiet: DayDiet) => void
  onUpdate: (newDayDiet: DayDiet) => void
  onDelete: (oldDayDiet: DayDiet) => void
}

export function createDayDietRealtimeService() {
  let initialized = false

  function initializeDayDietRealtime(
    callbacks: DayDietRealtimeCallbacks,
  ): void {
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

  return {
    initializeDayDietRealtime,
  }
}
