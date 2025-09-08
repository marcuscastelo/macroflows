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

import {
  deleteRecipe,
  fetchRecipeById,
  updateRecipe,
} from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { type Recipe } from '~/modules/diet/recipe/domain/recipe'
import {
  addChildToItem,
  updateChildInItem,
} from '~/modules/diet/unified-item/domain/childOperations'
import {
  compareUnifiedItemArrays,
  synchronizeRecipeItemWithOriginal,
} from '~/modules/diet/unified-item/domain/unifiedItemOperations'
import {
  asGroupItem,
  createUnifiedItem,
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type UnifiedItem,
  unifiedItemSchema,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { DownloadIcon } from '~/sections/common/components/icons/DownloadIcon'
import { useCopyPasteActions } from '~/sections/common/hooks/useCopyPasteActions'
import { useFloatField } from '~/sections/common/hooks/useField'
import { UnifiedItemEditBody } from '~/sections/unified-item/components/UnifiedItemEditBody'
import { UnsupportedItemMessage } from '~/sections/unified-item/components/UnsupportedItemMessage'
import {
  openRecipeEditModal,
  openTemplateSearchModal,
  openUnifiedItemEditModal,
} from '~/shared/modal/helpers/specializedModalHelpers'
import { generateId } from '~/shared/utils/idUtils'
import { logging } from '~/shared/utils/logging'

export type UnifiedItemEditModalProps = {
  targetMealName: string
  targetNameColor?: string
  item: Accessor<UnifiedItem>
  macroOverflow: () => {
    enable: boolean
    originalItem?: UnifiedItem | undefined
  }
  onApply: (item: UnifiedItem) => void
  onCancel?: () => void
  onAddNewItem?: () => void
  showAddItemButton?: boolean
  onClose?: () => void
}

export const UnifiedItemEditModal = (_props: UnifiedItemEditModalProps) => {
  logging.debug('[UnifiedItemEditModal] called', _props)
  const props = mergeProps({ targetNameColor: 'text-green-500' }, _props)

  const handleClose = () => {
    props.onClose?.()
  }

  const [item, setItem] = createSignal(untrack(() => props.item()))
  createEffect(() => setItem(props.item()))

  const [viewMode, setViewMode] = createSignal<'normal' | 'group'>('normal')

  createEffect(() => {
    if (viewMode() === 'group') {
      const currentItem = untrack(item)
      if (isFoodItem(currentItem)) {
        // Create a copy of the original item with a new ID for the child
        const originalAsChild = createUnifiedItem({
          id: generateId(), // New ID for the child
          name: currentItem.name,
          quantity: currentItem.quantity,
          reference: currentItem.reference, // Keep the food reference
        })

        const groupItem = createUnifiedItem({
          id: currentItem.id, // Keep the same ID for the parent
          name: currentItem.name,
          quantity: currentItem.quantity,
          reference: {
            type: 'group',
            children: [originalAsChild],
          },
        })
        setItem(groupItem)
      }
    } else if (viewMode() === 'normal') {
      const currentItem = untrack(item)
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
        setItem(createUnifiedItem({ ...firstChild }))
      }
    }
  })

  // Recipe synchronization
  const [originalRecipe] = createResource(
    () => {
      const currentItem = item()
      return isRecipeItem(currentItem) ? currentItem.reference.id : null
    },
    async (recipeId: number) => {
      return await fetchRecipeById(recipeId)
    },
  )

  // Check if the recipe was manually edited
  const isManuallyEdited = createMemo(() => {
    const currentItem = item()
    const recipe = originalRecipe()

    if (
      !isRecipeItem(currentItem) ||
      recipe === null ||
      recipe === undefined ||
      originalRecipe.loading
    ) {
      return false
    }

    // Compare original recipe items with current recipe items
    // If they're different, the recipe was manually edited
    return !compareUnifiedItemArrays(
      recipe.items,
      currentItem.reference.children,
    )
  })

  const quantitySignal = () =>
    item().quantity === 0 ? undefined : item().quantity

  const quantityField = useFloatField(quantitySignal, {
    decimalPlaces: 0,
    // eslint-disable-next-line solid/reactivity
    defaultValue: item().quantity,
    minValue: 0.01,
  })

  const canApply = () => {
    logging.debug('[UnifiedItemEditModal] canApply', item().quantity)
    return item().quantity > 0
  }

  const handleEditChild = (child: UnifiedItem) => {
    openUnifiedItemEditModal({
      targetMealName: `${props.targetMealName} > ${item().name}`,
      targetNameColor: 'text-orange-400',
      item: () => child,
      macroOverflow: () => ({ enable: false }),
      onApply: (updatedChild) => {
        const currentItem = item()
        const updatedItem = updateChildInItem(
          currentItem,
          updatedChild.id,
          updatedChild,
        )
        setItem(updatedItem)
      },
      title: 'Editar item filho',
      targetName: child.name,
    })
  }

  const handleSyncWithOriginalRecipe = () => {
    const recipe = originalRecipe()
    if (!recipe) return

    const currentItem = item()
    if (currentItem.reference.type !== 'recipe') {
      throw new Error('Can only synchronize recipe items')
    }

    // Synchronize with original recipe items
    const syncedItem = synchronizeRecipeItemWithOriginal(
      currentItem,
      recipe.items,
    )

    // Force reactivity by creating a new reference
    setItem({ ...syncedItem })
  }

  // Recipe edit handlers
  const handleSaveRecipe = async (updatedRecipe: Recipe) => {
    const result = await updateRecipe(updatedRecipe.id, updatedRecipe)
    if (result) {
      // Update the current item to reflect the changes
      const currentItem = item()
      if (isRecipeItem(currentItem)) {
        // Automatically synchronize with the updated recipe
        const syncedItem = synchronizeRecipeItemWithOriginal(
          currentItem,
          updatedRecipe.items,
        )

        // Force reactivity by creating a new reference
        setItem({ ...syncedItem })
      }
    }
  }

  const handleDeleteRecipe = async (recipeId: Recipe['id']) => {
    await deleteRecipe(recipeId)
    // The parent component should handle removing this item
  }

  // Clipboard functionality
  const { handleCopy, handlePaste, hasValidPastableOnClipboard } =
    useCopyPasteActions({
      acceptedClipboardSchema: unifiedItemSchema,
      getDataToCopy: () => item(),
      onPaste: (data) => {
        setItem(data)
      },
    })

  return (
    <div class="flex flex-col h-full">
      <div class="flex-1 p-4">
        <Show
          when={
            isFoodItem(item()) || isRecipeItem(item()) || isGroupItem(item())
          }
        >
          {/* Toggle button for recipes */}
          <Show
            when={
              isRecipeItem(item()) ||
              isFoodItem(item()) ||
              asGroupItem(item())?.reference.children.length === 1
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
                  <Show when={isRecipeItem(item())}>📖 Receita</Show>
                  <Show when={!isRecipeItem(item())}>🍽️ Alimento</Show>
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
              <Show when={isRecipeItem(item()) && originalRecipe()}>
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

          <UnifiedItemEditBody
            canApply={canApply()}
            item={item}
            setItem={setItem}
            macroOverflow={props.macroOverflow}
            quantityField={quantityField}
            onEditChild={handleEditChild}
            viewMode={viewMode()}
            clipboardActions={{
              onCopy: handleCopy,
              onPaste: handlePaste,
              hasValidPastableOnClipboard: hasValidPastableOnClipboard(),
            }}
            onAddNewItem={() => {
              openTemplateSearchModal({
                targetName: item().name,
                title: `Adicionar novo subitem ao item "${item().name}"`,
                onNewUnifiedItem: (newUnifiedItem) => {
                  if (isGroupItem(item())) {
                    const updatedItem = addChildToItem(item(), {
                      ...newUnifiedItem,
                      id: generateId(),
                    })
                    setItem(updatedItem)
                  } else {
                    const currentItem = item()
                    const groupItem = createUnifiedItem({
                      id: currentItem.id,
                      name: currentItem.name,
                      quantity: currentItem.quantity,
                      reference: {
                        type: 'group',
                        children: [
                          createUnifiedItem({
                            ...currentItem,
                            id: generateId(),
                          }),
                          {
                            ...newUnifiedItem,
                            id: generateId(),
                          },
                        ],
                      },
                    })
                    setItem(groupItem)
                  }
                },
              })
            }}
            showAddItemButton={props.showAddItemButton}
          />
        </Show>
        <Show
          when={
            !isFoodItem(item()) && !isRecipeItem(item()) && !isGroupItem(item())
          }
        >
          <UnsupportedItemMessage />
        </Show>
      </div>

      <div class="p-4 border-t border-gray-600 flex justify-end gap-2">
        <button
          class="btn cursor-pointer uppercase"
          onClick={(e) => {
            logging.debug('[UnifiedItemEditModal] Cancel clicked')
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
            (!isFoodItem(item()) &&
              !isRecipeItem(item()) &&
              !isGroupItem(item()))
          }
          onClick={(e) => {
            e.preventDefault()
            props.onApply(item())
          }}
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}
