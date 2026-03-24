import { type Recipe, recipeSchema } from '~/modules/diet/recipe/domain/recipe'
import { registerSubapabaseRealtimeCallback } from '~/shared/supabase/supabase'
import { logging } from '~/shared/utils/logging'

const SUPABASE_TABLE_RECIPES = 'recipes'

export function createRecipeRealtimeService() {
  let initialized = false

  /**
   * Sets up granular realtime subscription for recipe changes
   * @param onRecipeChange - Callback for granular updates with event details
   */
  function setupRecipeRealtimeSubscription(
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

  function initializeRecipeRealtime(): void {
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
      },
    )
  }

  return {
    setupRecipeRealtimeSubscription,
    initializeRecipeRealtime,
  }
}
