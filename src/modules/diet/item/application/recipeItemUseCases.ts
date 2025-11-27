import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import { type RecipeItem } from '~/modules/diet/item/schema/itemSchema'
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
}
