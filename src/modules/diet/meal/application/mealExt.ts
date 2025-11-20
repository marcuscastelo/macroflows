import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/application/macroExt'
import { type Meal } from '~/modules/diet/meal/domain/meal'
import { ItemExt } from '~/modules/diet/unified-item/application/itemExt'

export const MealExt = {
  macros(meal: Meal) {
    return ItemExt.calcItemContainerMacros(meal)
  },

  of(meal: Meal) {
    return {
      // Self reference
      meal: () => meal,
      // Props
      items: () => meal.items,
      // Derived props
      macros: () => MacroNutrientsExt.of(MealExt.macros(meal)),
    } as const
  },
}
