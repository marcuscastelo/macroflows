import { Show } from 'solid-js'

import {
  getSingleItemConversionDescription,
  isSingleItemRecipe,
} from '~/modules/diet/recipe/domain/recipeOperations'
import { useRecipeEditContext } from '~/sections/recipe/context/RecipeEditContext'

/**
 * Shows a conversion indicator for single-item recipes.
 * Example: "1g Macarrão cozido = 2,22g Macarrão cru"
 */
export function SingleItemConversionIndicator() {
  const { recipe } = useRecipeEditContext()

  const conversionDescription = () =>
    getSingleItemConversionDescription(recipe())
  const isSingle = () => isSingleItemRecipe(recipe())

  return (
    <Show when={isSingle()}>
      <div class="mt-2 p-3 bg-info/10 border border-info/30 rounded-lg">
        <div class="flex items-center gap-2">
          <span class="text-info text-lg">⚖️</span>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-info">
              Receita de conversão
            </span>
            <span class="text-xs text-base-content/70">
              {conversionDescription()}
            </span>
          </div>
        </div>
      </div>
    </Show>
  )
}
