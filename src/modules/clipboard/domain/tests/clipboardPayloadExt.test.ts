import { afterEach, describe, expect, it, vi } from 'vitest'

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

const expectRegeneratedId = (
  actualId: number,
  originalId: number,
  randomValue: number,
): void => {
  expect(actualId).toBe(Math.round(randomValue * 1000000))
  expect(actualId).not.toBe(originalId)
  expect(Number.isInteger(actualId)).toBe(true)
}

describe('ClipboardPayloadExt', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('extractItems', () => {
    it('extracts a single item and regenerates its id while preserving content', () => {
      const payload = createFoodItem(10, 'Banana', 150)

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.123456)

      const extractedItems = ClipboardPayloadExt.extractItems(payload)

      expect(extractedItems).toHaveLength(1)
      expectRegeneratedId(extractedItems[0]!.id, payload.id, 0.123456)
      expect(extractedItems[0]).toEqual({
        ...payload,
        id: 123456,
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

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.111111)
        .mockReturnValueOnce(0.222222)

      const extractedItems = ClipboardPayloadExt.extractItems(payload)

      expect(extractedItems).toHaveLength(2)
      expectRegeneratedId(extractedItems[0]!.id, items[0]!.id, 0.111111)
      expectRegeneratedId(extractedItems[1]!.id, items[1]!.id, 0.222222)
      expect(extractedItems).toEqual([
        { ...items[0], id: 111111 },
        { ...items[1], id: 222222 },
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

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.333333)
        .mockReturnValueOnce(0.444444)

      const extractedItems = ClipboardPayloadExt.extractItems(payload)

      expect(extractedItems).toHaveLength(2)
      expectRegeneratedId(extractedItems[0]!.id, items[0]!.id, 0.333333)
      expectRegeneratedId(extractedItems[1]!.id, items[1]!.id, 0.444444)
      expect(extractedItems).toEqual([
        { ...items[0], id: 333333 },
        { ...items[1], id: 444444 },
      ])
      expect(payload.items).toEqual(items)
    })
  })
})
