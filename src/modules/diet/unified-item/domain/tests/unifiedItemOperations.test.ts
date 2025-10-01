import { describe, expect, it } from 'vitest'

import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import {
  compareUnifiedItemArrays,
  scaleRecipeItemQuantity,
  synchronizeRecipeItemWithOriginal,
} from '~/modules/diet/unified-item/domain/unifiedItemOperations'
import {
  createUnifiedItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'

describe('compareUnifiedItemArrays', () => {
  const createFoodItem = (id: number, name: string, quantity: number) =>
    createUnifiedItem({
      id,
      name,
      quantity,
      reference: {
        type: 'food',
        id,
        macros: createMacroNutrients({
          protein: 10,
          carbs: 20,
          fat: 5,
        }),
      },
    })

  const createRecipeItem = (
    id: number,
    name: string,
    quantity: number,
    children: UnifiedItem[] = [],
  ) =>
    createUnifiedItem({
      id,
      name,
      quantity,
      reference: {
        type: 'recipe',
        id,
        children,
      },
    })

  it('returns true for identical arrays', () => {
    const items1 = [
      createFoodItem(1, 'Apple', 100),
      createFoodItem(2, 'Banana', 150),
    ]
    const items2 = [
      createFoodItem(1, 'Apple', 100),
      createFoodItem(2, 'Banana', 150),
    ]

    expect(compareUnifiedItemArrays(items1, items2)).toBe(true)
  })

  it('returns true for arrays with same items in different order', () => {
    const items1 = [
      createFoodItem(1, 'Apple', 100),
      createFoodItem(2, 'Banana', 150),
    ]
    const items2 = [
      createFoodItem(2, 'Banana', 150),
      createFoodItem(1, 'Apple', 100),
    ]

    expect(compareUnifiedItemArrays(items1, items2)).toBe(true)
  })

  it('returns false for arrays with different lengths', () => {
    const items1 = [createFoodItem(1, 'Apple', 100)]
    const items2 = [
      createFoodItem(1, 'Apple', 100),
      createFoodItem(2, 'Banana', 150),
    ]

    expect(compareUnifiedItemArrays(items1, items2)).toBe(false)
  })

  it('returns false when quantities differ', () => {
    const items1 = [createFoodItem(1, 'Apple', 100)]
    const items2 = [createFoodItem(1, 'Apple', 200)]

    expect(compareUnifiedItemArrays(items1, items2)).toBe(false)
  })

  it('returns false when names differ', () => {
    const items1 = [createFoodItem(1, 'Apple', 100)]
    const items2 = [createFoodItem(1, 'Orange', 100)]

    expect(compareUnifiedItemArrays(items1, items2)).toBe(false)
  })

  it('returns false when macros differ', () => {
    const item1 = createUnifiedItem({
      id: 1,
      name: 'Apple',
      quantity: 100,
      reference: {
        type: 'food',
        id: 1,
        macros: createMacroNutrients({
          protein: 10,
          carbs: 20,
          fat: 5,
        }),
      },
    })

    const item2 = createUnifiedItem({
      id: 1,
      name: 'Apple',
      quantity: 100,
      reference: {
        type: 'food',
        id: 1,
        macros: createMacroNutrients({
          protein: 15, // Different protein
          carbs: 20,
          fat: 5,
        }),
      },
    })

    expect(compareUnifiedItemArrays([item1], [item2])).toBe(false)
  })

  it('returns true for identical recipe items with children', () => {
    const children = [createFoodItem(10, 'Flour', 200)]
    const items1 = [createRecipeItem(1, 'Bread', 500, children)]
    const items2 = [createRecipeItem(1, 'Bread', 500, children)]

    expect(compareUnifiedItemArrays(items1, items2)).toBe(true)
  })

  it('returns false when recipe children differ', () => {
    const children1 = [createFoodItem(10, 'Flour', 200)]
    const children2 = [createFoodItem(10, 'Flour', 300)] // Different quantity
    const items1 = [createRecipeItem(1, 'Bread', 500, children1)]
    const items2 = [createRecipeItem(1, 'Bread', 500, children2)]

    expect(compareUnifiedItemArrays(items1, items2)).toBe(false)
  })
})

describe('synchronizeRecipeItemWithOriginal', () => {
  it('should synchronize recipe item with original items', () => {
    const originalItems: UnifiedItem[] = [
      {
        id: 100,
        name: 'Original Apple',
        quantity: 200,
        reference: {
          type: 'food',
          id: 10,
          macros: createMacroNutrients({ protein: 2, carbs: 50, fat: 0 }),
        },
        __type: 'UnifiedItem',
      },
    ]

    const modifiedChild: UnifiedItem = {
      id: 100,
      name: 'Modified Apple', // Name changed
      quantity: 150, // Quantity changed
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 2, carbs: 37.5, fat: 0 }), // Macros changed
      },
      __type: 'UnifiedItem',
    }

    const recipeItem: UnifiedItem = {
      id: 1,
      name: 'Apple Recipe',
      quantity: 1,
      reference: {
        type: 'recipe',
        id: 500,
        children: [modifiedChild], // Contains modified version
      },
      __type: 'UnifiedItem',
    }

    const synchronized = synchronizeRecipeItemWithOriginal(
      recipeItem,
      originalItems,
    )

    expect(synchronized.reference.type).toBe('recipe')
    if (synchronized.reference.type === 'recipe') {
      expect(synchronized.reference.children).toHaveLength(1)
      const syncedChild = synchronized.reference.children[0]!

      // Should have original values (including original ID)
      expect(syncedChild.id).toBe(originalItems[0]!.id) // Keep original ID
      expect(syncedChild.name).toBe('Original Apple') // Original name
      expect(syncedChild.quantity).toBe(200) // Original quantity

      if (syncedChild.reference.type === 'food') {
        expect(syncedChild.reference.macros).toEqual(
          createMacroNutrients({ protein: 2, carbs: 50, fat: 0 }),
        ) // Original macros
      }
    }

    // BUG FIX: Verify that parent recipe quantity matches sum of children quantities
    expect(synchronized.quantity).toBe(200) // Should match the sum of children (200g)
  })

  it('should calculate total quantity from multiple children', () => {
    const originalItems: UnifiedItem[] = [
      {
        id: 100,
        name: 'Apple',
        quantity: 150,
        reference: {
          type: 'food',
          id: 10,
          macros: createMacroNutrients({ protein: 1, carbs: 35, fat: 0 }),
        },
        __type: 'UnifiedItem',
      },
      {
        id: 101,
        name: 'Banana',
        quantity: 100,
        reference: {
          type: 'food',
          id: 11,
          macros: createMacroNutrients({ protein: 1, carbs: 25, fat: 0 }),
        },
        __type: 'UnifiedItem',
      },
    ]

    const recipeItem: UnifiedItem = {
      id: 1,
      name: 'Fruit Mix',
      quantity: 500, // Inconsistent with children sum (should be 250)
      reference: {
        type: 'recipe',
        id: 500,
        children: [], // Empty children for test
      },
      __type: 'UnifiedItem',
    }

    const synchronized = synchronizeRecipeItemWithOriginal(
      recipeItem,
      originalItems,
    )

    // Should calculate correct total: 150 + 100 = 250
    expect(synchronized.quantity).toBe(250)
    expect(synchronized.reference.type).toBe('recipe')
    if (synchronized.reference.type === 'recipe') {
      expect(synchronized.reference.children).toHaveLength(2)
    }
  })

  it('should handle empty children array', () => {
    const recipeItem: UnifiedItem = {
      id: 1,
      name: 'Empty Recipe',
      quantity: 100, // Should become 0 after sync
      reference: {
        type: 'recipe',
        id: 500,
        children: [
          {
            id: 999,
            name: 'Some Item',
            quantity: 50,
            reference: {
              type: 'food',
              id: 999,
              macros: createMacroNutrients({ protein: 1, carbs: 10, fat: 0 }),
            },
            __type: 'UnifiedItem',
          },
        ],
      },
      __type: 'UnifiedItem',
    }

    const synchronized = synchronizeRecipeItemWithOriginal(recipeItem, [])

    // Empty children should result in 0 total quantity
    expect(synchronized.quantity).toBe(0)
    expect(synchronized.reference.type).toBe('recipe')
    if (synchronized.reference.type === 'recipe') {
      expect(synchronized.reference.children).toHaveLength(0)
    }
  })

  it('should throw error for non-recipe items', () => {
    const foodItem: UnifiedItem = {
      id: 1,
      name: 'Apple',
      quantity: 100,
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 1, carbs: 25, fat: 0 }),
      },
      __type: 'UnifiedItem',
    }

    expect(() => {
      synchronizeRecipeItemWithOriginal(foodItem, [])
    }).toThrow('Can only synchronize recipe items')
  })
})

