import {
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight/weight'
import { SUPABASE_TABLE_WEIGHTS } from '~/modules/weight/infrastructure/weight/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

export function initializeWeightRealtime(callbacks: {
  onInsert: (weight: Weight) => void
  onUpdate: (weight: Weight) => void
  onDelete: (weight: Weight) => void
}): void {
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
