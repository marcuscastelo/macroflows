import { weightSchema } from '~/modules/weight/domain/weight'
import { SUPABASE_TABLE_WEIGHTS } from '~/modules/weight/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false

export function initializeWeightRealtime(): void {
  if (initialized) {
    return
  }
  debug(`Weight realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_WEIGHTS,
    weightSchema,
    (event) => {
      debug(`Event:`, event)

      // TODO: Integrate with weight cache store for real-time updates
      // Similar to day-diet pattern: upsert/remove from cache based on event
    },
  )
}
