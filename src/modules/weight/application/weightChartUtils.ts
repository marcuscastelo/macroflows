// Application-level chart utilities for weight evolution
import { type OHLC } from '~/modules/measure/domain/ohlc'
import { type Weight } from '~/modules/weight/domain/weight'
import { getFirstWeight, getLatestWeight } from '~/shared/utils/weightUtils'

/**
 * Type for chart data with OHLC and date, used in buildChartData.
 */
export type WeightChartOHLC = OHLC & { date: string; isInterpolated?: boolean }

/**
 * Builds chart data from grouped weights, interpolating missing periods.
 * @param weightsByPeriod - Record of period label to weights
 * @returns Array of WeightChartOHLC
 */
export function buildChartData(
  weightsByPeriod: Record<string, Weight[]>,
): WeightChartOHLC[] {
  const entries = Object.entries(weightsByPeriod)
  const filled: Array<OHLC & { date: string; isInterpolated?: boolean }> = []
  let lastValue: number | undefined
  let i = 0
  let firstNonEmptyIdx = entries.findIndex(([, ws]) => ws.length > 0)
  let firstNonEmptyValue: number | undefined =
    firstNonEmptyIdx !== -1 && entries[firstNonEmptyIdx]
      ? getFirstWeight(entries[firstNonEmptyIdx][1])?.weight
      : undefined
  while (i < entries.length) {
    const entry = entries[i]
    if (!entry) break
    const [period, weights] = entry
    if (weights.length > 0) {
      const open = getFirstWeight(weights)?.weight ?? 0
      const low = Math.min(...weights.map((w) => w.weight))
      const high = Math.max(...weights.map((w) => w.weight))
      const close = getLatestWeight(weights)?.weight ?? 0
      lastValue = close
      filled.push({ date: period, open, close, high, low })
      i++
    } else {
      let nextIdx = i + 1
      while (
        nextIdx < entries.length &&
        entries[nextIdx] !== undefined &&
        Array.isArray(entries[nextIdx]?.[1]) &&
        entries[nextIdx]?.[1]?.length === 0
      )
        nextIdx++
      const nextEntry = entries[nextIdx]
      const nextWeights = nextEntry ? nextEntry[1] : undefined
      let nextValue: number | undefined = lastValue
      if (nextWeights && nextWeights.length > 0)
        nextValue = getFirstWeight(nextWeights)?.weight
      const steps = nextIdx - i + 1
      for (let j = 0; j < nextIdx - i; j++) {
        let interp = lastValue
        if (lastValue === undefined && firstNonEmptyValue !== undefined)
          interp = firstNonEmptyValue
        else if (
          lastValue !== undefined &&
          nextValue !== undefined &&
          steps > 1
        )
          interp = lastValue + ((nextValue - lastValue) * (j + 1)) / steps
        const fakeEntry = entries[i + j]
        filled.push({
          date: fakeEntry ? fakeEntry[0] : '',
          open: interp ?? 0,
          close: interp ?? 0,
          high: interp ?? 0,
          low: interp ?? 0,
          isInterpolated: true,
        })
      }
      i = nextIdx
    }
  }
  return filled
}

/**
 * Returns y-axis config for chart based on min/max values.
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Y-axis config object
 */
export function getYAxisConfig(min: number, max: number) {
  const diff = max - min + 2
  if (diff <= 2)
    return {
      tickAmount: Math.round(diff * 10),
      decimalsInFloat: 2,
      tickInterval: 0.1,
    }
  if (diff < 4)
    return {
      tickAmount: Math.round(diff * 4),
      decimalsInFloat: 2,
      tickInterval: 0.25,
    }
  if (diff < 10)
    return {
      tickAmount: Math.round(diff * 2),
      decimalsInFloat: 1,
      tickInterval: 0.5,
    }
  if (diff < 20)
    return { tickAmount: Math.ceil(diff), decimalsInFloat: 0, tickInterval: 1 }
  if (diff < 40) {
    return {
      tickAmount: Math.ceil(diff / 2),
      decimalsInFloat: 0,
      tickInterval: 2,
    }
  }
  if (diff < 60) {
    return {
      tickAmount: Math.ceil(diff / 4),
      decimalsInFloat: 0,
      tickInterval: 4,
    }
  }
  return { tickAmount: undefined, decimalsInFloat: 0, tickInterval: undefined }
}
