import { createNewFood, type NewFood } from '~/modules/diet/food/domain/food'
import { type ApiFood } from '~/modules/diet/food/infrastructure/api/domain/apiFoodSchema'
import { createMacroNutrients } from '~/modules/diet/macro-nutrients/domain/macroNutrients'

/**
 * Converts an ApiFood object to a NewFood object.
 * @param food - The ApiFood object to convert.
 * @returns The corresponding NewFood object.
 */
export function convertApi2Food(food: ApiFood): NewFood {
  return createNewFood({
    name: food.nome,
    source: {
      type: 'api',
      id: food.id.toString(),
    },
    ean: food.ean === '' ? null : food.ean, // Convert EAN to null if not provided
    macros: createMacroNutrients({
      carbs: food.carboidratos * 100,
      protein: food.proteinas * 100,
      fat: food.gordura * 100,
    }),
  })
}
