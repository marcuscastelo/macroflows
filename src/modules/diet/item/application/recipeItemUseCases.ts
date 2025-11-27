import { type Accessor, createResource, type Resource } from 'solid-js'

import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import {
  isRecipeItem,
  type Item,
  type RecipeItem,
} from '~/modules/diet/item/schema/itemSchema'
import { fetchRecipeById } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { showError } from '~/modules/toast/application/toastManager'
import { logging } from '~/shared/utils/logging'

export const recipeItemUseCases = {
  withEditedQuantity: (item: RecipeItem, newQuantity: number): RecipeItem => {
    try {
      return RecipeItemExt.of(item).scaleQuantityAndChildren(newQuantity)
    } catch (error) {
      showError(
        'Não foi possível ajustar a quantidade da receita. Verifique se todos os itens possuem quantidade válida.',
      )
      logging.error(
        '[recipeItemUseCases] Error scaling recipe item quantity:',
        {
          error,
        },
      )
      return { ...item }
    }
  },

  createRecipeResource: (item: Accessor<Item>) => {
    const item_ = item()
    const resource = createResource(
      () => (isRecipeItem(item_) ? item_.reference.id : null),
      async (recipeId: number) => {
        try {
          return await fetchRecipeById(recipeId)
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

    return !ItemExt.of(item).isInSyncWithRecipe(recipe.items)
  },
}
