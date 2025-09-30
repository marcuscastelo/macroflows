import { type Food } from '~/modules/diet/food/domain/food'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'

export type Template = Food | Recipe

/**
 * Type guard for Template (food).
 * @param t - The Template to check
 * @returns True if Template is food
 */
export function isTemplateFood(t: Template): t is Food {
  // TODO: Replace property assertion as typeguard with a more reliable alternetive
  return 'ean' in t && 'macros' in t && !('user_id' in t)
}

/**
 * Type guard for Template (recipe).
 * @param t - The Template to check
 * @returns True if Template is recipe
 */
export function isTemplateRecipe(t: Template): t is Recipe {
  // TODO: Replace property assertion as typeguard with a more reliable alternetive
  return 'user_id' in t && 'items' in t && 'prepared_multiplier' in t
}
