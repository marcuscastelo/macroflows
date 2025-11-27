/**
 * Recipe edit modal helper.
 * Opens the RecipeEditModal using the modal system.
 */

import {
  RecipeEditModal,
  type RecipeEditModalProps,
} from '~/sections/recipe/components/RecipeEditModal'
import { closeModal, openEditModal } from '~/shared/modal/helpers/modalHelpers'
import type { ModalController } from '~/shared/modal/types/modalTypes'

/**
 * Configuration for recipe edit modals.
 */
export type RecipeEditModalConfig = RecipeEditModalProps & {
  title?: string
}

/**
 * Opens a recipe edit modal.
 */
export function openRecipeEditModal(
  config: RecipeEditModalConfig,
): ModalController {
  const title = config.title ?? `Editar receita - ${config.recipe().name}`

  let controller: ModalController

  const modalId = openEditModal(
    () => (
      <RecipeEditModal
        recipe={config.recipe}
        onSaveRecipe={(recipe) => {
          config.onSaveRecipe(recipe)
          controller.close()
        }}
        onRefetch={config.onRefetch}
        onCancel={() => {
          config.onCancel?.()
          controller.close()
        }}
        onDelete={(recipeId) => {
          config.onDelete(recipeId)
          controller.close()
        }}
        onClose={() => {
          config.onClose?.()
          controller.close()
        }}
      />
    ),
    {
      title,
      onClose: () => {
        config.onClose?.()
      },
    },
  )

  controller = {
    modalId,
    close: () => closeModal(modalId),
  }

  return controller
}
