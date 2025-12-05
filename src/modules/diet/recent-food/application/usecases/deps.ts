import { createRoot } from 'solid-js'

import { createRecentFoodCrudService } from '~/modules/diet/recent-food/application/services/recentFoodCrudService'
import { createRecentFoodRepository } from '~/modules/diet/recent-food/infrastructure/recentFoodRepository'
import { initializeRecentFoodRealtime } from '~/modules/diet/recent-food/infrastructure/supabase/realtime'
import { createSupabaseRecentFoodGateway } from '~/modules/diet/recent-food/infrastructure/supabase/supabaseRecentFoodGateway'

// Centralized dependency wiring for recent-food use-cases.
// This file performs the minimal initialization (createRoot) once and
// exports the constructed service for use by individual use-case modules.
const { recentFoodCrudService } = createRoot(() => {
  const supabaseRecentFoodGateway = createSupabaseRecentFoodGateway()
  const repository = createRecentFoodRepository(supabaseRecentFoodGateway)
  const recentFoodCrudService = createRecentFoodCrudService(repository)

  // TODO: Implement recent food cache using realtime updates
  initializeRecentFoodRealtime({
    onInsert: (_: unknown) => {},
    onUpdate: (_: unknown) => {},
    onDelete: (_: unknown) => {},
  })

  return { recentFoodCrudService }
})

export { recentFoodCrudService }
