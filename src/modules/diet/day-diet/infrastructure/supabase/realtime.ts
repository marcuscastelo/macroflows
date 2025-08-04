import {
  type DayDiet,
  dayDietSchema,
} from '~/modules/diet/day-diet/domain/dayDiet'
import { SUPABASE_TABLE_DAYS } from '~/modules/diet/day-diet/infrastructure/supabase/supabaseDayGateway'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

/**
 * Sets up granular realtime subscription for day diet changes
 * @param onDayDietChange - Callback for granular updates with event details
 */
export function setupDayDietRealtimeSubscription(
  onDayDietChange: (event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old?: DayDiet
    new?: DayDiet
  }) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_DAYS,
    dayDietSchema,
    (payload: unknown) => {
      debug(`SUPABASE_TABLE_DAYS table event: `, payload)
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
          ? dayDietSchema.safeParse(payloadData.old)
          : null
      const newRecord =
        payloadData.new !== null
          ? dayDietSchema.safeParse(payloadData.new)
          : null

      onDayDietChange({
        eventType,
        old:
          oldRecord !== null && oldRecord.success ? oldRecord.data : undefined,
        new:
          newRecord !== null && newRecord.success ? newRecord.data : undefined,
      })
    },
  )
}
