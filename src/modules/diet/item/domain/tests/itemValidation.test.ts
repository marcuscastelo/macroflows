import { describe, expect, it } from 'vitest'

import {
  canApplyItem,
  isItemNameValid,
  MAX_ITEM_NAME_LENGTH,
  truncateItemName,
} from '~/modules/diet/item/domain/itemValidation'
import type { Item } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

const makeFoodItem = (name: string, quantity: number): Item => ({
  id: 1,
  name,
  quantity,
  reference: {
    type: 'food',
    id: 1,
    macros: createMacroNutrients({ proteinInGrams: 5, carbsInGrams: 10, fatInGrams: 2 }),
  },
  __type: 'UnifiedItem' as const,
})

const makeGroupItem = (name: string, quantity: number): Item => ({
  id: 1,
  name,
  quantity,
  reference: {
    type: 'group',
    children: [makeFoodItem('Child', 100)],
  },
  __type: 'UnifiedItem' as const,
})

const makeRecipeItem = (name: string, quantity: number): Item => ({
  id: 1,
  name,
  quantity,
  reference: {
    type: 'recipe',
    id: 1,
    children: [makeFoodItem('Child', 100)],
  },
  __type: 'UnifiedItem' as const,
})

describe('itemValidation module', () => {
  describe('MAX_ITEM_NAME_LENGTH', () => {
    it('is 100', () => {
      expect(MAX_ITEM_NAME_LENGTH).toBe(100)
    })
  })

  describe('isItemNameValid', () => {
    it('returns true for non-empty string', () => {
      expect(isItemNameValid('Test')).toBe(true)
    })

    it('returns true for string with leading/trailing spaces', () => {
      expect(isItemNameValid('  Test  ')).toBe(true)
    })

    it('returns false for empty string', () => {
      expect(isItemNameValid('')).toBe(false)
    })

    it('returns false for whitespace-only string', () => {
      expect(isItemNameValid('   ')).toBe(false)
    })

    it('returns false for tab and newline only', () => {
      expect(isItemNameValid('\t\n')).toBe(false)
    })
  })

  describe('truncateItemName', () => {
    it('returns unchanged name if under max length', () => {
      const name = 'Short name'
      expect(truncateItemName(name)).toBe(name)
    })

    it('returns unchanged name if exactly at max length', () => {
      const name = 'a'.repeat(MAX_ITEM_NAME_LENGTH)
      expect(truncateItemName(name)).toBe(name)
    })

    it('truncates name if over max length', () => {
      const name = 'a'.repeat(MAX_ITEM_NAME_LENGTH + 50)
      const result = truncateItemName(name)
      expect(result.length).toBe(MAX_ITEM_NAME_LENGTH)
      expect(result).toBe('a'.repeat(MAX_ITEM_NAME_LENGTH))
    })
  })

  describe('canApplyItem', () => {
    describe('with FoodItem', () => {
      it('returns true for valid quantity', () => {
        expect(canApplyItem(makeFoodItem('Food', 100))).toBe(true)
      })

      it('returns false for zero quantity', () => {
        expect(canApplyItem(makeFoodItem('Food', 0))).toBe(false)
      })

      it('returns false for negative quantity', () => {
        expect(canApplyItem(makeFoodItem('Food', -10))).toBe(false)
      })

      it('allows empty name (name derives from food reference)', () => {
        expect(canApplyItem(makeFoodItem('', 100))).toBe(true)
      })
    })

    describe('with GroupItem', () => {
      it('returns true for valid name and quantity', () => {
        expect(canApplyItem(makeGroupItem('Group', 100))).toBe(true)
      })

      it('returns false for empty name', () => {
        expect(canApplyItem(makeGroupItem('', 100))).toBe(false)
      })

      it('returns false for whitespace-only name', () => {
        expect(canApplyItem(makeGroupItem('   ', 100))).toBe(false)
      })

      it('returns false for zero quantity', () => {
        expect(canApplyItem(makeGroupItem('Group', 0))).toBe(false)
      })

      it('returns false for negative quantity', () => {
        expect(canApplyItem(makeGroupItem('Group', -10))).toBe(false)
      })
    })

    describe('with RecipeItem', () => {
      it('returns true for valid name and quantity', () => {
        expect(canApplyItem(makeRecipeItem('Recipe', 100))).toBe(true)
      })

      it('returns false for empty name', () => {
        expect(canApplyItem(makeRecipeItem('', 100))).toBe(false)
      })

      it('returns false for whitespace-only name', () => {
        expect(canApplyItem(makeRecipeItem('   ', 100))).toBe(false)
      })

      it('returns false for zero quantity', () => {
        expect(canApplyItem(makeRecipeItem('Recipe', 0))).toBe(false)
      })

      it('returns false for negative quantity', () => {
        expect(canApplyItem(makeRecipeItem('Recipe', -10))).toBe(false)
      })
    })
  })
})
