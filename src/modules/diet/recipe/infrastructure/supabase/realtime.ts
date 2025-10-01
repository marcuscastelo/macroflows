import { type Recipe, recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import { recipeCacheStore } from '~/modules/diet/recipe/infrastructure/signals/recipeCacheStore'
import { SUPABASE_TABLE_RECIPES } from '~/modules/diet/recipe/infrastructure/supabase/constants'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

let initialized = false

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
    recipeSchema,
    onRecipeChange,
  )
}

export function initializeRecipeRealtime(): void {
  if (initialized) {
    return
  }
  logging.debug(`Recipe realtime initialized!`)
  initialized = true
  registerSubapabaseRealtimeCallback(
    SUPABASE_TABLE_RECIPES,
    recipeSchema,
    (event) => {
      logging.debug(`Event:`, event)

      switch (event.eventType) {
        case 'INSERT': {
          if (event.new !== undefined) {
            recipeCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'UPDATE': {
          if (event.new) {
            recipeCacheStore.upsertToCache(event.new)
          }
          break
        }

        case 'DELETE': {
          if (event.old) {
            recipeCacheStore.removeFromCache({ by: 'id', value: event.old.id })
          }
          break
        }
      }
    },
  )
}
