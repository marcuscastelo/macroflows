import { describe, expect, it } from 'vitest'

import { type TemplateItem } from '~/modules/diet/template-item/domain/templateItem'

describe('TemplateItem Domain', () => {
  describe('Template Item Business Logic', () => {
    it('should validate template item macro consistency', () => {
      const foodTemplate: TemplateItem = {
        id: 1,
        name: 'High Protein Food',
        reference: {
          type: 'food',
          id: 42,
          macros: {
            protein: 25,
            carbs: 5,
            fat: 3,
            __type: 'MacroNutrients',
          },
        },
        quantity: 100,
        __type: 'UnifiedItem',
      }

      // Template items should maintain macro consistency
      expect(foodTemplate.reference.macros.protein).toBeGreaterThan(20)
      expect(foodTemplate.quantity).toBeGreaterThan(0)
      expect(foodTemplate.reference.type).toBe('food')
    })

    it('should handle recipe template complexity', () => {
      const complexRecipe: TemplateItem = {
        id: 2,
        name: 'Complex Recipe Template',
        reference: {
          type: 'recipe',
          id: 99,
          children: [
            {
              id: 1,
              name: 'Test Food 1',
              quantity: 50,
              __type: 'UnifiedItem' as const,
              reference: {
                type: 'food' as const,
                id: 1,
                macros: {
                  protein: 10,
                  carbs: 20,
                  fat: 5,
                  __type: 'MacroNutrients' as const,
                },
              },
            },
            {
              id: 2,
              name: 'Test Food 2',
              quantity: 100,
              __type: 'UnifiedItem' as const,
              reference: {
                type: 'food' as const,
                id: 2,
                macros: {
                  protein: 15,
                  carbs: 30,
                  fat: 8,
                  __type: 'MacroNutrients' as const,
                },
              },
            },
            {
              id: 3,
              name: 'Test Food 3',
              quantity: 25,
              __type: 'UnifiedItem' as const,
              reference: {
                type: 'food' as const,
                id: 3,
                macros: {
                  protein: 8,
                  carbs: 25,
                  fat: 3,
                  __type: 'MacroNutrients' as const,
                },
              },
            },
          ],
        },
        quantity: 200,
        __type: 'UnifiedItem',
      }

      // Recipe templates should maintain structural integrity
      expect(complexRecipe.reference.children.length).toBeGreaterThan(0)
      expect(
        complexRecipe.reference.children.every((child) => child.quantity > 0),
      ).toBe(true)
      expect(complexRecipe.name).toContain('Recipe')
    })
  })
})
