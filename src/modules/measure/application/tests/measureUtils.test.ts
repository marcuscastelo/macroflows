import { describe, expect, it } from 'vitest'

import {
  calculateAverage,
  calculateBodyFatFromAverages,
  calculateBodyMeasureAverages,
  filterWeightsByDate,
  groupMeasuresByDay,
  isValidBodyMeasure,
  processMeasuresByDay,
} from '~/modules/measure/application/measureUtils'
import {
  type BodyMeasure,
  createNewBodyMeasure,
  promoteToBodyMeasure,
} from '~/modules/measure/domain/measure'
import {
  createNewWeight,
  promoteToWeight,
  type Weight,
} from '~/modules/weight/domain/weight'

describe('measureUtils', () => {
  describe('groupMeasuresByDay', () => {
    it('should group measures by date string', () => {
      const measures: BodyMeasure[] = [
        promoteToBodyMeasure(
          createNewBodyMeasure({
            user_id: '1',
            target_timestamp: new Date('2023-01-01T10:00:00Z'),
            height: 170,
            waist: 80,
            hip: 90,
            neck: 35,
          }),
          { id: 1 },
        ),
        promoteToBodyMeasure(
          createNewBodyMeasure({
            user_id: '1',
            target_timestamp: new Date('2023-01-01T14:00:00Z'),
            height: 171,
            waist: 81,
            hip: 91,
            neck: 36,
          }),
          { id: 2 },
        ),
        promoteToBodyMeasure(
          createNewBodyMeasure({
            user_id: '1',
            target_timestamp: new Date('2023-01-02T10:00:00Z'),
            height: 172,
            waist: 82,
            hip: 92,
            neck: 37,
          }),
          { id: 3 },
        ),
      ]

      const result = groupMeasuresByDay(measures)

      expect(Object.keys(result)).toHaveLength(2)
      expect(result['2023-01-01']).toHaveLength(2)
      expect(result['2023-01-02']).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const result = groupMeasuresByDay([])
      expect(result).toEqual({})
    })
  })

  describe('isValidBodyMeasure', () => {
    it('should return true for valid measure', () => {
      const measure: BodyMeasure = promoteToBodyMeasure(
        createNewBodyMeasure({
          user_id: '1',
          target_timestamp: new Date(),
          height: 170,
          waist: 80,
          hip: 90,
          neck: 35,
        }),
        { id: 1 },
      )

      expect(isValidBodyMeasure(measure)).toBe(true)
    })

    it('should return true for valid measure without hip', () => {
      const measure: BodyMeasure = promoteToBodyMeasure(
        createNewBodyMeasure({
          user_id: '1',
          target_timestamp: new Date(),
          height: 170,
          waist: 80,
          hip: undefined,
          neck: 35,
        }),
        { id: 1 },
      )

      expect(isValidBodyMeasure(measure)).toBe(true)
    })

    it('should return false for invalid measure with missing required fields', () => {
      const measure: BodyMeasure = {
        id: 1,
        user_id: '1',
        target_timestamp: new Date(),
        height: 0,
        waist: 80,
        hip: 90,
        neck: 35,
        __type: 'Measure',
      }

      expect(isValidBodyMeasure(measure)).toBe(false)
    })

    it('should return false for invalid measure with negative waist', () => {
      const measure: BodyMeasure = {
        id: 1,
        user_id: '1',
        target_timestamp: new Date(),
        height: 170,
        waist: -10,
        hip: 90,
        neck: 35,
        __type: 'Measure',
      }

      expect(isValidBodyMeasure(measure)).toBe(false)
    })

    it('should return false for invalid measure with negative neck', () => {
      const measure: BodyMeasure = {
        id: 1,
        user_id: '1',
        target_timestamp: new Date(),
        height: 170,
        waist: 80,
        hip: 90,
        neck: -5,
        __type: 'Measure',
      }

      expect(isValidBodyMeasure(measure)).toBe(false)
    })

    it('should return false for invalid measure with negative hip', () => {
      const measure: BodyMeasure = {
        id: 1,
        user_id: '1',
        target_timestamp: new Date(),
        height: 170,
        waist: 80,
        hip: -20,
        neck: 35,
        __type: 'Measure',
      }

      expect(isValidBodyMeasure(measure)).toBe(false)
    })
  })

  describe('calculateAverage', () => {
    it('should calculate average of numbers', () => {
      const numbers = [10, 20, 30]
      const result = calculateAverage(numbers)
      expect(result).toBe(20)
    })

    it('should return 0 for empty array', () => {
      const result = calculateAverage([])
      expect(result).toBe(0)
    })
  })

  describe('calculateBodyMeasureAverages', () => {
    it('should calculate average of measures', () => {
      const measures: BodyMeasure[] = [
        promoteToBodyMeasure(
          createNewBodyMeasure({
            user_id: '1',
            target_timestamp: new Date('2023-01-01T10:00:00Z'),
            height: 170,
            waist: 80,
            hip: 90,
            neck: 35,
          }),
          { id: 1 },
        ),
        promoteToBodyMeasure(
          createNewBodyMeasure({
            user_id: '1',
            target_timestamp: new Date('2023-01-01T14:00:00Z'),
            height: 172,
            waist: 82,
            hip: 92,
            neck: 37,
          }),
          { id: 2 },
        ),
      ]

      const result = calculateBodyMeasureAverages(measures)

      expect(result.height).toBe(171)
      expect(result.waist).toBe(81)
      expect(result.hip).toBe(91)
      expect(result.neck).toBe(36)
    })

    it('should handle measures without hip', () => {
      const measures: BodyMeasure[] = [
        promoteToBodyMeasure(
          createNewBodyMeasure({
            user_id: '1',
            target_timestamp: new Date('2023-01-01T10:00:00Z'),
            height: 170,
            waist: 80,
            hip: undefined,
            neck: 35,
          }),
          { id: 1 },
        ),
        promoteToBodyMeasure(
          createNewBodyMeasure({
            user_id: '1',
            target_timestamp: new Date('2023-01-01T14:00:00Z'),
            height: 172,
            waist: 82,
            hip: 92,
            neck: 37,
          }),
          { id: 2 },
        ),
      ]

      const result = calculateBodyMeasureAverages(measures)

      expect(result.height).toBe(171)
      expect(result.waist).toBe(81)
      expect(result.hip).toBe(92)
      expect(result.neck).toBe(36)
    })
  })

  describe('filterWeightsByDate', () => {
    it('should filter weights by date', () => {
      const weights: Weight[] = [
        promoteToWeight(
          createNewWeight({
            user_id: '',
            weight: 70,
            target_timestamp: new Date('2023-01-01T10:00:00Z'),
          }),
          { id: 1 },
        ),
        promoteToWeight(
          createNewWeight({
            user_id: '',
            weight: 71,
            target_timestamp: new Date('2023-01-02T10:00:00Z'),
          }),
          { id: 2 },
        ),
        promoteToWeight(
          createNewWeight({
            user_id: '',
            weight: 72,
            target_timestamp: new Date('2023-01-03T10:00:00Z'),
          }),
          { id: 3 },
        ),
      ]

      const result = filterWeightsByDate(weights, '1/1/2023')

      expect(result).toHaveLength(1)
      expect(result[0]!.weight).toBe(70)
    })

    it('should handle empty array', () => {
      const result = filterWeightsByDate([], '1/1/2023')
      expect(result).toEqual([])
    })
  })

  describe('calculateBodyFatFromAverages', () => {
    it('should calculate body fat from averages for male', () => {
      const averages = {
        height: 170,
        waist: 80,
        hip: undefined,
        neck: 35,
      }

      const result = calculateBodyFatFromAverages(averages, 'male', 70)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('should calculate body fat from averages for female', () => {
      const averages = {
        height: 165,
        waist: 70,
        hip: 90,
        neck: 30,
      }

      const result = calculateBodyFatFromAverages(averages, 'female', 60)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('should handle missing hip for female (use default)', () => {
      const averages = {
        height: 165,
        waist: 70,
        hip: undefined,
        neck: 30,
      }

      const result = calculateBodyFatFromAverages(averages, 'female', 60)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })

  describe('processMeasuresByDay', () => {
    it('should process measures and return complete day structure', () => {
      const groupedMeasures: Record<string, BodyMeasure[]> = {
        '2023-01-01': [
          promoteToBodyMeasure(
            createNewBodyMeasure({
              user_id: '1',
              target_timestamp: new Date('2023-01-01T10:00:00Z'),
              height: 170,
              waist: 80,
              hip: 90,
              neck: 35,
            }),
            { id: 1 },
          ),
        ],
      }

      const weights: Weight[] = [
        promoteToWeight(
          createNewWeight({
            user_id: '',
            weight: 70,
            target_timestamp: new Date('2023-01-01T10:00:00Z'),
          }),
          { id: 1 },
        ),
      ]

      const result = processMeasuresByDay(groupedMeasures, weights, 'male')

      expect(result).toHaveLength(1)
      expect(result[0]!.date).toBe('2023-01-01')
      expect(result[0]!.dayAverage.height).toBe(170)
      expect(result[0]!.dayAverage.waist).toBe(80)
      expect(result[0]!.dayAverage.hip).toBe(90)
      expect(result[0]!.dayAverage.neck).toBe(35)
      expect(typeof result[0]!.dayBf).toBe('number')
    })
  })
})
