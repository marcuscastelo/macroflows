import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type Meal } from '~/modules/diet/meal/domain/meal'

export const MealExt = {
  macros(meal: Meal) {
    return ItemExt.calcItemContainerMacros(meal)
  },

  of(meal: Meal) {
    return {
      // Self reference
      value: meal,
      // Props
      items: () => meal.items,
      // Derived props
      macros: () => MacroNutrientsExt.of(MealExt.macros(meal)),
    } as const
  },
}
