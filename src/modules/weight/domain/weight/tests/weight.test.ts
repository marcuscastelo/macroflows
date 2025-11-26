import { describe, expect, it } from 'vitest'

import {
  createNewWeight,
  demoteToNewWeight,
  type NewWeight,
  newWeightSchema,
  promoteToWeight,
  type Weight,
  weightSchema,
} from '~/modules/weight/domain/weight/weight'

describe('Weight Domain', () => {
  describe('weightSchema', () => {
    it('should validate a valid weight object', () => {
      const validWeight = {
        id: 1,
        user_id: '42',
        weight: 75.5,
        target_timestamp: new Date('2023-01-01'),
        __type: 'Weight' as const,
      }

      const result = weightSchema.safeParse(validWeight)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          ...validWeight,
          __type: 'Weight',
        })
      }
    })

    it('should transform string target_timestamp to Date', () => {
      const weightWithStringDate = {
        id: 1,
        user_id: '42',
        weight: 75.5,
        target_timestamp: '2023-01-01T10:00:00Z',
      }

      const result = weightSchema.safeParse(weightWithStringDate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.target_timestamp).toBeInstanceOf(Date)
        expect(result.data.target_timestamp.toISOString()).toBe(
          '2023-01-01T10:00:00.000Z',
        )
      }
    })

    it('should fail validation with missing required fields', () => {
      const invalidWeight = {
        user_id: '42',
        // Missing id, weight, target_timestamp
      }

      const result = weightSchema.safeParse(invalidWeight)
      expect(result.success).toBe(false)
    })

    it('should fail validation with invalid id type', () => {
      const invalidWeight = {
        id: 'not-a-number',
        user_id: '42',
        weight: 75.5,
        target_timestamp: new Date(),
      }

      const result = weightSchema.safeParse(invalidWeight)
      expect(result.success).toBe(false)
    })

    it('should fail validation with invalid owner type', () => {
      const invalidWeight = {
        id: 1,
        user_id: 42,
        weight: 75.5,
        target_timestamp: new Date(),
      }

      const result = weightSchema.safeParse(invalidWeight)
      expect(result.success).toBe(false)
    })

    it('should fail validation with invalid weight type', () => {
      const invalidWeight = {
        id: 1,
        user_id: '42',
        weight: 'not-a-number',
        target_timestamp: new Date(),
      }

      const result = weightSchema.safeParse(invalidWeight)
      expect(result.success).toBe(false)
    })

    it('should handle invalid timestamp string (creates invalid Date)', () => {
      const invalidWeight = {
        id: 1,
        user_id: '42',
        weight: 75.5,
        target_timestamp: 'invalid-date',
      }

      const result = weightSchema.safeParse(invalidWeight)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.target_timestamp).toBeInstanceOf(Date)
        expect(isNaN(result.data.target_timestamp.getTime())).toBe(true)
      }
    })
  })

  describe('newWeightSchema', () => {
    it('should validate a valid new weight object', () => {
      const validNewWeight = {
        user_id: '42',
        weight: 75.5,
        target_timestamp: new Date('2023-01-01'),
        __type: 'NewWeight' as const,
      }

      const result = newWeightSchema.safeParse(validNewWeight)
      expect(result.success).toBe(true)
    })

    it('should transform string target_timestamp to Date', () => {
      const newWeightWithStringDate = {
        user_id: '42',
        weight: 75.5,
        target_timestamp: '2023-01-01T10:00:00Z',
        __type: 'NewWeight',
      }

      const result = newWeightSchema.safeParse(newWeightWithStringDate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.target_timestamp).toBeInstanceOf(Date)
      }
    })

    it('should ignore id field if provided (no strict mode)', () => {
      const invalidNewWeight = {
        id: 1, // Should be ignored in NewWeight
        user_id: '42',
        weight: 75.5,
        target_timestamp: new Date(),
        __type: 'NewWeight',
      }

      const result = newWeightSchema.safeParse(invalidNewWeight)
      expect(result.success).toBe(true)
      if (result.success) {
        expect('id' in result.data).toBe(false)
      }
    })

    it('should fail validation with missing required fields', () => {
      const invalidNewWeight = {
        __type: 'NewWeight' as const,
      }

      const result = newWeightSchema.safeParse(invalidNewWeight)
      expect(result.success).toBe(false)
    })
  })

  describe('createNewWeight', () => {
    it('should create a valid NewWeight', () => {
      const targetDate = new Date('2023-01-01T10:00:00Z')
      const newWeight = createNewWeight({
        user_id: '42',
        weight: 75.5,
        target_timestamp: targetDate,
      })

      expect(newWeight).toEqual({
        user_id: '42',
        weight: 75.5,
        target_timestamp: targetDate,
        __type: 'NewWeight',
      })
    })

    it('should handle different weight values', () => {
      const testCases = [
        { weight: 0.1, description: 'very light weight' },
        { weight: 50.0, description: 'normal weight' },
        { weight: 150.5, description: 'heavy weight' },
        { weight: 300.0, description: 'very heavy weight' },
      ]

      testCases.forEach(({ weight, description: _description }) => {
        const newWeight = createNewWeight({
          user_id: '1',
          weight,
          target_timestamp: new Date(),
        })

        expect(newWeight.weight).toBe(weight)
        expect(newWeight.__type).toBe('NewWeight')
      })
    })

    it('should handle different owner IDs', () => {
      const testCases = [1, 42, 999, 123456].map((a) => a.toString())

      testCases.forEach((owner) => {
        const newWeight = createNewWeight({
          user_id: owner,
          weight: 75.0,
          target_timestamp: new Date(),
        })

        expect(newWeight.user_id).toBe(owner)
      })
    })

    it('should preserve exact timestamp', () => {
      const exactTime = new Date('2023-06-15T14:30:45.123Z')
      const newWeight = createNewWeight({
        user_id: '1',
        weight: 70.0,
        target_timestamp: exactTime,
      })

      expect(newWeight.target_timestamp).toStrictEqual(exactTime)
      expect(newWeight.target_timestamp.getTime()).toBe(exactTime.getTime())
    })
  })

  describe('promoteToWeight', () => {
    it('should promote a NewWeight to Weight with provided id', () => {
      const newWeight: NewWeight = {
        user_id: '42',
        weight: 75.5,
        target_timestamp: new Date('2023-01-01'),
        __type: 'NewWeight',
      }

      const weight = promoteToWeight(newWeight, { id: 123 })

      expect(weight).toEqual({
        id: 123,
        user_id: '42',
        weight: 75.5,
        target_timestamp: newWeight.target_timestamp,
        __type: 'Weight',
      })
    })

    it('should preserve all NewWeight properties', () => {
      const timestamp = new Date('2023-12-25T12:00:00Z')
      const newWeight: NewWeight = {
        user_id: '999',
        weight: 68.7,
        target_timestamp: timestamp,
        __type: 'NewWeight',
      }

      const weight = promoteToWeight(newWeight, { id: 456 })

      expect(weight.user_id).toBe(newWeight.user_id)
      expect(weight.weight).toBe(newWeight.weight)
      expect(weight.target_timestamp).toStrictEqual(newWeight.target_timestamp)
      expect(weight.id).toBe(456)
      expect(weight.__type).toBe('Weight')
    })

    it('should handle different ID values', () => {
      const newWeight: NewWeight = {
        user_id: '1',
        weight: 70.0,
        target_timestamp: new Date(),
        __type: 'NewWeight',
      }

      const testIds = [1, 42, 999, 123456789]
      testIds.forEach((id) => {
        const weight = promoteToWeight(newWeight, { id })
        expect(weight.id).toBe(id)
        expect(weight.__type).toBe('Weight')
      })
    })
  })

  describe('demoteToNewWeight', () => {
    it('should demote a Weight to NewWeight by removing id', () => {
      const weight: Weight = {
        id: 123,
        user_id: '42',
        weight: 75.5,
        target_timestamp: new Date('2023-01-01'),
        __type: 'Weight',
      }

      const newWeight = demoteToNewWeight(weight)

      expect(newWeight).toEqual({
        user_id: '42',
        weight: 75.5,
        target_timestamp: weight.target_timestamp,
        __type: 'NewWeight',
      })
    })

    it('should preserve all weight data except id and type', () => {
      const timestamp = new Date('2023-05-10T08:30:00Z')
      const weight: Weight = {
        id: 789,
        user_id: '555',
        weight: 82.3,
        target_timestamp: timestamp,
        __type: 'Weight',
      }

      const newWeight = demoteToNewWeight(weight)

      expect(newWeight.user_id).toBe(weight.user_id)
      expect(newWeight.weight).toBe(weight.weight)
      expect(newWeight.target_timestamp).toStrictEqual(weight.target_timestamp)
      expect(newWeight.__type).toBe('NewWeight')
      expect('id' in newWeight).toBe(false)
    })

    it('should validate the demoted result against newWeightSchema', () => {
      const weight: Weight = {
        id: 999,
        user_id: '1',
        weight: 60.0,
        target_timestamp: new Date(),
        __type: 'Weight',
      }

      const newWeight = demoteToNewWeight(weight)
      const validationResult = newWeightSchema.safeParse(newWeight)

      expect(validationResult.success).toBe(true)
    })
  })

  describe('Round-trip consistency', () => {
    it('should maintain data consistency through promote/demote cycle', () => {
      const originalNewWeight = createNewWeight({
        user_id: '42',
        weight: 75.5,
        target_timestamp: new Date('2023-01-01T10:00:00Z'),
      })

      const weight = promoteToWeight(originalNewWeight, { id: 123 })
      const demotedNewWeight = demoteToNewWeight(weight)

      expect(demotedNewWeight.user_id).toBe(originalNewWeight.user_id)
      expect(demotedNewWeight.weight).toBe(originalNewWeight.weight)
      expect(demotedNewWeight.target_timestamp).toStrictEqual(
        originalNewWeight.target_timestamp,
      )
      expect(demotedNewWeight.__type).toBe('NewWeight')
    })

    it('should handle multiple promote/demote cycles', () => {
      let currentNewWeight = createNewWeight({
        user_id: '1',
        weight: 70.0,
        target_timestamp: new Date('2023-01-01'),
      })

      for (let i = 1; i <= 5; i++) {
        const weight = promoteToWeight(currentNewWeight, { id: i })
        currentNewWeight = demoteToNewWeight(weight)

        expect(currentNewWeight.user_id).toBe('1')
        expect(currentNewWeight.weight).toBe(70.0)
        expect(currentNewWeight.__type).toBe('NewWeight')
      }
    })
  })

  describe('Edge cases and boundary conditions', () => {
    it('should handle minimum valid weight values', () => {
      const newWeight = createNewWeight({
        user_id: '1',
        weight: 0.1, // Very low but positive
        target_timestamp: new Date(),
      })

      expect(newWeight.weight).toBe(0.1)
    })

    it('should handle maximum reasonable weight values', () => {
      const newWeight = createNewWeight({
        user_id: '1',
        weight: 1000.0, // Very high but possible
        target_timestamp: new Date(),
      })

      expect(newWeight.weight).toBe(1000.0)
    })

    it('should handle different timestamp formats', () => {
      const timestamps = [
        new Date('2023-01-01'),
        new Date('2023-12-31T23:59:59.999Z'),
        new Date(0), // Unix epoch
        new Date('1970-01-01'),
        new Date('2050-01-01'),
      ]

      timestamps.forEach((timestamp) => {
        const newWeight = createNewWeight({
          user_id: '1',
          weight: 70.0,
          target_timestamp: timestamp,
        })

        expect(newWeight.target_timestamp).toStrictEqual(timestamp)
      })
    })

    it('should handle edge case owner IDs', () => {
      const ownerIds = [1, 999999999, Number.MAX_SAFE_INTEGER]

      ownerIds.forEach((owner) => {
        const newWeight = createNewWeight({
          user_id: owner.toString(),
          weight: 70.0,
          target_timestamp: new Date(),
        })

        expect(newWeight.user_id).toBe(owner.toString())
      })
    })

    it('should handle fractional weights precisely', () => {
      const preciseWeights = [75.123, 68.789, 82.456, 90.001]

      preciseWeights.forEach((weight) => {
        const newWeight = createNewWeight({
          user_id: '1',
          weight,
          target_timestamp: new Date(),
        })

        expect(newWeight.weight).toBe(weight)
      })
    })

    it('should preserve millisecond precision in timestamps', () => {
      const preciseTimes = [
        new Date('2023-01-01T12:34:56.123Z'),
        new Date('2023-06-15T09:30:45.789Z'),
        new Date('2023-12-31T23:59:59.999Z'),
      ]

      preciseTimes.forEach((timestamp) => {
        const newWeight = createNewWeight({
          user_id: '1',
          weight: 70.0,
          target_timestamp: timestamp,
        })

        expect(newWeight.target_timestamp.getTime()).toBe(timestamp.getTime())
      })
    })
  })
})
