import {
  type MacroProfile,
  macroProfileSchema,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { macroProfileCacheStore } from '~/modules/diet/macro-profile/infrastructure/signals/macroProfileCacheStore'
import { SUPABASE_TABLE_MACRO_PROFILES } from '~/modules/diet/macro-profile/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

/**
 * Sets up granular realtime subscription for macro profile changes
 * @param onMacroProfileChange - Callback for granular updates with event details
 */
export function setupMacroProfileRealtimeSubscription(
  onMacroProfileChange: (event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old?: MacroProfile
    new?: MacroProfile
  }) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_MACRO_PROFILES,
    macroProfileSchema,
    onMacroProfileChange,
  )
}

export function initializeMacroProfileRealtime(): void {
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
            macroProfileCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'UPDATE': {
          if (event.new) {
            macroProfileCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'DELETE': {
          if (event.old) {
            macroProfileCacheStore.removeFromCache({
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
