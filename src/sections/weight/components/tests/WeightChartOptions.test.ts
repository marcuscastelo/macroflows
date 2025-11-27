import { describe, expect, it } from 'vitest'

import { buildWeightChartOptions } from '~/sections/weight/components/WeightChartOptions'

/**
 * Helper to extract formatter with unknown input type for testing edge cases.
 * ApexCharts may pass undefined/null values to formatters in some scenarios.
 */
function getYAxisFormatter(
  options: ReturnType<typeof buildWeightChartOptions>,
) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return options.yaxis.labels.formatter as (val: unknown) => string
}

describe('WeightChartOptions', () => {
  describe('buildWeightChartOptions', () => {
    // Using min=75, max=77 so diff=4 and decimalsInFloat=1
    const baseParams = {
      min: 75,
      max: 77,
      weightsByPeriod: {},
      polishedData: [],
      isMobile: false,
    }

    describe('yaxis labels formatter', () => {
      it('formats valid number values correctly', () => {
        const options = buildWeightChartOptions(baseParams)
        const formatter = getYAxisFormatter(options)

        expect(formatter(75)).toBe('75.0 kg')
        expect(formatter(75.5)).toBe('75.5 kg')
        expect(formatter(75.12)).toBe('75.1 kg')
      })

      it('returns empty string for undefined values', () => {
        const options = buildWeightChartOptions(baseParams)
        const formatter = getYAxisFormatter(options)

        expect(formatter(undefined)).toBe('')
      })

      it('returns empty string for null values', () => {
        const options = buildWeightChartOptions(baseParams)
        const formatter = getYAxisFormatter(options)

        expect(formatter(null)).toBe('')
      })

      it('returns empty string for NaN values', () => {
        const options = buildWeightChartOptions(baseParams)
        const formatter = getYAxisFormatter(options)

        expect(formatter(NaN)).toBe('')
      })

      it('returns empty string for Infinity values', () => {
        const options = buildWeightChartOptions(baseParams)
        const formatter = getYAxisFormatter(options)

        expect(formatter(Infinity)).toBe('')
        expect(formatter(-Infinity)).toBe('')
      })

      it('handles string number values', () => {
        const options = buildWeightChartOptions(baseParams)
        const formatter = getYAxisFormatter(options)

        // String numbers should be converted to numbers
        expect(formatter('75')).toBe('75.0 kg')
        expect(formatter('75.5')).toBe('75.5 kg')
      })

      it('returns empty string for non-numeric strings', () => {
        const options = buildWeightChartOptions(baseParams)
        const formatter = getYAxisFormatter(options)

        expect(formatter('not a number')).toBe('')
      })
    })
  })
})
