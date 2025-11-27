import {
  type Accessor,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  mergeProps,
  Show,
  untrack,
} from 'solid-js'

import { clipboardUseCases } from '~/modules/clipboard/application/usecases/clipboardUseCases'
import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { ParentItemExt } from '~/modules/diet/item/domain/ext/parentItemExt'
import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import { canApplyItem } from '~/modules/diet/item/domain/itemValidation'
import {
  asGroupItem,
  asParentItem,
  createGroupItem,
  createItem,
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type Item,
  itemSchema,
} from '~/modules/diet/item/schema/itemSchema'
import {
  deleteRecipe,
  fetchRecipeById,
  updateRecipe,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import { DownloadIcon } from '~/sections/common/components/icons/DownloadIcon'
import { useFloatField } from '~/sections/common/hooks/useField'
import { ItemEditBody } from '~/sections/item/components/ItemView/ItemEdit/ItemEditBody'
import { UnsupportedItemMessage } from '~/sections/item/components/ItemView/ItemEdit/UnsupportedItemMessage'
import {
  openItemEditModal,
  openRecipeEditModal,
  openTemplateSearchModal,
} from '~/shared/modal/helpers/specializedModalHelpers'
import { generateId } from '~/shared/utils/idUtils'
import { logging } from '~/shared/utils/logging'

export type ItemEditModalProps = {
  targetMealName: string
  targetNameColor?: string
  item: Accessor<Item>
  macroOverflow: () => {
    enable: boolean
    originalItem?: Item | undefined
  }
  onApply: (item: Item) => void
  onCancel?: () => void
  onAddNewItem?: () => void
  showAddItemButton?: boolean
  onClose?: () => void
}

export const ItemEditModal = (_props: ItemEditModalProps) => {
  logging.debug('[ItemEditModal] called', _props)
  const props = mergeProps({ targetNameColor: 'text-green-500' }, _props)

  const handleClose = () => props.onClose?.()

  const [itemDraft, setItemDraft] = createSignal(untrack(() => props.item()))
  createEffect(() => setItemDraft(props.item()))

  const parentifiedItemDraft = createMemo(
    () =>
      asParentItem(itemDraft()) ??
      createGroupItem({
        id: itemDraft().id,
        name: itemDraft().name,
        quantity: itemDraft().quantity,
        reference: {
          type: 'group',
          children: [
            createItem({
              id: generateId(), // New ID for the child
              name: itemDraft().name,
              quantity: itemDraft().quantity,
              reference: itemDraft().reference,
            }),
          ],
        },
      }),
  )

  const [viewMode, setViewMode] = createSignal<'normal' | 'group'>('normal')

  createEffect(() => {
    if (viewMode() === 'group') {
      const currentItem = untrack(itemDraft)
      if (isFoodItem(currentItem)) {
        setItemDraft(parentifiedItemDraft())
      }
    } else if (viewMode() === 'normal') {
      const currentItem = untrack(itemDraft)
      if (!isGroupItem(currentItem)) {
        return
      }
      const firstChild = currentItem.reference.children[0]
      if (firstChild === undefined) {
        return
      }

      if (
        isGroupItem(currentItem) &&
        currentItem.reference.children.length === 1
      ) {
        setItemDraft(createItem({ ...firstChild }))
      }
    }
  })

  // Recipe synchronization
  const [originalRecipe] = createResource(
    () => {
      const currentItem = itemDraft()
      return isRecipeItem(currentItem) ? currentItem.reference.id : null
    },
    async (recipeId: number) => {
      return await fetchRecipeById(recipeId)
    },
  )

  // Check if the recipe was manually edited
  const isManuallyEdited = createMemo(() => {
    const currentItem = itemDraft()
    const recipe = originalRecipe()

    if (recipe === null || recipe === undefined || originalRecipe.loading) {
      return false
    }

    // Compare original recipe items with current recipe items
    // If they're different, the recipe was manually edited
    return !ItemExt.of(currentItem).isInSyncWithRecipe(recipe.items)
  })

  const quantitySignal = () =>
    itemDraft().quantity === 0 ? undefined : itemDraft().quantity

  const quantityField = useFloatField(quantitySignal, {
    decimalPlaces: 0,
    // eslint-disable-next-line solid/reactivity
    defaultValue: itemDraft().quantity,
    minValue: 0.01,
  })

  const canApply = () => {
    const item = itemDraft()
    logging.debug('[ItemEditModal] canApply', {
      quantity: item.quantity,
      name: item.name,
    })
    return canApplyItem(item)
  }

  const handleEditChild = (child: Item) => {
    openItemEditModal({
      targetMealName: `${props.targetMealName} > ${itemDraft().name}`,
      targetNameColor: 'text-orange-400',
      item: () => child,
      macroOverflow: () => ({ enable: false }),
      onApply: (updatedChild) => {
        const currentItem = parentifiedItemDraft()
        const updatedItem = ParentItemExt.updateChildInParentItem(
          currentItem,
          updatedChild.id,
          updatedChild,
        )
        setItemDraft(updatedItem)
      },
      title: 'Editar item filho',
      targetName: child.name,
    })
  }

  const handleSyncWithOriginalRecipe = () => {
    const recipe = originalRecipe()
    if (!recipe) return

    const currentItem = itemDraft()
    if (!isRecipeItem(currentItem)) {
      throw new Error('Can only synchronize recipe items')
    }

    // Synchronize with original recipe items
    const syncedItem = RecipeItemExt.syncWithOriginal(currentItem, recipe.items)

    // Force reactivity by creating a new reference
    setItemDraft({ ...syncedItem })
  }

  // Recipe edit handlers
  const handleSaveRecipe = async (updatedRecipe: Recipe) => {
    const result = await updateRecipe(updatedRecipe.id, updatedRecipe)
    if (result) {
      // Update the current item to reflect the changes
      const currentItem = itemDraft()
      if (isRecipeItem(currentItem)) {
        // Automatically synchronize with the updated recipe
        const syncedItem = RecipeItemExt.syncWithOriginal(
          currentItem,
          updatedRecipe.items,
        )

        // Force reactivity by creating a new reference
        setItemDraft({ ...syncedItem })
      }
    }
  }

  const handleDeleteRecipe = async (recipeId: Recipe['id']) => {
    await deleteRecipe(recipeId)
    // The parent component should handle removing this item
  }

  return (
    <div class="flex flex-col h-full">
      <div
        class="flex-1 p-4"
        tabindex={0}
        onPaste={() => clipboardUseCases.confirmPaste(itemSchema, setItemDraft)}
      >
        <Show
          when={
            isFoodItem(itemDraft()) ||
            isRecipeItem(itemDraft()) ||
            isGroupItem(itemDraft())
          }
        >
          {/* Toggle button for recipes */}
          <Show
            when={
              isRecipeItem(itemDraft()) ||
              isFoodItem(itemDraft()) ||
              asGroupItem(itemDraft())?.reference.children.length === 1
            }
          >
            <div class="mb-4 flex justify-center items-center gap-3 ">
              <div class="flex rounded-lg border border-gray-600 w-full bg-gray-800 p-1">
                <button
                  class={`px-3 py-1 rounded-md text-sm transition-colors flex-1 ${
                    viewMode() === 'normal'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setViewMode('normal')}
                >
                  <Show when={isRecipeItem(itemDraft())}>📖 Receita</Show>
                  <Show when={!isRecipeItem(itemDraft())}>🍽️ Alimento</Show>
                </button>
                <button
                  class={`px-3 py-1 rounded-md text-sm transition-colors flex-1 ${
                    viewMode() === 'group'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setViewMode('group')}
                >
                  📦 Tratar como Grupo
                </button>
              </div>

              {/* Sync button - only show if recipe was manually edited */}
              <Show when={isManuallyEdited() && originalRecipe()}>
                <div
                  class="btn btn-sm btn-ghost text-white rounded-md flex items-center gap-1"
                  onClick={handleSyncWithOriginalRecipe}
                  title="Sincronizar com receita original"
                >
                  <DownloadIcon />
                </div>
              </Show>

              {/* Edit recipe button - only show for recipe items */}
              <Show when={isRecipeItem(itemDraft()) && originalRecipe()}>
                {(originalRecipe) => (
                  <button
                    class="btn btn-sm btn-ghost text-white rounded-md flex items-center gap-1"
                    onClick={() => {
                      openRecipeEditModal({
                        recipe: () => originalRecipe(),
                        onSaveRecipe: (updatedRecipe) => {
                          void handleSaveRecipe(updatedRecipe)
                        },
                        onRefetch: () => {},
                        onDelete: (recipeId) => {
                          void handleDeleteRecipe(recipeId)
                        },
                      })
                    }}
                    title="Editar receita original"
                  >
                    ✏️
                  </button>
                )}
              </Show>
            </div>
          </Show>

          <ItemEditBody
            canApply={canApply()}
            itemDraft={itemDraft}
            parentifiedItemDraft={parentifiedItemDraft}
            setItemDraft={setItemDraft}
            macroOverflow={props.macroOverflow}
            quantityField={quantityField}
            onEditChild={handleEditChild}
            viewMode={viewMode()}
            clipboardActions={{
              onCopy: () => clipboardUseCases.copy(itemDraft()),
              onPaste: () =>
                clipboardUseCases.confirmPaste(itemSchema, setItemDraft),
            }}
            onAddNewItem={() => {
              openTemplateSearchModal({
                targetName: itemDraft().name,
                title: `Adicionar novo subitem ao item "${itemDraft().name}"`,
                onNewItem: (newItem) => {
                  const item_ = itemDraft()
                  if (isGroupItem(item_)) {
                    const updatedItem = ParentItemExt.addChildToParentItem(
                      item_,
                      {
                        ...newItem,
                        id: generateId(),
                      },
                    )
                    setItemDraft(updatedItem)
                  } else {
                    const currentItem = itemDraft()
                    const groupItem = createItem({
                      id: currentItem.id,
                      name: currentItem.name,
                      quantity: currentItem.quantity,
                      reference: {
                        type: 'group',
                        children: [
                          createItem({
                            ...currentItem,
                            id: generateId(),
                          }),
                          {
                            ...newItem,
                            id: generateId(),
                          },
                        ],
                      },
                    })
                    setItemDraft(groupItem)
                  }
                },
              })
            }}
            showAddItemButton={props.showAddItemButton}
          />
        </Show>
        <Show
          when={
            !isFoodItem(itemDraft()) &&
            !isRecipeItem(itemDraft()) &&
            !isGroupItem(itemDraft())
          }
        >
          <UnsupportedItemMessage />
        </Show>
      </div>

      <div class="p-4 border-t border-gray-600 flex justify-end gap-2">
        <button
          class="btn cursor-pointer uppercase"
          onClick={(e) => {
            logging.debug('[ItemEditModal] Cancel clicked')
            e.preventDefault()
            e.stopPropagation()
            handleClose()
            props.onCancel?.()
          }}
        >
          Cancelar
        </button>
        <button
          class="btn cursor-pointer uppercase"
          disabled={
            !canApply() ||
            (!isFoodItem(itemDraft()) &&
              !isRecipeItem(itemDraft()) &&
              !isGroupItem(itemDraft()))
          }
          onClick={(e) => {
            e.preventDefault()
            props.onApply(itemDraft())
          }}
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}
