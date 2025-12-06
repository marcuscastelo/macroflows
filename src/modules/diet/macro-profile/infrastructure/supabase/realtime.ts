import {
  type MacroProfile,
  macroProfileSchema,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { SUPABASE_TABLE_MACRO_PROFILES } from '~/modules/diet/macro-profile/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

export function initializeMacroProfileRealtime(callbacks: {
  onInsert: (profile: MacroProfile) => void
  onUpdate: (profile: MacroProfile) => void
  onDelete: (profile: MacroProfile) => void
}): void {
  if (initialized) {
    return
  }
  logging.debug(`Macro profile realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_MACRO_PROFILES,
    macroProfileSchema,
    (event) => {
      logging.debug(`Event:`, event)

      switch (event.eventType) {
        case 'INSERT': {
          if (event.new) {
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
