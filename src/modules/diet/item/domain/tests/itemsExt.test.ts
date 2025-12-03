import { describe, expect, it } from 'vitest'

import { Items } from '~/modules/diet/item/domain/ext/itemsExt'
import type { Item } from '~/modules/diet/item/schema/itemSchema'
import {
  createMacroNutrients,
  type MacroNutrientsRecord,
} from '~/modules/diet/macro-nutrients/domain/macroNutrients'

const makeFoodItem = (
  id: number,
  name: string,
  quantity: number,
  macros: MacroNutrientsRecord,
): Item => ({
  id,
  name,
  quantity,
  reference: {
    type: 'food',
    id,
    macros: createMacroNutrients(macros),
  },
  __type: 'UnifiedItem' as const,
})

describe('Items', () => {
  describe('equals', () => {
    it('returns true for identical items', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
      ]

      expect(Items.equals(items1, items2)).toBe(true)
    })

    it('returns false for different quantities (exact comparison)', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 100.01, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
      ]

      expect(Items.equals(items1, items2)).toBe(false)
    })

    it('returns false for different lengths', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
        makeFoodItem(2, 'Banana', 50, {
          proteinInMg: 1000,
          carbsInMg: 25000,
          fatInMg: 0,
        }),
      ]

      expect(Items.equals(items1, items2)).toBe(false)
    })
  })

  describe('normalizedQuantitiesShallow', () => {
    it('normalizes quantities to sum to 1', () => {
      const items = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
        makeFoodItem(2, 'Banana', 100, {
          proteinInMg: 1000,
          carbsInMg: 25000,
          fatInMg: 0,
        }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      expect(normalized[0]!.quantity).toBe(50)
      expect(normalized[1]!.quantity).toBe(50)
    })

    it('handles unequal quantities', () => {
      const items = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
        makeFoodItem(2, 'Banana', 50, {
          proteinInMg: 1000,
          carbsInMg: 25000,
          fatInMg: 0,
        }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      expect(normalized[0]!.quantity).toBeCloseTo(66.67, 0)
      expect(normalized[1]!.quantity).toBeCloseTo(33.33, 0)
    })

    it('handles zero total quantity', () => {
      const items = [
        makeFoodItem(1, 'Apple', 0, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
        makeFoodItem(2, 'Banana', 0, {
          proteinInMg: 1000,
          carbsInMg: 25000,
          fatInMg: 0,
        }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      // Should distribute equally when total is 0
      expect(normalized[0]!.quantity).toBe(50)
      expect(normalized[1]!.quantity).toBe(50)
    })

    it('preserves other item properties', () => {
      const items = [
        makeFoodItem(1, 'Apple', 100, {
          proteinInMg: 1000,
          carbsInMg: 20000,
          fatInMg: 0,
        }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      expect(normalized[0]!.id).toBe(1)
      expect(normalized[0]!.name).toBe('Apple')
      expect(normalized[0]!.reference.type).toBe('food')
    })
  })
})
