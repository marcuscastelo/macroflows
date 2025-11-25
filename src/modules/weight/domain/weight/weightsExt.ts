import { type Weight } from '~/modules/weight/domain/weight/weight'

export const WeightsExt = {
  sortedByDate(weights: readonly Weight[]) {
    return [...weights].sort(
      (a, b) => a.target_timestamp.getTime() - b.target_timestamp.getTime(),
    )
  },

  oldest(weights: readonly Weight[]): Weight | undefined {
    return WeightsExt.sortedByDate(weights)[0]
  },

  latest(weights: readonly Weight[]): Weight | undefined {
    return WeightsExt.sortedByDate(weights)[weights.length - 1]
  },

  effectiveAt(weights: readonly Weight[], date: Date): Weight | undefined {
    return [...weights]
      .reverse()
      .find((item) => item.target_timestamp.getTime() <= date.getTime())
  },

  of(weights: readonly Weight[]) {
    return {
      sortedByDate: () => WeightsExt.sortedByDate(weights),
      oldest: () => WeightsExt.oldest(weights),
      latest: () => WeightsExt.latest(weights),
      effectiveAt: (date: Date) => WeightsExt.effectiveAt(weights, date),
    }
  },
}
