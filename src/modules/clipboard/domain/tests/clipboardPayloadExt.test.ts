import { describe, expect, it } from 'vitest'

import { ClipboardPayloadExt } from '~/modules/clipboard/domain/clipboardPayloadExt'
import { createItem, type Item } from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import {
  createNewRecipe,
  promoteRecipe,
} from '~/modules/diet/recipe/domain/recipe'

const createFoodItem = (id: number, name: string, quantity: number): Item =>
  createItem({
    id,
    name,
    quantity,
    reference: {
      type: 'food',
      id: id * 10,
      macros: createMacroNutrients({
        proteinInGrams: 10,
        carbsInGrams: 20,
        fatInGrams: 5,
      }),
    },
  })

const expectRegeneratedId = (actualId: number, originalId: number): void => {
  expect(actualId).not.toBe(originalId)
  expect(Number.isSafeInteger(actualId)).toBe(true)
}

describe('ClipboardPayloadExt', () => {
  describe('extractItems', () => {
    it('extracts a single item and regenerates its id while preserving content', () => {
      const payload = createFoodItem(10, 'Banana', 150)

      const extractedItems = ClipboardPayloadExt.extractItems(payload)

      expect(extractedItems).toHaveLength(1)
      expectRegeneratedId(extractedItems[0]!.id, payload.id)
      expect(extractedItems[0]).toEqual({
        ...payload,
        id: extractedItems[0]!.id,
      })
      expect(payload.id).toBe(10)
    })

    it('extracts meal items and regenerates unique ids for every item', () => {
      const items = [
        createFoodItem(10, 'Rice', 100),
        createFoodItem(20, 'Beans', 80),
      ]
      const payload = promoteMeal(createNewMeal({ name: 'Lunch', items }), {
        id: 1,
      })

      const extractedItems = ClipboardPayloadExt.extractItems(payload)

      expect(extractedItems).toHaveLength(2)
      expectRegeneratedId(extractedItems[0]!.id, items[0]!.id)
      expectRegeneratedId(extractedItems[1]!.id, items[1]!.id)
      expect(new Set(extractedItems.map((item) => item.id)).size).toBe(
        extractedItems.length,
      )
      expect(extractedItems).toEqual([
        { ...items[0], id: extractedItems[0]!.id },
        { ...items[1], id: extractedItems[1]!.id },
      ])
      expect(payload.items).toEqual(items)
    })

    it('extracts recipe items and regenerates unique ids for every item', () => {
      const items = [
        createFoodItem(30, 'Tomato', 120),
        createFoodItem(40, 'Cheese', 50),
      ]
      const payload = promoteRecipe(
        createNewRecipe({
          name: 'Salad',
          user_id: 'user-1',
          items,
          prepared_multiplier: 1.5,
        }),
        { id: 2 },
      )

      const extractedItems = ClipboardPayloadExt.extractItems(payload)

      expect(extractedItems).toHaveLength(2)
      expectRegeneratedId(extractedItems[0]!.id, items[0]!.id)
      expectRegeneratedId(extractedItems[1]!.id, items[1]!.id)
      expect(new Set(extractedItems.map((item) => item.id)).size).toBe(
        extractedItems.length,
      )
      expect(extractedItems).toEqual([
        { ...items[0], id: extractedItems[0]!.id },
        { ...items[1], id: extractedItems[1]!.id },
      ])
      expect(payload.items).toEqual(items)
    })
  })
})
