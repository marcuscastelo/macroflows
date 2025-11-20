import { MacroNutrientsExt } from '~/modules/diet/macro-nutrients/domain/macroExt'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { ItemExt } from '~/modules/diet/unified-item/domain/itemExt'

export const RecipeExt = {
  macros(recipe: Recipe) {
    return ItemExt.calcItemContainerMacros(recipe)
  },

  of(recipe: Recipe) {
    return {
      // Self reference
      value: recipe,
      // Props
      id: () => recipe.id,
      name: () => recipe.name,
      userId: () => recipe.user_id,
      items: () => recipe.items,
      // Derived props
      macros: () => MacroNutrientsExt.of(RecipeExt.macros(recipe)),
    } as const
  },
}
