/**
 * Recipe edit modal helper.
 * Opens the RecipeEditModal using the modal system.
 */

import {
  RecipeEditModal,
  type RecipeEditModalProps,
} from '~/sections/recipe/components/RecipeEditModal'
import { closeModal, openEditModal } from '~/shared/modal/helpers/modalHelpers'

/**
 * Configuration for recipe edit modals.
 */
export type RecipeEditModalConfig = RecipeEditModalProps & {
  title?: string
}

/**
 * Opens a recipe edit modal.
 */
export function openRecipeEditModal(config: RecipeEditModalConfig) {
  const title = config.title ?? `Editar receita - ${config.recipe().name}`

  const modalId = openEditModal(
    () => (
      <RecipeEditModal
        recipe={config.recipe}
        onSaveRecipe={(recipe) => {
          config.onSaveRecipe(recipe)
          closeModal(modalId)
        }}
        onRefetch={config.onRefetch}
        onCancel={() => {
          config.onCancel?.()
          closeModal(modalId)
        }}
        onDelete={(recipeId) => {
          config.onDelete(recipeId)
          closeModal(modalId)
        }}
        onClose={() => {
          config.onClose?.()
          closeModal(modalId)
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

  return modalId
}
