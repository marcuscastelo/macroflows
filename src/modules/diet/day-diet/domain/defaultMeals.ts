import { createNewMeal, promoteMeal } from '~/modules/diet/meal/domain/meal'
import { generateId } from '~/shared/utils/idUtils'

/**
 * Default meal names for Brazilian users
 * TODO: Make meal names editable and persistent by user
 Issue URL: https://github.com/marcuscastelo/macroflows/issues/1295
 */
const DEFAULT_MEAL_NAMES = [
  'Café da manhã',
  'Almoço',
  'Lanche',
  'Janta',
  'Pós janta',
] as const

/**
 * Creates default meals with empty items for a new day diet
 * @returns Array of promoted meals with generated IDs
 */
export function createDefaultMeals() {
  return DEFAULT_MEAL_NAMES.map((name) =>
    promoteMeal(createNewMeal({ name, items: [] }), { id: generateId() }),
  )
}

/**
 * Get the default meal names
 * @returns Readonly array of default meal names
 */
export function getDefaultMealNames(): readonly string[] {
  return DEFAULT_MEAL_NAMES
}
