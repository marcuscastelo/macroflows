import {
  type MacroProfile,
  macroProfileSchema,
} from '~/modules/diet/macro-profile/domain/macroProfile'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'

const SUPABASE_TABLE_MACRO_PROFILES = 'macro_profiles'

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
    (payload: unknown) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const payloadData = payload as {
        eventType?: string
        old?: unknown
        new?: unknown
      }

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const eventType = payloadData.eventType as 'INSERT' | 'UPDATE' | 'DELETE'

      // Parse old and new records if available
      const oldRecord =
        payloadData.old !== null
          ? macroProfileSchema.safeParse(payloadData.old)
          : null
      const newRecord =
        payloadData.new !== null
          ? macroProfileSchema.safeParse(payloadData.new)
          : null

      onMacroProfileChange({
        eventType,
        old:
          oldRecord !== null && oldRecord.success ? oldRecord.data : undefined,
        new:
          newRecord !== null && newRecord.success ? newRecord.data : undefined,
      })
    },
  )
}
