import {
  type MacroProfile,
  macroProfileSchema,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

const SUPABASE_TABLE_MACRO_PROFILES = 'macro_profiles'

type MacroProfileRealtimeCallbacks = {
  onInsert: (profile: MacroProfile) => void
  onUpdate: (profile: MacroProfile) => void
  onDelete: (profile: MacroProfile) => void
}

export function createMacroProfileRealtimeService() {
  let initialized = false

  function initializeMacroProfileRealtime(
    callbacks: MacroProfileRealtimeCallbacks,
  ): void {
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

  return {
    initializeMacroProfileRealtime,
  }
}
