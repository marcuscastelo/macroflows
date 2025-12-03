import { describe, expect, it } from 'vitest'

import {
  createNewFood,
  promoteNewFoodToFood,
} from '~/modules/diet/food/domain/food'
import {
  createFoodItem,
  createGroupItem,
  createRecipeItem,
  type FoodItem,
  type GroupItem,
  type RecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { extractRecentFoodReferenceFromItem } from '~/modules/recent-food/application/usecases/extractRecentFoodReference'

describe('extractRecentFoodReferenceFromItem', () => {
  const mockMacros = createMacroNutrients({
    carbsInGrams: 25,
    proteinInGrams: 2,
    fatInGrams: 0.5,
  })

  const mockFood = promoteNewFoodToFood(
    createNewFood({
      name: 'Banana',
      ean: '123',
      macros: mockMacros,
    }),
    { id: 101 },
  )

  describe('FoodItem', () => {
    it('should extract reference from FoodItem', () => {
      const foodItem: FoodItem = createFoodItem({
        id: 1,
        name: 'Banana',
        quantity: 100,
        reference: {
          type: 'food',
          id: mockFood.id,
          macros: mockFood.macros,
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(foodItem)

      expect(result).toEqual({
        type: 'food',
        referenceId: 101,
      })
    })

    it('should extract reference from EAN-scanned food item', () => {
      // Simulating an EAN-scanned food with a specific ID
      const eanFoodItem: FoodItem = createFoodItem({
        id: 999,
        name: 'EAN Scanned Food',
        quantity: 100,
        reference: {
          type: 'food',
          id: 12345, // Database ID of the food
          macros: mockMacros,
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(eanFoodItem)

      expect(result).toEqual({
        type: 'food',
        referenceId: 12345,
      })
    })
  })

  describe('RecipeItem', () => {
    it('should extract reference from RecipeItem', () => {
      const recipeItem: RecipeItem = createRecipeItem({
        id: 2,
        name: 'Test Recipe',
        quantity: 200,
        reference: {
          type: 'recipe',
          id: 202,
          children: [],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(recipeItem)

      expect(result).toEqual({
        type: 'recipe',
        referenceId: 202,
      })
    })

    it('should extract reference from RecipeItem with children', () => {
      const foodChild = createFoodItem({
        id: 10,
        name: 'Child Food',
        quantity: 50,
        reference: {
          type: 'food',
          id: 1001,
          macros: mockMacros,
        },
      })

      const recipeItem: RecipeItem = createRecipeItem({
        id: 3,
        name: 'Recipe with Children',
        quantity: 300,
        reference: {
          type: 'recipe',
          id: 303,
          children: [foodChild],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(recipeItem)

      expect(result).toEqual({
        type: 'recipe',
        referenceId: 303,
      })
    })
  })

  describe('GroupItem', () => {
    it('should extract reference from GroupItem with food child', () => {
      const foodChild = createFoodItem({
        id: 20,
        name: 'Food Child in Group',
        quantity: 100,
        reference: {
          type: 'food',
          id: 2001,
          macros: mockMacros,
        },
      })

      const groupItem: GroupItem = createGroupItem({
        id: 4,
        name: 'Food Group',
        quantity: 100,
        reference: {
          type: 'group',
          children: [foodChild],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(groupItem)

      expect(result).toEqual({
        type: 'food',
        referenceId: 2001,
      })
    })

    it('should extract reference from GroupItem with recipe child', () => {
      const recipeChild: RecipeItem = createRecipeItem({
        id: 21,
        name: 'Recipe Child in Group',
        quantity: 200,
        reference: {
          type: 'recipe',
          id: 2002,
          children: [],
        },
      })

      const groupItem: GroupItem = createGroupItem({
        id: 5,
        name: 'Recipe Group',
        quantity: 200,
        reference: {
          type: 'group',
          children: [recipeChild],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(groupItem)

      expect(result).toEqual({
        type: 'recipe',
        referenceId: 2002,
      })
    })

    it('should use first child when group has multiple children', () => {
      const foodChild1 = createFoodItem({
        id: 30,
        name: 'First Food',
        quantity: 50,
        reference: {
          type: 'food',
          id: 3001,
          macros: mockMacros,
        },
      })

      const foodChild2 = createFoodItem({
        id: 31,
        name: 'Second Food',
        quantity: 75,
        reference: {
          type: 'food',
          id: 3002,
          macros: mockMacros,
        },
      })

      const groupItem: GroupItem = createGroupItem({
        id: 6,
        name: 'Multi-Food Group',
        quantity: 125,
        reference: {
          type: 'group',
          children: [foodChild1, foodChild2],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(groupItem)

      expect(result).toEqual({
        type: 'food',
        referenceId: 3001, // First child's reference
      })
    })

    it('should return undefined for GroupItem with empty children', () => {
      const groupItem: GroupItem = createGroupItem({
        id: 7,
        name: 'Empty Group',
        quantity: 100,
        reference: {
          type: 'group',
          children: [],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(groupItem)

      expect(result).toBeUndefined()
    })

    it('should return undefined for GroupItem with nested group child (no trackable reference)', () => {
      const nestedGroup: GroupItem = createGroupItem({
        id: 40,
        name: 'Nested Group',
        quantity: 50,
        reference: {
          type: 'group',
          children: [],
        },
      })

      const groupItem: GroupItem = createGroupItem({
        id: 8,
        name: 'Group with Nested Group',
        quantity: 100,
        reference: {
          type: 'group',
          children: [nestedGroup],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(groupItem)

      expect(result).toBeUndefined()
    })
  })

  describe('EAN flow specific tests', () => {
    it('should correctly handle food item created from EAN scan', () => {
      // This simulates the exact flow when a food is added via EAN scan:
      // 1. Food is fetched/imported from API with a database ID
      // 2. templateToItem creates a FoodItem with reference.id = food's database ID
      // 3. extractRecentFoodReferenceFromItem should extract that reference for tracking

      const eanScannedFood = promoteNewFoodToFood(
        createNewFood({
          name: 'Coca Cola Zero',
          ean: '7894900011517',
          macros: createMacroNutrients({
            carbsInGrams: 0,
            proteinInGrams: 0,
            fatInGrams: 0,
          }),
        }),
        { id: 98765 }, // This is the database ID
      )

      // This simulates what templateToItem does
      const itemFromEanFood: FoodItem = createFoodItem({
        id: 12345, // This is a generated UI ID (not the database ID)
        name: eanScannedFood.name,
        quantity: 100,
        reference: {
          type: 'food',
          id: eanScannedFood.id, // The database ID (98765)
          macros: eanScannedFood.macros,
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(itemFromEanFood)

      expect(result).not.toBeUndefined()
      expect(result?.type).toBe('food')
      expect(result?.referenceId).toBe(98765) // Must match the database ID
    })

    it('should handle food item converted to group in edit modal', () => {
      // This simulates when user clicks "Tratar como Grupo" in the edit modal
      // User clicks "Tratar como Grupo" - the food becomes wrapped in a group
      const groupifiedItem: GroupItem = createGroupItem({
        id: 1000, // Same ID as original
        name: 'Original Food',
        quantity: 100,
        reference: {
          type: 'group',
          children: [
            createFoodItem({
              id: 1001, // New child ID
              name: 'Original Food',
              quantity: 100,
              reference: {
                type: 'food',
                id: 5555, // Same database reference
                macros: mockMacros,
              },
            }),
          ],
        },
      })

      const [result] = extractRecentFoodReferenceFromItem(groupifiedItem)

      expect(result).not.toBeUndefined()
      expect(result?.type).toBe('food')
      expect(result?.referenceId).toBe(5555) // Should still track the original food
    })
  })
})
