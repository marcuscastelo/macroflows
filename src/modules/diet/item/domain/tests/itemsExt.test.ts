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

  describe('equalsByProportion', () => {
    it('returns true for identical items', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 0.5, { protein: 1, carbs: 25, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 0.5, { protein: 1, carbs: 25, fat: 0 }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(true)
    })

    it('returns true for quantities within tolerance (0.0001)', () => {
      // Simulates the case where normalized proportions differ due to rounding
      const items1 = [
        makeFoodItem(1, 'Item 1', 0.3333, { protein: 10, carbs: 10, fat: 10 }),
        makeFoodItem(2, 'Item 2', 0.3333, { protein: 10, carbs: 10, fat: 10 }),
        makeFoodItem(
          3,
          'Item 3',
          0.3334, // Slightly different due to original recipe rounding
          { protein: 10, carbs: 10, fat: 10 },
        ),
      ]
      const items2 = [
        makeFoodItem(
          1,
          'Item 1',
          0.3333333333333333, // After scaling and re-normalizing
          { protein: 10, carbs: 10, fat: 10 },
        ),
        makeFoodItem(2, 'Item 2', 0.3333333333333333, {
          protein: 10,
          carbs: 10,
          fat: 10,
        }),
        makeFoodItem(3, 'Item 3', 0.3333333333333333, {
          protein: 10,
          carbs: 10,
          fat: 10,
        }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(true)
    })

    it('returns false for quantities outside tolerance', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 0.5, { protein: 1, carbs: 25, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 0.6, { protein: 1, carbs: 20, fat: 0 }), // 0.1 difference > 0.0001 tolerance
        makeFoodItem(2, 'Banana', 0.4, { protein: 1, carbs: 25, fat: 0 }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(false)
    })

    it('returns false for different item names', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Orange', 0.5, { protein: 1, carbs: 20, fat: 0 }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(false)
    })

    it('returns false for different lengths', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 0.5, { protein: 1, carbs: 25, fat: 0 }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(false)
    })

    it('returns true for items in different order (sorted by ID)', () => {
      const items1 = [
        makeFoodItem(2, 'Banana', 0.5, { protein: 1, carbs: 25, fat: 0 }),
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1, carbs: 20, fat: 0 }),
        makeFoodItem(2, 'Banana', 0.5, { protein: 1, carbs: 25, fat: 0 }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(true)
    })

    it('compares macros with tolerance for food items', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1.0, carbs: 20.0, fat: 0.5 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 0.5, {
          protein: 1.00005, // Within tolerance
          carbs: 20.00005,
          fat: 0.50005,
        }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(true)
    })

    it('returns false for macros outside tolerance', () => {
      const items1 = [
        makeFoodItem(1, 'Apple', 0.5, { protein: 1.0, carbs: 20.0, fat: 0.5 }),
      ]
      const items2 = [
        makeFoodItem(1, 'Apple', 0.5, {
          protein: 1.5, // 0.5 difference > 0.0001 tolerance
          carbs: 20.0,
          fat: 0.5,
        }),
      ]

      expect(Items.equalsByProportion(items1, items2)).toBe(false)
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
