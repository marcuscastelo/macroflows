import { describe, expect, it } from 'vitest'

import {
  createNewWeight,
  promoteToWeight,
  type Weight,
} from '~/modules/weight/domain/weight'
import {
  getCandlePeriod,
  groupWeightsByPeriod,
} from '~/modules/weight/domain/weightEvolutionDomain'

/**
 * Creates test weight data spanning multiple days
 */
function createTestWeights(startDate: string, weights: number[]): Weight[] {
  const baseDate = new Date(startDate)
  return weights.map((weight, index) => {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + index)
    const newWeight = createNewWeight({
      user_id: '',
      weight,
      target_timestamp: date.toISOString(),
    })
    return promoteToWeight(newWeight, { id: index + 1 })
  })
}

describe('Weight Evolution Domain', () => {
  describe('getCandlePeriod', () => {
    it('should return correct period config for daily periods', () => {
      expect(getCandlePeriod('7d', false)).toEqual({ days: 1, count: 7 })
      expect(getCandlePeriod('14d', false)).toEqual({ days: 1, count: 14 })
      expect(getCandlePeriod('30d', false)).toEqual({ days: 3, count: 12 })
    })

    it('should return correct period config for new 3m period', () => {
      expect(getCandlePeriod('3m', false)).toEqual({ days: 8, count: 12 })
    })

    it('should return correct period config for longer periods', () => {
      expect(getCandlePeriod('6m', false)).toEqual({ days: 15, count: 12 })
      expect(getCandlePeriod('1y', false)).toEqual({ days: 30, count: 12 })
      expect(getCandlePeriod('all', false)).toEqual({ days: 0, count: 12 })
    })

    it('should return default period for unknown types', () => {
      expect(getCandlePeriod('unknown', false)).toEqual({ days: 1, count: 7 })
      expect(getCandlePeriod('', false)).toEqual({ days: 1, count: 7 })
    })
  })

  describe('groupWeightsByPeriod - Period Stability', () => {
    it('should maintain stable periods when new data is added (7d)', () => {
      // Initial data: weights on days 1, 2, 3
      const initialWeights = createTestWeights('2024-01-01', [70, 71, 72])
      const initialPeriods = groupWeightsByPeriod(initialWeights, '7d', false)

      // Add new weight on day 4
      const newWeight = createTestWeights('2024-01-04', [73])[0]!
      const updatedWeights = [...initialWeights, newWeight]
      const updatedPeriods = groupWeightsByPeriod(updatedWeights, '7d', false)

      // Historical periods should remain unchanged
      const initialKeys = Object.keys(initialPeriods).slice(0, 3)
      initialKeys.forEach((key) => {
        if (initialPeriods[key] && updatedPeriods[key]) {
          expect(updatedPeriods[key]).toEqual(initialPeriods[key])
        }
      })
    })

    it('should maintain stable periods when new data is added (3m)', () => {
      // Initial data: weights spread over several weeks
      const initialWeights = createTestWeights(
        '2024-01-01',
        [70, 71, 72, 73, 74],
      )
      const initialPeriods = groupWeightsByPeriod(initialWeights, '3m', false)

      // Add new weight 2 weeks later
      const additionalWeights = createTestWeights('2024-01-15', [75, 76])
      const updatedWeights = [...initialWeights, ...additionalWeights]
      const updatedPeriods = groupWeightsByPeriod(updatedWeights, '3m', false)

      // First few periods should remain identical
      const initialEntries = Object.entries(initialPeriods).slice(0, 2)
      initialEntries.forEach(([key, weights]) => {
        expect(updatedPeriods[key]).toEqual(weights)
      })
    })

    it('should use calendar day boundaries for daily periods', () => {
      const weights = createTestWeights('2024-01-01T10:30:00Z', [70, 71])
      const periods = groupWeightsByPeriod(weights, '7d', false)

      // Periods should start at 00:00:00 regardless of input time
      const periodKeys = Object.keys(periods)
      expect(periodKeys.length).toBeGreaterThan(0)

      // Check that periods follow calendar day pattern
      periodKeys.forEach((key) => {
        expect(key).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} - \d{1,2}\/\d{1,2}\/\d{4}/)
      })
    })

    it('should create fixed intervals for weekly/monthly periods', () => {
      const weights = createTestWeights('2024-01-01', [70, 71, 72, 73, 74, 75])
      const periods3m = groupWeightsByPeriod(weights, '3m', false)
      const periods6m = groupWeightsByPeriod(weights, '6m', false)

      // Should create appropriate number of periods
      expect(Object.keys(periods3m).length).toBeLessThanOrEqual(12)
      expect(Object.keys(periods6m).length).toBeLessThanOrEqual(12)
    })

    it('should handle empty weights array', () => {
      const periods = groupWeightsByPeriod([], '7d', false)
      expect(periods).toEqual({})
    })

    it('should maintain period stability across multiple additions', () => {
      // Start with 3 weights
      let weights = createTestWeights('2024-01-01', [70, 71, 72])
      let periods = groupWeightsByPeriod(weights, '7d', false)
      const originalFirstPeriod = periods[Object.keys(periods)[0]!]!

      // Add weights one by one and verify first period stays stable
      for (let i = 4; i <= 10; i++) {
        const newWeight = createTestWeights(`2024-01-0${i}`, [70 + i])[0]!
        weights = [...weights, newWeight]
        periods = groupWeightsByPeriod(weights, '7d', false)

        const currentFirstPeriod = periods[Object.keys(periods)[0]!]!
        expect(currentFirstPeriod).toEqual(originalFirstPeriod)
      }
    })

    it('should keep "all" period logic unchanged (baseline)', () => {
      const weights = createTestWeights('2024-01-01', [70, 71, 72, 73])
      const periods = groupWeightsByPeriod(weights, 'all', false)

      // Should create 12 periods for 'all' type
      expect(Object.keys(periods).length).toBe(12)
    })
  })

  describe('groupWeightsByPeriod - Data Integrity', () => {
    it('should maintain weight object integrity', () => {
      const originalWeights = createTestWeights(
        '2024-01-01',
        [70.5, 71.2, 72.8],
      )
      const periods = groupWeightsByPeriod(originalWeights, '7d', false)

      // All weights should maintain their original values
      const allPeriodsWeights = Object.values(periods).flat()
      allPeriodsWeights.forEach((weight) => {
        const original = originalWeights.find((w) => w.id === weight.id)
        expect(original).toBeDefined()
        expect(weight).toEqual(original)
      })
    })
  })
})
