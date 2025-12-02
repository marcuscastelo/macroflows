import { createEffect, createRoot } from 'solid-js'

import { authUseCases } from '~/modules/auth/application/usecases/authUseCases'
import { createRecipeCacheManagementService } from '~/modules/diet/recipe/application/services/cacheManagement'
import { fetchUserRecipes } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { recipeCacheStore } from '~/modules/diet/recipe/infrastructure/signals/recipeCacheStore'
import { logging } from '~/shared/utils/logging'

const runCacheManagement = createRecipeCacheManagementService({
  getExistingRecipes: () => recipeCacheStore.getRecipes(),
  clearCache: recipeCacheStore.clearCache,
  fetchUserRecipes: (userId) => void fetchUserRecipes(userId),
})

let initialized = false
export function initializeRecipeEffects() {
  if (initialized) {
    return
  }
  initialized = true
  return createRoot(() => {
    createEffect(() => {
      const userId = authUseCases.currentUserIdOrGuestId()
      logging.debug(`Recipe cache effect - user changed to ${userId}`)

      runCacheManagement({ userId })
    })
  })
}
