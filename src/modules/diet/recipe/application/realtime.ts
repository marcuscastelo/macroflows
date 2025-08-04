import { initializeRecipeRealtime as initializeRecipeRealtimeInfra } from '~/modules/diet/recipe/infrastructure/supabase/realtime'

let initialized = false
export function initializeRecipeRealtime() {
  if (initialized) {
    return
  }
  initialized = true
  initializeRecipeRealtimeInfra()
}
