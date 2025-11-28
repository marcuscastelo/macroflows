import { createRoot } from 'solid-js'

import { currentUserId } from '~/modules/user/application/user'
import { createWeightCacheStore } from '~/modules/weight/application/weight/store/weightCacheStore'
import { weightCrudService } from '~/modules/weight/application/weight/weightState'
import {
  createNewWeight,
  type Weight,
} from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'

const cache = createRoot(() => createWeightCacheStore())

async function insertWeight(weight: Weight['weight']) {
  const userId = currentUserId()

  await weightCrudService.insertWeight(
    createNewWeight({
      user_id: userId,
      weight,
      target_timestamp: new Date(Date.now()),
    }),
  )
}

export const weightUseCases = {
  weights: () => cache.weights(),
  temp_bypass_get_store: () => cache,
  latest: () => WeightsExt.of(cache.weights()).latest(),
  oldest: () => WeightsExt.of(cache.weights()).oldest(),
  effectiveAt: (date: Date) => WeightsExt.of(cache.weights()).effectiveAt(date),
  insertWeight,
}
