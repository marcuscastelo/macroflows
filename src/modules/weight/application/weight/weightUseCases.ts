import { currentUserId } from '~/modules/user/application/user'
import {
  userWeights,
  weightCrudService,
} from '~/modules/weight/application/weight/weightState'
import {
  createNewWeight,
  type Weight,
} from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'

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
  latest: () => WeightsExt.of(userWeights()).latest(),
  oldest: () => WeightsExt.of(userWeights()).oldest(),
  effectiveAt: (date: Date) => WeightsExt.of(userWeights()).effectiveAt(date),
  insertWeight,
}
