import { describe, expect, it } from 'vitest'

import { type Weight } from '~/modules/weight/domain/weight/weight'
import { WeightsExt } from '~/modules/weight/domain/weight/weightsExt'

function createWeight(
  id: number,
  weight: number,
  target_timestamp: Date,
): Weight {
  return {
    id,
    user_id: 'test-user',
    weight,
    target_timestamp,
    __type: 'Weight' as const,
  }
}

describe('WeightsExt', () => {
  describe('sortedByDate', () => {
    it('should sort weights by target_timestamp ascending', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-03-01')),
        createWeight(2, 72, new Date('2024-01-01')),
        createWeight(3, 71, new Date('2024-02-01')),
      ]

      const sorted = WeightsExt.sortedByDate(weights)

      expect(sorted[0]?.id).toBe(2)
      expect(sorted[1]?.id).toBe(3)
      expect(sorted[2]?.id).toBe(1)
    })

    it('should not mutate the original array', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-03-01')),
        createWeight(2, 72, new Date('2024-01-01')),
      ]
      const originalFirstId = weights[0]?.id

      WeightsExt.sortedByDate(weights)

      expect(weights[0]?.id).toBe(originalFirstId)
    })

    it('should handle empty array', () => {
      const sorted = WeightsExt.sortedByDate([])
      expect(sorted).toEqual([])
    })

    it('should handle single element', () => {
      const weights: Weight[] = [createWeight(1, 70, new Date('2024-01-01'))]
      const sorted = WeightsExt.sortedByDate(weights)
      expect(sorted.length).toBe(1)
      expect(sorted[0]?.id).toBe(1)
    })
  })

  describe('oldest', () => {
    it('should return the weight with earliest timestamp', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-03-01')),
        createWeight(2, 72, new Date('2024-01-01')),
        createWeight(3, 71, new Date('2024-02-01')),
      ]

      const oldest = WeightsExt.oldest(weights)

      expect(oldest?.id).toBe(2)
    })

    it('should return undefined for empty array', () => {
      const oldest = WeightsExt.oldest([])
      expect(oldest).toBeUndefined()
    })
  })

  describe('latest', () => {
    it('should return the weight with latest timestamp', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-03-01')),
        createWeight(2, 72, new Date('2024-01-01')),
        createWeight(3, 71, new Date('2024-02-01')),
      ]

      const latest = WeightsExt.latest(weights)

      expect(latest?.id).toBe(1)
    })

    it('should return undefined for empty array', () => {
      const latest = WeightsExt.latest([])
      expect(latest).toBeUndefined()
    })
  })

  describe('effectiveAt', () => {
    it('should return the most recent weight at or before the given date', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-01-01')),
        createWeight(2, 72, new Date('2024-02-01')),
        createWeight(3, 74, new Date('2024-03-01')),
      ]

      // Date between Feb and Mar, should return Feb weight
      const effective = WeightsExt.effectiveAt(weights, new Date('2024-02-15'))

      expect(effective?.id).toBe(2)
      expect(effective?.weight).toBe(72)
    })

    it('should return exact match when date equals timestamp', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-01-01')),
        createWeight(2, 72, new Date('2024-02-01')),
        createWeight(3, 74, new Date('2024-03-01')),
      ]

      const effective = WeightsExt.effectiveAt(weights, new Date('2024-02-01'))

      expect(effective?.id).toBe(2)
    })

    it('should return the latest weight when date is after all weights', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-01-01')),
        createWeight(2, 72, new Date('2024-02-01')),
        createWeight(3, 74, new Date('2024-03-01')),
      ]

      const effective = WeightsExt.effectiveAt(weights, new Date('2024-12-01'))

      expect(effective?.id).toBe(3)
    })

    it('should return undefined when date is before all weights', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-01-01')),
        createWeight(2, 72, new Date('2024-02-01')),
      ]

      const effective = WeightsExt.effectiveAt(weights, new Date('2023-01-01'))

      expect(effective).toBeUndefined()
    })

    it('should return undefined for empty array', () => {
      const effective = WeightsExt.effectiveAt([], new Date('2024-01-01'))
      expect(effective).toBeUndefined()
    })

    it('should handle unsorted input array', () => {
      // Array is intentionally out of order
      const weights: Weight[] = [
        createWeight(3, 74, new Date('2024-03-01')),
        createWeight(1, 70, new Date('2024-01-01')),
        createWeight(2, 72, new Date('2024-02-01')),
      ]

      const effective = WeightsExt.effectiveAt(weights, new Date('2024-02-15'))

      expect(effective?.id).toBe(2)
    })

    it('should handle weights with same timestamp', () => {
      const sameDate = new Date('2024-01-01')
      const weights: Weight[] = [
        createWeight(1, 70, sameDate),
        createWeight(2, 72, sameDate),
      ]

      const effective = WeightsExt.effectiveAt(weights, new Date('2024-01-15'))

      // Should return one of the weights with the same timestamp
      expect(effective?.target_timestamp.getTime()).toBe(sameDate.getTime())
    })

    it('should not mutate the original array', () => {
      const weights: Weight[] = [
        createWeight(3, 74, new Date('2024-03-01')),
        createWeight(1, 70, new Date('2024-01-01')),
      ]
      const originalFirstId = weights[0]?.id

      WeightsExt.effectiveAt(weights, new Date('2024-02-01'))

      expect(weights[0]?.id).toBe(originalFirstId)
    })
  })

  describe('of', () => {
    it('should create an object with all methods bound to weights', () => {
      const weights: Weight[] = [
        createWeight(1, 70, new Date('2024-01-01')),
        createWeight(2, 72, new Date('2024-02-01')),
        createWeight(3, 74, new Date('2024-03-01')),
      ]

      const ext = WeightsExt.of(weights)

      expect(ext.sortedByDate()).toHaveLength(3)
      expect(ext.oldest()?.id).toBe(1)
      expect(ext.latest()?.id).toBe(3)
      expect(ext.effectiveAt(new Date('2024-02-15'))?.id).toBe(2)
    })
  })
})
