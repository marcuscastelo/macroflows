import { type Accessor, createResource, type Resource } from 'solid-js'

import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import {
  isRecipeItem,
  type Item,
  type RecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
import { type RecipeCrud } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import type { Recipe } from '~/modules/diet/recipe/domain/recipe'
import { showError } from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

/**
 * Factory that creates recipe item use-cases with injected dependencies.
 *
 * This keeps the use-cases testable and avoids importing infra directly.
 *
 * @param deps.fetchRecipeById - function to fetch a recipe by id
 */
export function createRecipeItemUseCases(deps: {
  fetchRecipeById: RecipeCrud['fetchRecipeById']
}) {
  return {
    withEditedQuantity: (
      item: RecipeItem,
      recipe: Recipe,
      newQuantity: number,
    ): RecipeItem => {
      try {
        return RecipeItemExt.of(item).scaleQuantityAndChildren(
          newQuantity,
          recipe,
        )
      } catch (error) {
        logging.error(
          '[recipeItemUseCases] Error scaling recipe item quantity:',
          error,
          {
            component: 'recipeItemUseCases',
            itemId: item.id,
            recipeId: recipe.id,
          },
        )
        showError(
          'Não foi possível ajustar a quantidade da receita. Verifique se todos os itens possuem quantidade válida.',
        )
        return { ...item }
      }
    },

    createRecipeResource: (item: Accessor<Item>) => {
      const resource = createResource(
        () => ItemExt.of(item()).asRecipeItem()?.value.reference.id ?? null,
        async (recipeId: number) => {
          try {
            return await deps.fetchRecipeById(recipeId)
          } catch (error) {
            logging.warn('Failed to fetch recipe for recipe item use case:', {
              error,
            })
            return null
          }
        },
      )

      const [value, obj] = resource
      return {
        value,
        ...obj,
      }
    },

    isManuallyEdited: (
      item: Item,
      recipeResource: Resource<Recipe | null>,
    ): boolean => {
      if (recipeResource.loading) {
        return false
      }

      const recipe = recipeResource()
      if (recipe === undefined || recipe === null) {
        return false
      }

      if (!isRecipeItem(item)) {
        return false
      }

      return !RecipeItemExt.of(item).isInSyncWithRecipe(recipe)
    },
  }
}

export type RecipeItemUseCases = ReturnType<typeof createRecipeItemUseCases>