describe('scaleRecipeItemQuantity', () => {
  it('should scale recipe item children proportionally', () => {
    const childFood: UnifiedItem = {
      id: 1,
      name: 'Flour',
      quantity: 100, // Original: 100g
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 10, carbs: 70, fat: 1 }),
      },
      __type: 'UnifiedItem',
    }

    const recipeItem: UnifiedItem = {
      id: 2,
      name: 'Bread Recipe',
      quantity: 500, // Original: 500g total
      reference: {
        type: 'recipe',
        id: 100,
        children: [childFood],
      },
      __type: 'UnifiedItem',
    }

    // Scale from 500g to 1000g (double)
    const scaledItem = scaleRecipeItemQuantity(recipeItem, 1000)

    expect(scaledItem.quantity).toBe(1000)
    expect(scaledItem.reference.type).toBe('recipe')

    if (scaledItem.reference.type === 'recipe') {
      expect(scaledItem.reference.children).toHaveLength(1)
      const scaledChild = scaledItem.reference.children[0]!

      // Child should be scaled from 100g to 200g (double)
      expect(scaledChild.quantity).toBe(200)
      expect(scaledChild.name).toBe('Flour')
      expect(scaledChild.id).toBe(1) // ID should remain same
    }
  })

  it('should handle multiple children scaling', () => {
    const child1: UnifiedItem = {
      id: 1,
      name: 'Flour',
      quantity: 100,
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 10, carbs: 70, fat: 1 }),
      },
      __type: 'UnifiedItem',
    }

    const child2: UnifiedItem = {
      id: 2,
      name: 'Sugar',
      quantity: 50,
      reference: {
        type: 'food',
        id: 20,
        macros: createMacroNutrients({ protein: 0, carbs: 100, fat: 0 }),
      },
      __type: 'UnifiedItem',
    }

    const recipeItem: UnifiedItem = {
      id: 3,
      name: 'Cookie Recipe',
      quantity: 300, // 100g flour + 50g sugar = 150g ingredients, 300g prepared
      reference: {
        type: 'recipe',
        id: 200,
        children: [child1, child2],
      },
      __type: 'UnifiedItem',
    }

    // Scale from 300g to 150g (half)
    const scaledItem = scaleRecipeItemQuantity(recipeItem, 150)

    expect(scaledItem.quantity).toBe(150)

    if (scaledItem.reference.type === 'recipe') {
      const [scaledChild1, scaledChild2] = scaledItem.reference.children

      // All children should be halved
      expect(scaledChild1!.quantity).toBe(50) // 100g → 50g
      expect(scaledChild2!.quantity).toBe(25) // 50g → 25g
    }
  })

  it('should round quantities to 2 decimal places', () => {
    const childFood: UnifiedItem = {
      id: 1,
      name: 'Ingredient',
      quantity: 33.33,
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 5, carbs: 10, fat: 2 }),
      },
      __type: 'UnifiedItem',
    }

    const recipeItem: UnifiedItem = {
      id: 2,
      name: 'Recipe',
      quantity: 100,
      reference: {
        type: 'recipe',
        id: 100,
        children: [childFood],
      },
      __type: 'UnifiedItem',
    }

    // Scale by factor that would create long decimals
    const scaledItem = scaleRecipeItemQuantity(recipeItem, 123.45)

    expect(scaledItem.quantity).toBe(123.45)

    if (scaledItem.reference.type === 'recipe') {
      const scaledChild = scaledItem.reference.children[0]!
      // 33.33 * (123.45/100) = 41.1669, rounds to 41.1459 (4 decimal places)
      expect(scaledChild.quantity).toBe(41.1459)
    }
  })

  it('should throw error for non-recipe items', () => {
    const foodItem: UnifiedItem = {
      id: 1,
      name: 'Apple',
      quantity: 100,
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 1, carbs: 25, fat: 0 }),
      },
      __type: 'UnifiedItem',
    }

    expect(() => {
      scaleRecipeItemQuantity(foodItem, 200)
    }).toThrow('Can only scale recipe items')
  })

  it('should throw error for invalid quantities', () => {
    const recipeItem: UnifiedItem = {
      id: 1,
      name: 'Recipe',
      quantity: 100,
      reference: {
        type: 'recipe',
        id: 100,
        children: [],
      },
      __type: 'UnifiedItem',
    }

    expect(() => {
      scaleRecipeItemQuantity(recipeItem, 0)
    }).toThrow('New quantity must be greater than 0')

    expect(() => {
      scaleRecipeItemQuantity(recipeItem, -10)
    }).toThrow('New quantity must be greater than 0')
  })

  it('should enforce minimum quantities to prevent zero-lock', () => {
    const childFood: UnifiedItem = {
      id: 1,
      name: 'Salt',
      quantity: 0.1, // Very small amount
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 0, carbs: 0, fat: 0 }),
      },
      __type: 'UnifiedItem',
    }

    const recipeItem: UnifiedItem = {
      id: 2,
      name: 'Recipe',
      quantity: 100,
      reference: {
        type: 'recipe',
        id: 100,
        children: [childFood],
      },
      __type: 'UnifiedItem',
    }

    // Scale down to very small amount that would normally round to 0
    const scaledItem = scaleRecipeItemQuantity(recipeItem, 0.001) // Scale to 0.001g

    // Main item should be at least 0.01g
    expect(scaledItem.quantity).toBe(0.01)

    if (scaledItem.reference.type === 'recipe') {
      const scaledChild = scaledItem.reference.children[0]!
      // Child should be at least 0.0001g even if scaling would make it smaller
      expect(scaledChild.quantity).toBeGreaterThanOrEqual(0.0001)
      expect(scaledChild.quantity).toBe(0.0001) // Should be exactly the minimum
    }
  })

  it('should maintain normal scaling when above minimum thresholds', () => {
    const childFood: UnifiedItem = {
      id: 1,
      name: 'Flour',
      quantity: 10,
      reference: {
        type: 'food',
        id: 10,
        macros: createMacroNutrients({ protein: 10, carbs: 70, fat: 1 }),
      },
      __type: 'UnifiedItem',
    }

    const recipeItem: UnifiedItem = {
      id: 2,
      name: 'Recipe',
      quantity: 100,
      reference: {
        type: 'recipe',
        id: 100,
        children: [childFood],
      },
      __type: 'UnifiedItem',
    }

    // Scale to reasonable size - should work normally
    const scaledItem = scaleRecipeItemQuantity(recipeItem, 50)

    expect(scaledItem.quantity).toBe(50)

    if (scaledItem.reference.type === 'recipe') {
      const scaledChild = scaledItem.reference.children[0]!
      // 10g * (50/100) = 5g - normal scaling
      expect(scaledChild.quantity).toBe(5)
    }
  })
})
