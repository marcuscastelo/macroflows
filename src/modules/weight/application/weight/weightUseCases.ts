import { userWeights } from '~/modules/weight/application/weight/weightState'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'

export const weightUseCases = {
  latest: () => WeightsExt.of(userWeights()).latest(),
  oldest: () => WeightsExt.of(userWeights()).oldest(),
  effectiveAt: (date: Date) => WeightsExt.of(userWeights()).effectiveAt(date),
}
