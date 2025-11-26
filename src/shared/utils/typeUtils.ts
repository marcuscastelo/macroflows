import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'

export type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export type ObjectValues<T extends object> = T[keyof T]

export function isItem(obj: unknown): obj is Item {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    obj.__type === 'UnifiedItem'
  )
}

export function isMeal(obj: unknown): obj is Meal {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    obj.__type === 'Meal'
  )
}

export function isRecipe(obj: unknown): obj is Recipe {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    obj.__type === 'Recipe'
  )
}
