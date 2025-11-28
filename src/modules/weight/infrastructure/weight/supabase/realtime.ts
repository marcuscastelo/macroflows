import { weightUseCases } from '~/modules/weight/application/weight/usecases/weightUseCases'
import { weightSchema } from '~/modules/weight/domain/weight/weight'
import { SUPABASE_TABLE_WEIGHTS } from '~/modules/weight/infrastructure/weight/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

export function initializeWeightRealtime(): void {
  if (initialized) {
    return
  }
  logging.debug(`Weight realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_WEIGHTS,
    weightSchema,
    (event) => {
      logging.debug(`Weight realtime event ${event.eventType}:`, event)

      switch (event.eventType) {
        case 'INSERT': {
          if (event.new !== undefined) {
            weightUseCases.temp_bypass_get_store().upsertToCache(event.new)
          }
          break
        }

        case 'UPDATE': {
          if (event.new) {
            weightUseCases.temp_bypass_get_store().upsertToCache(event.new)
          }
          break
        }

        case 'DELETE': {
          if (event.old) {
            weightUseCases.temp_bypass_get_store().removeFromCache({
              by: 'id',
              value: event.old.id,
            })
          }
          break
        }
      }
    },
  )
}
