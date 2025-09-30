import { describe, expect, it } from 'vitest'

import {
  createNewMacroProfile,
  demoteToNewMacroProfile,
  type MacroProfile,
  macroProfileSchema,
  type NewMacroProfile,
  newMacroProfileSchema,
  promoteToMacroProfile,
} from '~/modules/diet/macro-profile/domain/macroProfile'

describe('MacroProfile Domain', () => {
  describe('macroProfileSchema', () => {
    it('should transform string target_day to Date', () => {
      const macroProfileWithStringDate = {
        id: 1,
        user_id: '42',
        target_day: '2023-01-01T00:00:00Z',
        gramsPerKgCarbs: 5.0,
        gramsPerKgProtein: 2.2,
        gramsPerKgFat: 1.0,
        __type: 'MacroProfile',
      }

      const result = macroProfileSchema.safeParse(macroProfileWithStringDate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.target_day).toBeInstanceOf(Date)
        expect(result.data.target_day.toISOString()).toBe(
          '2023-01-01T00:00:00.000Z',
        )
      }
    })

    it('should transform negative gramsPerKg values to 0', () => {
      const macroProfileWithNegativeValues = {
        id: 1,
        user_id: '42',
        target_day: new Date('2023-01-01'),
        gramsPerKgCarbs: -2.5,
        gramsPerKgProtein: -1.8,
        gramsPerKgFat: -0.5,
        __type: 'MacroProfile',
      }

      const result = macroProfileSchema.safeParse(
        macroProfileWithNegativeValues,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.gramsPerKgCarbs).toBe(0)
        expect(result.data.gramsPerKgProtein).toBe(0)
        expect(result.data.gramsPerKgFat).toBe(0)
      }
    })

    it('should fail validation with NaN gramsPerKg values', () => {
      const macroProfileWithNaNValues = {
        id: 1,
        user_id: '42',
        target_day: new Date('2023-01-01'),
        gramsPerKgCarbs: NaN,
        gramsPerKgProtein: NaN,
        gramsPerKgFat: NaN,
        __type: 'MacroProfile',
      }

      const result = macroProfileSchema.safeParse(macroProfileWithNaNValues)
      expect(result.success).toBe(false)
    })

    it('should fail validation with missing required fields', () => {
      const invalidMacroProfile = {
        // Missing user_id, target_day, gramsPerKg values
        id: 1,
        __type: 'MacroProfile',
      }

      const result = macroProfileSchema.safeParse(invalidMacroProfile)
      expect(result.success).toBe(false)
    })

    it('should fail validation with invalid field types', () => {
      const invalidMacroProfile = {
        id: 1,
        user_id: 42,
        target_day: new Date('2023-01-01'),
        gramsPerKgCarbs: 5.0,
        gramsPerKgProtein: 2.2,
        gramsPerKgFat: 1.0,
        __type: 'MacroProfile',
      }

      const result = macroProfileSchema.safeParse(invalidMacroProfile)
      expect(result.success).toBe(false)
    })

    it('should handle invalid date format by creating Invalid Date', () => {
      const invalidMacroProfile = {
        id: 1,
        user_id: '42',
        target_day: 'not-a-date',
        gramsPerKgCarbs: 5.0,
        gramsPerKgProtein: 2.2,
        gramsPerKgFat: 1.0,
        __type: 'MacroProfile',
      }

      const result = macroProfileSchema.safeParse(invalidMacroProfile)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.target_day).toBeInstanceOf(Date)
        expect(isNaN(result.data.target_day.getTime())).toBe(true) // Invalid Date
      }
    })
  })

  describe('newMacroProfileSchema', () => {
    it('should transform string target_day to Date', () => {
      const newMacroProfileWithStringDate = {
        user_id: '42',
        target_day: '2023-06-15T12:30:00Z',
        gramsPerKgCarbs: 5.0,
        gramsPerKgProtein: 2.2,
        gramsPerKgFat: 1.0,
        __type: 'NewMacroProfile',
      }

      const result = newMacroProfileSchema.safeParse(
        newMacroProfileWithStringDate,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.target_day).toBeInstanceOf(Date)
        expect(result.data.target_day.toISOString()).toBe(
          '2023-06-15T12:30:00.000Z',
        )
      }
    })

    it('should fail validation with missing required fields', () => {
      const invalidNewMacroProfile = {
        __type: 'NewMacroProfile',
      }

      const result = newMacroProfileSchema.safeParse(invalidNewMacroProfile)
      expect(result.success).toBe(false)
    })
  })

  describe('createNewMacroProfile', () => {
    it('should create a valid NewMacroProfile', () => {
      const macroProfileProps = {
        user_id: '42',
        target_day: new Date('2023-01-01'),
        gramsPerKgCarbs: 5.0,
        gramsPerKgProtein: 2.2,
        gramsPerKgFat: 1.0,
      }

      const newMacroProfile = createNewMacroProfile(macroProfileProps)

      expect(newMacroProfile.user_id).toBe('42')
      expect(newMacroProfile.target_day).toStrictEqual(new Date('2023-01-01'))
      expect(newMacroProfile.gramsPerKgCarbs).toBe(5.0)
      expect(newMacroProfile.gramsPerKgProtein).toBe(2.2)
      expect(newMacroProfile.gramsPerKgFat).toBe(1.0)
      expect(newMacroProfile.__type).toBe('NewMacroProfile')
    })
  })

  describe('promoteToMacroProfile', () => {
    it('should promote NewMacroProfile to MacroProfile', () => {
      const newMacroProfile: NewMacroProfile = {
        user_id: '42',
        target_day: new Date('2023-01-01'),
        gramsPerKgCarbs: 5.0,
        gramsPerKgProtein: 2.2,
        gramsPerKgFat: 1.0,
        __type: 'NewMacroProfile',
      }

      const macroProfile = promoteToMacroProfile(newMacroProfile, { id: 123 })

      expect(macroProfile.id).toBe(123)
      expect(macroProfile.user_id).toBe('42')
      expect(macroProfile.target_day).toStrictEqual(new Date('2023-01-01'))
      expect(macroProfile.gramsPerKgCarbs).toBe(5.0)
      expect(macroProfile.gramsPerKgProtein).toBe(2.2)
      expect(macroProfile.gramsPerKgFat).toBe(1.0)
      expect(macroProfile.__type).toBe('MacroProfile')
    })
  })

  describe('demoteToNewMacroProfile', () => {
    it('should demote MacroProfile to NewMacroProfile', () => {
      const macroProfile: MacroProfile = {
        id: 123,
        user_id: '42',
        target_day: new Date('2023-01-01'),
        gramsPerKgCarbs: 5.0,
        gramsPerKgProtein: 2.2,
        gramsPerKgFat: 1.0,
        __type: 'MacroProfile',
      }

      const newMacroProfile = demoteToNewMacroProfile(macroProfile)

      expect(newMacroProfile.user_id).toBe('42')
      expect(newMacroProfile.target_day).toStrictEqual(new Date('2023-01-01'))
      expect(newMacroProfile.gramsPerKgCarbs).toBe(5.0)
      expect(newMacroProfile.gramsPerKgProtein).toBe(2.2)
      expect(newMacroProfile.gramsPerKgFat).toBe(1.0)
      expect(newMacroProfile.__type).toBe('NewMacroProfile')
      expect('id' in newMacroProfile).toBe(false)
    })
  })
})
