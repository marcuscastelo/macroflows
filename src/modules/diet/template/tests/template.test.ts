import { describe, expect, it } from 'vitest'

import { type Food } from '~/modules/diet/food/domain/food'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import {
  isTemplateFood,
  isTemplateRecipe,
  type Template,
} from '~/modules/diet/template/domain/template'

describe('Template Domain', () => {
  describe('isTemplateFood', () => {
    it('should return true for Food template', () => {
      const food: Food = {
        id: 1,
        name: 'Test Food',
        ean: '1234567890123',
        macros: createMacroNutrients({
          proteinInGrams: 10,
          carbsInGrams: 20,
          fatInGrams: 5,
        }),
        __type: 'Food',
      }

      expect(isTemplateFood(food)).toBe(true)
    })

    it('should return false for Recipe template', () => {
      const recipe: Recipe = {
        id: 1,
        name: 'Test Recipe',
        user_id: '42',
        items: [],
        prepared_multiplier: 1,
        __type: 'Recipe',
      }

      expect(isTemplateFood(recipe)).toBe(false)
    })

    it('should correctly identify food with all properties', () => {
      const foodWithAllProps: Food = {
        id: 1,
        name: 'Complete Food',
        ean: '1234567890123',
        source: {
          type: 'api',
          id: 'api-123',
        },
        macros: createMacroNutrients({
          proteinInGrams: 10,
          carbsInGrams: 20,
          fatInGrams: 5,
        }),
        __type: 'Food',
      }

      expect(isTemplateFood(foodWithAllProps)).toBe(true)
    })

    it('should correctly identify food with minimal properties', () => {
      const minimalFood: Food = {
        id: 1,
        name: 'Minimal Food',
        ean: null,
        macros: createMacroNutrients({
          proteinInGrams: 10,
          carbsInGrams: 20,
          fatInGrams: 5,
        }),
        __type: 'Food',
      }

      expect(isTemplateFood(minimalFood)).toBe(true)
    })
  })

  describe('isTemplateRecipe', () => {
    it('should return true for Recipe template', () => {
      const recipe: Recipe = {
        id: 1,
        name: 'Test Recipe',
        user_id: '42',
        items: [],
        prepared_multiplier: 1,
        __type: 'Recipe',
      }

      expect(isTemplateRecipe(recipe)).toBe(true)
    })

    it('should return false for Food template', () => {
      const food: Food = {
        id: 1,
        name: 'Test Food',
        ean: '1234567890123',
        macros: createMacroNutrients({
          proteinInGrams: 10,
          carbsInGrams: 20,
          fatInGrams: 5,
        }),
        __type: 'Food',
      }

      expect(isTemplateRecipe(food)).toBe(false)
    })

    it('should correctly identify recipe with items', () => {
      const recipeWithItems: Recipe = {
        id: 1,
        name: 'Recipe With Items',
        user_id: '42',
        items: [
          {
            id: 1,
            name: 'Ingredient 1',
            reference: {
              type: 'food',
              id: 10,
              macros: createMacroNutrients({
                proteinInGrams: 10,
                carbsInGrams: 20,
                fatInGrams: 5,
              }),
            },
            quantity: 100,
            __type: 'UnifiedItem',
          },
          {
            id: 2,
            name: 'Ingredient 2',
            reference: {
              type: 'food',
              id: 20,
              macros: createMacroNutrients({
                proteinInGrams: 10,
                carbsInGrams: 15,
                fatInGrams: 3,
              }),
            },
            quantity: 50,
            __type: 'UnifiedItem',
          },
        ],
        prepared_multiplier: 2,
        __type: 'Recipe',
      }

      expect(isTemplateRecipe(recipeWithItems)).toBe(true)
    })

    it('should correctly identify recipe with different multipliers', () => {
      const multiplierTestCases = [0.5, 1, 1.5, 2, 10, 100]

      multiplierTestCases.forEach((multiplier) => {
        const recipe: Recipe = {
          id: 1,
          name: `Recipe with ${multiplier}x multiplier`,
          user_id: '42',
          items: [],
          prepared_multiplier: multiplier,
          __type: 'Recipe',
        }

        expect(isTemplateRecipe(recipe)).toBe(true)
      })
    })
  })

  describe('Template usage patterns', () => {
    it('should allow template switching with type guards', () => {
      const templates: Template[] = [
        {
          id: 1,
          name: 'Template Food',
          ean: '1234567890123',
          macros: createMacroNutrients({
            proteinInGrams: 10,
            carbsInGrams: 20,
            fatInGrams: 5,
          }),
          __type: 'Food',
        },
        {
          id: 2,
          name: 'Template Recipe',
          user_id: '42',
          items: [],
          prepared_multiplier: 1,
          __type: 'Recipe',
        },
      ]

      templates.forEach((template) => {
        if (isTemplateFood(template)) {
          expect(template.name).toBe('Template Food')
          expect(template.ean).toBe('1234567890123')
        } else if (isTemplateRecipe(template)) {
          expect(template.name).toBe('Template Recipe')
          expect(template.user_id).toBe('42')
          expect(template.items).toEqual([])
          expect(template.prepared_multiplier).toBe(1)
        } else {
          expect.fail('$1')
        }
      })
    })

    it('should handle template arrays with mixed types', () => {
      const mixedTemplates: Template[] = [
        {
          id: 1,
          name: 'Food 1',
          ean: '1111111111111',
          macros: createMacroNutrients({
            proteinInGrams: 2,
            carbsInGrams: 10,
            fatInGrams: 1,
          }),
          __type: 'Food',
        },
        {
          id: 2,
          name: 'Recipe 1',
          user_id: '42',
          items: [],
          prepared_multiplier: 1,
          __type: 'Recipe',
        },
        {
          id: 3,
          name: 'Food 2',
          ean: '2222222222222',
          macros: createMacroNutrients({
            proteinInGrams: 5,
            carbsInGrams: 20,
            fatInGrams: 2,
          }),
          __type: 'Food',
        },
        {
          id: 4,
          name: 'Recipe 2',
          user_id: '43',
          items: [],
          prepared_multiplier: 2,
          __type: 'Recipe',
        },
      ]

      const foods = mixedTemplates.filter(isTemplateFood)
      const recipes = mixedTemplates.filter(isTemplateRecipe)

      expect(foods.length).toBe(2)
      expect(recipes.length).toBe(2)

      foods.forEach((food) => {
        expect(food.__type).toBe('Food')
        expect('ean' in food).toBe(true)
        expect('macros' in food).toBe(true)
      })

      recipes.forEach((recipe) => {
        expect(recipe.__type).toBe('Recipe')
        expect('user_id' in recipe).toBe(true)
        expect('items' in recipe).toBe(true)
        expect('prepared_multiplier' in recipe).toBe(true)
      })
    })
  })

  describe('Edge cases and boundary conditions', () => {
    it('should handle food with null EAN', () => {
      const foodWithNullEan: Food = {
        id: 1,
        name: 'Food With Null EAN',
        ean: null,
        macros: createMacroNutrients({
          proteinInGrams: 10,
          carbsInGrams: 20,
          fatInGrams: 5,
        }),
        __type: 'Food',
      }

      expect(isTemplateFood(foodWithNullEan)).toBe(true)
      expect(isTemplateRecipe(foodWithNullEan)).toBe(false)
    })

    it('should handle food with undefined source', () => {
      const foodWithUndefinedSource: Food = {
        id: 1,
        name: 'Food With Undefined Source',
        ean: '1234567890123',
        source: undefined,
        macros: createMacroNutrients({
          proteinInGrams: 10,
          carbsInGrams: 20,
          fatInGrams: 5,
        }),
        __type: 'Food',
      }

      expect(isTemplateFood(foodWithUndefinedSource)).toBe(true)
      expect(isTemplateRecipe(foodWithUndefinedSource)).toBe(false)
    })

    it('should handle recipe with empty items array', () => {
      const recipeWithEmptyItems: Recipe = {
        id: 1,
        name: 'Recipe With Empty Items',
        user_id: '42',
        items: [],
        prepared_multiplier: 1,
        __type: 'Recipe',
      }

      expect(isTemplateFood(recipeWithEmptyItems)).toBe(false)
      expect(isTemplateRecipe(recipeWithEmptyItems)).toBe(true)
    })

    it('should handle recipe with zero multiplier', () => {
      const recipeWithZeroMultiplier: Recipe = {
        id: 1,
        name: 'Recipe With Zero Multiplier',
        user_id: '42',
        items: [],
        prepared_multiplier: 0,
        __type: 'Recipe',
      }

      expect(isTemplateFood(recipeWithZeroMultiplier)).toBe(false)
      expect(isTemplateRecipe(recipeWithZeroMultiplier)).toBe(true)
    })

    it('should handle recipe with very large multiplier', () => {
      const recipeWithLargeMultiplier: Recipe = {
        id: 1,
        name: 'Recipe With Large Multiplier',
        user_id: '42',
        items: [],
        prepared_multiplier: 1000,
        __type: 'Recipe',
      }

      expect(isTemplateFood(recipeWithLargeMultiplier)).toBe(false)
      expect(isTemplateRecipe(recipeWithLargeMultiplier)).toBe(true)
    })

    it('should handle recipe with decimal multiplier', () => {
      const recipeWithDecimalMultiplier: Recipe = {
        id: 1,
        name: 'Recipe With Decimal Multiplier',
        user_id: '42',
        items: [],
        prepared_multiplier: 0.5,
        __type: 'Recipe',
      }

      expect(isTemplateFood(recipeWithDecimalMultiplier)).toBe(false)
      expect(isTemplateRecipe(recipeWithDecimalMultiplier)).toBe(true)
    })
  })
})
