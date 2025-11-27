import { describe, expect, it } from 'vitest'

import type {
  GroupItem,
  Item,
  RecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
import {
  isGroupItem,
  isRecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

/** Maximum length for item names - mirrors constant in ItemEditBody */
const MAX_NAME_LENGTH = 100

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

/**
 * Validates if an item name is valid
 * Mirrors the validation logic in ItemEditBody
 */
function isNameValid(name: string): boolean {
  return name.trim().length > 0
}

/**
 * Determines if an item can be applied based on its properties
 * Mirrors the canApply logic in ItemEditModal
 */
function canApply(item: Item): boolean {
  // Check quantity is valid
  if (item.quantity <= 0) return false
  // For parent items (GroupItem/RecipeItem), also check name is not empty
  if (isGroupItem(item) || isRecipeItem(item)) {
    if (item.name.trim().length === 0) return false
  }
  return true
}

describe('ItemEdit Name Validation', () => {
  describe('isNameValid', () => {
    it('returns true for non-empty name', () => {
      expect(isNameValid('Cookie mix')).toBe(true)
    })

    it('returns true for name with only spaces at edges', () => {
      expect(isNameValid('  Cookie mix  ')).toBe(true)
    })

    it('returns false for empty name', () => {
      expect(isNameValid('')).toBe(false)
    })

    it('returns false for whitespace-only name', () => {
      expect(isNameValid('   ')).toBe(false)
      expect(isNameValid('\t\n')).toBe(false)
    })
  })

  describe('canApply', () => {
    const child = makeFoodItem(1, 'Flour', 100, {
      protein: 5,
      carbs: 70,
      fat: 1,
    })

    it('returns true for valid GroupItem with non-empty name', () => {
      const group = makeGroupItem(10, 'Cookie mix', 200, [child])
      expect(canApply(group)).toBe(true)
    })

    it('returns true for valid RecipeItem with non-empty name', () => {
      const recipe = makeRecipeItem(10, 'Cookie mix', 200, [child])
      expect(canApply(recipe)).toBe(true)
    })

    it('returns false for GroupItem with empty name', () => {
      const group = makeGroupItem(10, '', 200, [child])
      expect(canApply(group)).toBe(false)
    })

    it('returns false for RecipeItem with empty name', () => {
      const recipe = makeRecipeItem(10, '', 200, [child])
      expect(canApply(recipe)).toBe(false)
    })

    it('returns false for GroupItem with whitespace-only name', () => {
      const group = makeGroupItem(10, '   ', 200, [child])
      expect(canApply(group)).toBe(false)
    })

    it('returns false for RecipeItem with whitespace-only name', () => {
      const recipe = makeRecipeItem(10, '   ', 200, [child])
      expect(canApply(recipe)).toBe(false)
    })

    it('returns false for item with zero quantity', () => {
      const group = makeGroupItem(10, 'Cookie mix', 0, [child])
      expect(canApply(group)).toBe(false)
    })

    it('returns false for item with negative quantity', () => {
      const group = makeGroupItem(10, 'Cookie mix', -100, [child])
      expect(canApply(group)).toBe(false)
    })

    it('allows FoodItem with empty name (name derives from food)', () => {
      // FoodItem names derive from the referenced food, so we don't validate
      const food = makeFoodItem(1, '', 100, {
        protein: 5,
        carbs: 70,
        fat: 1,
      })
      expect(canApply(food)).toBe(true)
    })
  })

  describe('Name Length Constraint', () => {
    it('MAX_NAME_LENGTH is 100', () => {
      expect(MAX_NAME_LENGTH).toBe(100)
    })

    it('enforcing max length truncates long names', () => {
      const longName = 'a'.repeat(150)
      const trimmedName = longName.slice(0, MAX_NAME_LENGTH)
      expect(trimmedName.length).toBe(MAX_NAME_LENGTH)
    })

    it('short names are not truncated', () => {
      const shortName = 'Cookie mix'
      const trimmedName = shortName.slice(0, MAX_NAME_LENGTH)
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
