import { type Recipe, recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { createDebug } from '~/shared/utils/createDebug'

const debug = createDebug()

const SUPABASE_TABLE_RECIPES = 'recipes'

/**
 * Sets up granular realtime subscription for recipe changes
 * @param onRecipeChange - Callback for granular updates with event details
 */
export function setupRecipeRealtimeSubscription(
  onRecipeChange: (event: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old?: Recipe
    new?: Recipe
  }) => void,
): void {
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_RECIPES,
    (payload: unknown) => {
      debug(`SUPABASE_TABLE_RECIPES table event: `, payload)
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
          ? recipeSchema.safeParse(payloadData.old)
          : null
      const newRecord =
        payloadData.new !== null
          ? recipeSchema.safeParse(payloadData.new)
          : null

      onRecipeChange({
        eventType,
        old:
          oldRecord !== null && oldRecord.success ? oldRecord.data : undefined,
        new:
          newRecord !== null && newRecord.success ? newRecord.data : undefined,
      })
    },
  )
}
