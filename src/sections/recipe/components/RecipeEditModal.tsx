import { type Accessor, createEffect, createSignal } from 'solid-js'
import { untrack } from 'solid-js'

import {
  createItem,
  isRecipeItem,
  type Item,
} from '~/modules/diet/item/schema/itemSchema'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import {
  addItemToRecipe,
  updateItemInRecipe,
} from '~/modules/diet/recipe/domain/recipeOperations'
import { openTemplateSearchModal } from '~/modules/search/ui/openTemplateSearchModal'
import { showError } from '~/modules/toast/application/toastManager'
import { Button } from '~/sections/common/components/buttons/Button'
import { openItemEditModal } from '~/sections/item/ui/openItemEditModal'
import {
  RecipeEditContent,
  RecipeEditHeader,
} from '~/sections/recipe/components/RecipeEditView'
import { RecipeEditContextProvider } from '~/sections/recipe/context/RecipeEditContext'
import { openDeleteConfirmModal } from '~/shared/modal/ui/DeleteConfirmModal'
import { logging } from '~/shared/utils/logging'

export type RecipeEditModalProps = {
  recipe: Accessor<Recipe>
  onSaveRecipe: (recipe: Recipe) => void
  onRefetch: () => void
  onCancel?: () => void
  onDelete: (recipeId: Recipe['id']) => void
  onClose?: () => void
}

export function RecipeEditModal(props: RecipeEditModalProps) {
  const [recipe, setRecipe] = createSignal(untrack(() => props.recipe()))

  createEffect(() => {
    setRecipe(props.recipe())
  })

  const handleNewItem = (newItem: Item) => {
    logging.debug('onNewItem', newItem)

    // Convert Item to Item for adding to recipe
    try {
      // Only food items can be directly converted to Items for recipes
      if (newItem.reference.type !== 'food') {
        logging.error(
          'RecipeEditModal handleNewItem error:',
          new Error('Cannot add non-food items to recipes'),
        )
        showError(
          'Não é possível adicionar itens que não sejam alimentos a receitas.',
        )
        return
      }

      const item = newItem
      const updatedRecipe = addItemToRecipe(recipe(), item)

      logging.debug('handleNewItem: applying', { updatedRecipe })

      setRecipe(updatedRecipe)
    } catch (error) {
      logging.error('RecipeEditModal convert Item to Item error:', error)
      showError('Erro ao adicionar item à receita.')
    }
  }

  return (
    <RecipeEditContextProvider
      recipe={recipe}
      setRecipe={setRecipe}
      onSaveRecipe={props.onSaveRecipe}
    >
      <div class="space-y-4">
        <RecipeEditHeader
          onUpdateRecipe={(newRecipe) => {
            logging.debug('[RecipeEditModal] onUpdateRecipe: ', newRecipe)
            setRecipe(newRecipe)
          }}
        />

        <RecipeEditContent
          onNewItem={() => {
            openTemplateSearchModal({
              targetName: recipe().name,
              onNewItem: handleNewItem,
              onFinish: () => {
                props.onRefetch()
              },
              onClose: () => {
                props.onRefetch()
              },
            })
          }}
          onEditItem={(item) => {
            // TODO: Allow user to edit recipes inside recipes
            if (isRecipeItem(item)) {
              showError(
                'Ainda não é possível editar receitas dentro de receitas! Funcionalidade em desenvolvimento',
              )
              return
            }

            // Use unified modal system instead of legacy pattern
            openItemEditModal({
              item: () => createItem(item),
              targetMealName: recipe().name,
              macroOverflow: () => ({ enable: false }),
              onApply: (item) => {
                const updatedRecipe = updateItemInRecipe(
                  recipe(),
                  item.id,
                  item,
                )
                setRecipe(updatedRecipe)
              },
              title: 'Editar item',
              targetName: item.name,
            })
          }}
        />

        <Actions
          onApply={() => {
            props.onSaveRecipe(recipe())
          }}
          onCancel={props.onCancel}
          onDelete={() => {
            props.onDelete(recipe().id)
          }}
          onClose={props.onClose}
        />
      </div>
    </RecipeEditContextProvider>
  )
}

function Actions(props: {
  onApply: () => void
  onDelete: () => void
  onCancel?: () => void
  onClose?: () => void
}) {
  const handleDelete = () => {
    openDeleteConfirmModal({
      itemName: 'receita',
      itemType: 'receita',
      onConfirm: () => {
        props.onDelete()
        props.onClose?.()
      },
    })
  }

  return (
    <div class="flex flex-row gap-2">
      <Button
        class="btn-error mr-auto"
        onClick={(e) => {
          e.preventDefault()
          handleDelete()
        }}
      >
        Excluir
      </Button>
      <Button
        onClick={(e) => {
          e.preventDefault()
          props.onClose?.()
          props.onCancel?.()
        }}
      >
        Cancelar
      </Button>
      <Button
        onClick={(e) => {
          e.preventDefault()
          props.onApply()
          props.onClose?.()
        }}
      >
        Aplicar
      </Button>
    </div>
  )
}
