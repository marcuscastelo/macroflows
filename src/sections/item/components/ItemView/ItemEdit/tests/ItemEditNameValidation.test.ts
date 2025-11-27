import { describe, expect, it } from 'vitest'

import {
  canApplyItem,
  isItemNameValid,
  MAX_ITEM_NAME_LENGTH,
  truncateItemName,
} from '~/modules/diet/item/domain/itemValidation'
import type {
  GroupItem,
  Item,
  RecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
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

const makeGroupItem = (
  id: number,
  name: string,
  quantity: number,
  children: Item[] = [],
): GroupItem => ({
  id,
  name,
  quantity,
  reference: {
    type: 'group',
    children,
  },
  __type: 'UnifiedItem' as const,
})

const makeRecipeItem = (
  id: number,
  name: string,
  quantity: number,
  children: Item[] = [],
): RecipeItem => ({
  id,
  name,
  quantity,
  reference: {
    type: 'recipe',
    id,
    children,
  },
  __type: 'UnifiedItem' as const,
})

describe('ItemEdit Name Validation', () => {
  describe('isItemNameValid', () => {
    it('returns true for non-empty name', () => {
      expect(isItemNameValid('Cookie mix')).toBe(true)
    })

    it('returns true for name with only spaces at edges', () => {
      expect(isItemNameValid('  Cookie mix  ')).toBe(true)
    })

    it('returns false for empty name', () => {
      expect(isItemNameValid('')).toBe(false)
    })

    it('returns false for whitespace-only name', () => {
      expect(isItemNameValid('   ')).toBe(false)
      expect(isItemNameValid('\t\n')).toBe(false)
    })
  })

  describe('canApplyItem', () => {
    const child = makeFoodItem(1, 'Flour', 100, {
      protein: 5,
      carbs: 70,
      fat: 1,
    })

    it('returns true for valid GroupItem with non-empty name', () => {
      const group = makeGroupItem(10, 'Cookie mix', 200, [child])
      expect(canApplyItem(group)).toBe(true)
    })

    it('returns true for valid RecipeItem with non-empty name', () => {
      const recipe = makeRecipeItem(10, 'Cookie mix', 200, [child])
      expect(canApplyItem(recipe)).toBe(true)
    })

    it('returns false for GroupItem with empty name', () => {
      const group = makeGroupItem(10, '', 200, [child])
      expect(canApplyItem(group)).toBe(false)
    })

    it('returns false for RecipeItem with empty name', () => {
      const recipe = makeRecipeItem(10, '', 200, [child])
      expect(canApplyItem(recipe)).toBe(false)
    })

    it('returns false for GroupItem with whitespace-only name', () => {
      const group = makeGroupItem(10, '   ', 200, [child])
      expect(canApplyItem(group)).toBe(false)
    })

    it('returns false for RecipeItem with whitespace-only name', () => {
      const recipe = makeRecipeItem(10, '   ', 200, [child])
      expect(canApplyItem(recipe)).toBe(false)
    })

    it('returns false for item with zero quantity', () => {
      const group = makeGroupItem(10, 'Cookie mix', 0, [child])
      expect(canApplyItem(group)).toBe(false)
    })

    it('returns false for item with negative quantity', () => {
      const group = makeGroupItem(10, 'Cookie mix', -100, [child])
      expect(canApplyItem(group)).toBe(false)
    })

    it('allows FoodItem with empty name (name derives from food)', () => {
      // FoodItem names derive from the referenced food, so we don't validate
      const food = makeFoodItem(1, '', 100, {
        protein: 5,
        carbs: 70,
        fat: 1,
      })
      expect(canApplyItem(food)).toBe(true)
    })
  })

  describe('Name Length Constraint', () => {
    it('MAX_ITEM_NAME_LENGTH is 100', () => {
      expect(MAX_ITEM_NAME_LENGTH).toBe(100)
    })

    it('truncateItemName truncates long names', () => {
      const longName = 'a'.repeat(150)
      const trimmedName = truncateItemName(longName)
      expect(trimmedName.length).toBe(MAX_ITEM_NAME_LENGTH)
    })

    it('truncateItemName does not truncate short names', () => {
      const shortName = 'Cookie mix'
      const trimmedName = truncateItemName(shortName)
      expect(trimmedName).toBe(shortName)
    })
  })

  describe('Name Update Behavior', () => {
    it('updating name preserves other item properties', () => {
      const child = makeFoodItem(1, 'Flour', 100, {
        protein: 5,
        carbs: 70,
        fat: 1,
      })
      const original = makeGroupItem(10, 'Original', 200, [child])
      const updated = { ...original, name: 'Updated Name' }

      expect(updated.id).toBe(original.id)
      expect(updated.quantity).toBe(original.quantity)
      expect(updated.reference).toBe(original.reference)
      expect(updated.name).toBe('Updated Name')
    })

    it('name change does not affect children', () => {
      const child = makeFoodItem(1, 'Flour', 100, {
        protein: 5,
        carbs: 70,
        fat: 1,
      })
      const original = makeGroupItem(10, 'Original', 200, [child])
      const updated = { ...original, name: 'Updated Name' }

      expect(updated.reference.children).toBe(original.reference.children)
      expect(updated.reference.children[0]?.name).toBe('Flour')
    })
  })
})
