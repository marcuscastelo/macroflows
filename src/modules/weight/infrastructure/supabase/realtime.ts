import { weightSchema } from '~/modules/weight/domain/weight'
import { SUPABASE_TABLE_WEIGHTS } from '~/modules/weight/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

let initialized = false

export function initializeRecentFoodRealtime(): void {
  if (initialized) {
    return
  }
  debug(`Recent food realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_WEIGHTS,
    weightSchema,
    (event) => {
      debug(`Event:`, event)
    },
  )
}
