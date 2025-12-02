import { describe, expect, it } from 'vitest'

import { Items } from '~/modules/diet/item/domain/ext/itemsExt'
import type { Item } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

const makeFoodItem = (
  id: number,
  name: string,
  quantity: number,
  macros: { protein: number; carbs: number; fat: number },
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
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
      ]

      expect(Items.equals(items1, items2)).toBe(true)
    })

    it('returns false for different quantities (exact comparison)', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 100.001, { protein: 1, carbs: 20, fat: 0 }),
      ]

      expect(Items.equals(items1, items2)).toBe(false)
    })

    it('returns false for different lengths', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 50, { protein: 1, carbs: 25, fat: 0 }),
      ]

      expect(Items.equals(items1, items2)).toBe(false)
    })
  })

  describe('normalizedQuantitiesShallow', () => {
    it('normalizes quantities to sum to 1', () => {
      const items = [
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 100, { protein: 1, carbs: 25, fat: 0 }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      expect(normalized[0]!.quantity).toBe(0.5)
      expect(normalized[1]!.quantity).toBe(0.5)
    })

    it('handles unequal quantities', () => {
      const items = [
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 50, { protein: 1, carbs: 25, fat: 0 }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      expect(normalized[0]!.quantity).toBeCloseTo(0.6667, 3)
      expect(normalized[1]!.quantity).toBeCloseTo(0.3333, 3)
    })

    it('handles zero total quantity', () => {
      const items = [
        makeFoodItem(1, 'Apple', 0, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 0, { protein: 1, carbs: 25, fat: 0 }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      // Should distribute equally when total is 0
      expect(normalized[0]!.quantity).toBe(0.5)
      expect(normalized[1]!.quantity).toBe(0.5)
    })

    it('preserves other item properties', () => {
      const items = [
        makeFoodItem(1, 'Apple', 100, { protein: 1, carbs: 20, fat: 0 }),
      ]

      const normalized = Items.normalizedQuantitiesShallow(items)

      expect(normalized[0]!.id).toBe(1)
      expect(normalized[0]!.name).toBe('Apple')
      expect(normalized[0]!.reference.type).toBe('food')
    })
  })
})
