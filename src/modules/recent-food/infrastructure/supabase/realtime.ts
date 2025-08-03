import {
  type RecentFood,
  recentFoodSchema,
} from '~/modules/recent-food/domain/recentFood'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

const SUPABASE_TABLE_RECENT_FOODS = 'recent_foods'

/**
 * Sets up granular realtime subscription for recent food changes
 * @param onRecentFoodChange - Callback for granular updates with event details
 */
export function setupRecentFoodRealtimeSubscription(
  onRecentFoodChange: (event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old?: RecentFood
    new?: RecentFood
  }) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_RECENT_FOODS,
    (payload: unknown) => {
      debug(`SUPABASE_TABLE_RECENT_FOODS table event: `, payload)
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
          ? recentFoodSchema.safeParse(payloadData.old)
          : null
      const newRecord =
        payloadData.new !== null
          ? recentFoodSchema.safeParse(payloadData.new)
          : null

      onRecentFoodChange({
        eventType,
        old:
          oldRecord !== null && oldRecord.success ? oldRecord.data : undefined,
        new:
          newRecord !== null && newRecord.success ? newRecord.data : undefined,
      })
    },
  )
}
