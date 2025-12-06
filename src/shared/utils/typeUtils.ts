import { type Item } from '~/modules/diet/item/schema/itemSchema'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'

export type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export type ObjectValues<T extends object> = T[keyof T]

/**
 * Returns the keys of an object with proper type inference.
 * Unlike `Object.keys()`, this function preserves the key types of the object.
 * @param obj - The object to get keys from
 * @returns An array of the object's keys with their proper types
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Type assertion is necessary to preserve key types
  return Object.keys(obj) as (keyof T)[]
}

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
