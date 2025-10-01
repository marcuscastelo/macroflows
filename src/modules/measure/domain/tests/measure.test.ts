import { describe, expect, it } from 'vitest'

import {
  type BodyMeasure,
  bodyMeasureSchema,
  createNewBodyMeasure,
  demoteToNewBodyMeasure,
  type NewBodyMeasure,
  newBodyMeasureSchema,
  promoteToBodyMeasure,
} from '~/modules/measure/domain/measure'

describe('BodyMeasure Domain', () => {
  describe('bodyMeasureSchema', () => {
    it('should validate a valid body measure object', () => {
      const validBodyMeasure = {
        id: 1,
        height: 175.5,
        waist: 80.0,
        hip: 95.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date('2023-01-01'),
      }

      const result = bodyMeasureSchema.safeParse(validBodyMeasure)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(1)
        expect(result.data.height).toBe(175.5)
        expect(result.data.waist).toBe(80.0)
        expect(result.data.hip).toBe(95.0)
        expect(result.data.neck).toBe(38.0)
        expect(result.data.user_id).toBe('42')
        expect(result.data.target_timestamp).toStrictEqual(
          new Date('2023-01-01'),
        )
        expect(result.data.__type).toBe('Measure')
      }
    })

    it('should transform string target_timestamp to Date', () => {
      const bodyMeasureWithStringDate = {
        id: 1,
        height: 175.5,
        waist: 80.0,
        hip: 95.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: '2023-01-01T10:00:00Z',
      }

      const result = bodyMeasureSchema.safeParse(bodyMeasureWithStringDate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.target_timestamp).toBeInstanceOf(Date)
        expect(result.data.target_timestamp.toISOString()).toBe(
          '2023-01-01T10:00:00.000Z',
        )
      }
    })

    it('should handle optional hip field', () => {
      const bodyMeasureWithoutHip = {
        id: 1,
        height: 175.5,
        waist: 80.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date('2023-01-01'),
      }

      const result = bodyMeasureSchema.safeParse(bodyMeasureWithoutHip)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.hip).toBeUndefined()
      }
    })

    it('should transform null hip to undefined', () => {
      const bodyMeasureWithNullHip = {
        id: 1,
        height: 175.5,
        waist: 80.0,
        hip: null,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date('2023-01-01'),
      }

      const result = bodyMeasureSchema.safeParse(bodyMeasureWithNullHip)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.hip).toBeUndefined()
      }
    })

    it('should fail validation with missing required fields', () => {
      const invalidBodyMeasure = {
        // Missing id, height, waist, neck, user_id, target_timestamp
      }

      const result = bodyMeasureSchema.safeParse(invalidBodyMeasure)
      expect(result.success).toBe(false)
    })

    it('should fail validation with invalid field types', () => {
      const invalidBodyMeasure = {
        id: 'not-a-number',
        height: 175.5,
        waist: 80.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date(),
      }

      const result = bodyMeasureSchema.safeParse(invalidBodyMeasure)
      expect(result.success).toBe(false)
    })
  })

  describe('newBodyMeasureSchema', () => {
    it('should validate a valid new body measure object', () => {
      const validNewBodyMeasure = {
        height: 175.5,
        waist: 80.0,
        hip: 95.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date('2023-01-01'),
        __type: 'NewMeasure' as const,
      }

      const result = newBodyMeasureSchema.safeParse(validNewBodyMeasure)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.height).toBe(175.5)
        expect(result.data.waist).toBe(80.0)
        expect(result.data.hip).toBe(95.0)
        expect(result.data.neck).toBe(38.0)
        expect(result.data.user_id).toBe('42')
        expect(result.data.target_timestamp).toStrictEqual(
          new Date('2023-01-01'),
        )
        expect(result.data.__type).toBe('NewMeasure')
      }
    })

    it('should ignore extra fields (not in strict mode)', () => {
      const bodyMeasureWithExtraField = {
        height: 175.5,
        waist: 80.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date(),
        __type: 'NewMeasure' as const,
        extraField: 'should be ignored',
      }

      const result = newBodyMeasureSchema.safeParse(bodyMeasureWithExtraField)
      expect(result.success).toBe(true)
      if (result.success) {
        expect('extraField' in result.data).toBe(false)
      }
    })

    it('should ignore id field (not in strict mode)', () => {
      const bodyMeasureWithId = {
        id: 1,
        height: 175.5,
        waist: 80.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date(),
        __type: 'NewMeasure' as const,
      }

      const result = newBodyMeasureSchema.safeParse(bodyMeasureWithId)
      expect(result.success).toBe(true)
      if (result.success) {
        expect('id' in result.data).toBe(false)
      }
    })

    it('should fail validation with missing required fields', () => {
      const invalidNewBodyMeasure = {
        __type: 'NewMeasure' as const,
      }

      const result = newBodyMeasureSchema.safeParse(invalidNewBodyMeasure)
      expect(result.success).toBe(false)
    })
  })

  describe('createNewBodyMeasure', () => {
    it('should create a valid NewBodyMeasure', () => {
      const bodyMeasureProps = {
        height: 175.5,
        waist: 80.0,
        hip: 95.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date('2023-01-01'),
      }

      const newBodyMeasure = createNewBodyMeasure(bodyMeasureProps)

      expect(newBodyMeasure.height).toBe(175.5)
      expect(newBodyMeasure.waist).toBe(80.0)
      expect(newBodyMeasure.hip).toBe(95.0)
      expect(newBodyMeasure.neck).toBe(38.0)
      expect(newBodyMeasure.user_id).toBe('42')
      expect(newBodyMeasure.target_timestamp).toStrictEqual(
        new Date('2023-01-01'),
      )
      expect(newBodyMeasure.__type).toBe('NewMeasure')
    })

    it('should handle different measurement values', () => {
      const testCases = [
        { height: 160.0, waist: 70.0, neck: 35.0 },
        { height: 180.5, waist: 85.5, neck: 40.5 },
        { height: 200.0, waist: 100.0, neck: 45.0 },
      ]

      testCases.forEach(({ height, waist, neck }) => {
        const newBodyMeasure = createNewBodyMeasure({
          height,
          waist,
          neck,
          user_id: '1',
          target_timestamp: new Date(),
        })

        expect(newBodyMeasure.height).toBe(height)
        expect(newBodyMeasure.waist).toBe(waist)
        expect(newBodyMeasure.neck).toBe(neck)
        expect(newBodyMeasure.__type).toBe('NewMeasure')
      })
    })

    it('should handle different owner IDs', () => {
      const testCases = [1, 42, 999, 123456]

      testCases.forEach((owner) => {
        const newBodyMeasure = createNewBodyMeasure({
          height: 175.0,
          waist: 80.0,
          neck: 38.0,
          user_id: String(owner),
          target_timestamp: new Date(),
        })

        expect(newBodyMeasure.user_id).toBe(String(owner))
        expect(newBodyMeasure.__type).toBe('NewMeasure')
      })
    })

    it('should preserve exact timestamp values', () => {
      const exactTime = new Date('2023-06-15T14:30:45.123Z')

      const newBodyMeasure = createNewBodyMeasure({
        height: 175.0,
        waist: 80.0,
        neck: 38.0,
        user_id: '1',
        target_timestamp: exactTime,
      })

      expect(newBodyMeasure.target_timestamp).toStrictEqual(exactTime)
    })
  })

  describe('promoteToBodyMeasure', () => {
    it('should promote NewBodyMeasure to BodyMeasure', () => {
      const newBodyMeasure: NewBodyMeasure = {
        height: 175.5,
        waist: 80.0,
        hip: 95.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date('2023-01-01'),
        __type: 'NewMeasure',
      }

      const bodyMeasure = promoteToBodyMeasure(newBodyMeasure, { id: 123 })

      expect(bodyMeasure.id).toBe(123)
      expect(bodyMeasure.height).toBe(175.5)
      expect(bodyMeasure.waist).toBe(80.0)
      expect(bodyMeasure.hip).toBe(95.0)
      expect(bodyMeasure.neck).toBe(38.0)
      expect(bodyMeasure.user_id).toBe('42')
      expect(bodyMeasure.target_timestamp).toStrictEqual(new Date('2023-01-01'))
    })

    it('should handle different ID values', () => {
      const newBodyMeasure: NewBodyMeasure = createNewBodyMeasure({
        height: 175.0,
        waist: 80.0,
        neck: 38.0,
        user_id: '1',
        target_timestamp: new Date(),
      })

      const testIds = [1, 42, 999, 123456]

      testIds.forEach((id) => {
        const bodyMeasure = promoteToBodyMeasure(newBodyMeasure, { id })
        expect(bodyMeasure.id).toBe(id)
      })
    })
  })

  describe('demoteToNewBodyMeasure', () => {
    it('should demote BodyMeasure to NewBodyMeasure', () => {
      const bodyMeasure: BodyMeasure = {
        id: 123,
        height: 175.5,
        waist: 80.0,
        hip: 95.0,
        neck: 38.0,
        user_id: '42',
        target_timestamp: new Date('2023-01-01'),
        __type: 'Measure',
      }

      const newBodyMeasure = demoteToNewBodyMeasure(bodyMeasure)

      expect(newBodyMeasure.height).toBe(175.5)
      expect(newBodyMeasure.waist).toBe(80.0)
      expect(newBodyMeasure.hip).toBe(95.0)
      expect(newBodyMeasure.neck).toBe(38.0)
      expect(newBodyMeasure.user_id).toBe('42')
      expect(newBodyMeasure.target_timestamp).toStrictEqual(
        new Date('2023-01-01'),
      )
      expect(newBodyMeasure.__type).toBe('NewMeasure')
      expect('id' in newBodyMeasure).toBe(false)
    })
  })

  describe('Edge cases and boundary conditions', () => {
    it('should handle very small measurement values', () => {
      const smallValues = {
        height: 0.1,
        waist: 0.1,
        hip: 0.1,
        neck: 0.1,
        user_id: '1',
        target_timestamp: new Date(),
      }

      const newBodyMeasure = createNewBodyMeasure(smallValues)
      expect(newBodyMeasure.height).toBe(0.1)
      expect(newBodyMeasure.waist).toBe(0.1)
      expect(newBodyMeasure.hip).toBe(0.1)
      expect(newBodyMeasure.neck).toBe(0.1)
    })

    it('should handle large measurement values', () => {
      const largeValues = {
        height: 999.9,
        waist: 999.9,
        hip: 999.9,
        neck: 999.9,
        user_id: '1',
        target_timestamp: new Date(),
      }

      const newBodyMeasure = createNewBodyMeasure(largeValues)
      expect(newBodyMeasure.height).toBe(999.9)
      expect(newBodyMeasure.waist).toBe(999.9)
      expect(newBodyMeasure.hip).toBe(999.9)
      expect(newBodyMeasure.neck).toBe(999.9)
    })

    it('should handle decimal precision', () => {
      const preciseValues = {
        height: 175.123456,
        waist: 80.987654,
        hip: 95.555555,
        neck: 38.333333,
        user_id: '1',
        target_timestamp: new Date(),
      }

      const newBodyMeasure = createNewBodyMeasure(preciseValues)
      expect(newBodyMeasure.height).toBe(175.123456)
      expect(newBodyMeasure.waist).toBe(80.987654)
      expect(newBodyMeasure.hip).toBe(95.555555)
      expect(newBodyMeasure.neck).toBe(38.333333)
    })
  })
})
