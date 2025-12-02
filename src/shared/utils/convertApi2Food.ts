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
      carbsInMg: food.carboidratos * 100000,
      proteinInMg: food.proteinas * 100000,
      fatInMg: food.gordura * 100000,
    }),
  })
}
