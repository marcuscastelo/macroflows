import { createRoot } from 'solid-js'

import { createRecentFoodCrudService } from '~/modules/diet/recent-food/application/services/recentFoodCrudService'
import { createRecentFoodRepository } from '~/modules/diet/recent-food/infrastructure/recentFoodRepository'
import { createSupabaseRecentFoodGateway } from '~/modules/diet/recent-food/infrastructure/supabase/supabaseRecentFoodGateway'

// Centralized dependency wiring for recent-food use-cases.
// This file performs the minimal initialization (createRoot) once and
// exports the constructed service for use by individual use-case modules.
/**
 * Shared instance of the recent-food CRUD service, wired with the Supabase-backed repository.
 *
 * Realtime subscriptions should be initialized alongside a concrete cache implementation
 * instead of at module import time to avoid unnecessary realtime traffic.
 */
const { recentFoodCrudService } = createRoot(() => {
  const supabaseRecentFoodGateway = createSupabaseRecentFoodGateway()
  const repository = createRecentFoodRepository(supabaseRecentFoodGateway)
  const recentFoodCrudService = createRecentFoodCrudService(repository)

  // TODO: Re-enable recent food realtime once there is a cache/store consumer for these events.
  // Until then, avoid opening a subscription with no-op handlers.

  return { recentFoodCrudService }
})

export { recentFoodCrudService }
