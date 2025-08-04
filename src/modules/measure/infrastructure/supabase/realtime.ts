import {
  type BodyMeasure,
  bodyMeasureSchema,
} from '~/modules/measure/domain/measure'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()
const SUPABASE_TABLE_BODY_MEASURES = 'body_measures'

/**
 * Sets up granular realtime subscription for body measure changes
 * @param onBodyMeasureChange - Callback for granular updates with event details
 */
export function setupBodyMeasureRealtimeSubscription(
  onBodyMeasureChange: (event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old?: BodyMeasure
    new?: BodyMeasure
  }) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_BODY_MEASURES,
    bodyMeasureSchema,
    (payload: unknown) => {
      debug(`SUPABASE_TABLE_BODY_MEASURES table event: `, payload)
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
          ? bodyMeasureSchema.safeParse(payloadData.old)
          : null
      const newRecord =
        payloadData.new !== null
          ? bodyMeasureSchema.safeParse(payloadData.new)
          : null

      onBodyMeasureChange({
        eventType,
        old:
          oldRecord !== null && oldRecord.success ? oldRecord.data : undefined,
        new:
          newRecord !== null && newRecord.success ? newRecord.data : undefined,
      })
    },
  )
}
