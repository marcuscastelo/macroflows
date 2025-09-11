import { type Accessor, For, type Setter, Show } from 'solid-js'
import { z } from 'zod/v4'

import { saveRecipe } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { createNewRecipe } from '~/modules/diet/recipe/domain/recipe'
import {
  addChildToItem,
  removeChildFromItem,
  updateChildInItem,
} from '~/modules/diet/unified-item/domain/childOperations'
import { validateItemHierarchy } from '~/modules/diet/unified-item/domain/validateItemHierarchy'
import {
  createUnifiedItem,
  isFoodItem,
  isGroupItem,
  isRecipeItem,
  type UnifiedItem,
  unifiedItemSchema,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { showError } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { ClipboardActionButtons } from '~/sections/common/components/ClipboardActionButtons'
import { ConvertToRecipeIcon } from '~/sections/common/components/icons/ConvertToRecipeIcon'
import { useClipboard } from '~/sections/common/hooks/useClipboard'
import { useCopyPasteActions } from '~/sections/common/hooks/useCopyPasteActions'
import { UnifiedItemView } from '~/sections/unified-item/components/UnifiedItemView'
import { generateId, regenerateId } from '~/shared/utils/idUtils'
import { logging } from '~/shared/utils/logging'

export type GroupChildrenEditorProps = {
  item: Accessor<UnifiedItem>
  setItem: Setter<UnifiedItem>
  onEditChild?: (child: UnifiedItem) => void
  onAddNewItem?: () => void
  showAddButton?: boolean
}

export function GroupChildrenEditor(props: GroupChildrenEditorProps) {
  const clipboard = useClipboard()

  const children = () => {
    const item = props.item()
    return isGroupItem(item) || isRecipeItem(item)
      ? item.reference.children
      : []
  }

  // Clipboard schema accepts UnifiedItem or array of UnifiedItems
  const acceptedClipboardSchema = unifiedItemSchema.or(
    z.array(unifiedItemSchema),
  )

  // Clipboard actions for children
  const { handleCopy, handlePaste, hasValidPastableOnClipboard } =
    useCopyPasteActions({
      acceptedClipboardSchema,
      getDataToCopy: () => children(),
      onPaste: (data) => {
        const itemsToAdd = Array.isArray(data) ? data : [data]

        let updatedItem = props.item()

        // Check if we need to transform a food item into a group
        if (isFoodItem(updatedItem) && itemsToAdd.length > 0) {
          // Transform the food item into a group with the original food as the first child
          const originalAsChild = createUnifiedItem({
            id: generateId(), // New ID for the child
            name: updatedItem.name,
            quantity: updatedItem.quantity,
            reference: updatedItem.reference, // Keep the food reference
          })

          // Create new group with the original food as first child
          updatedItem = createUnifiedItem({
            id: updatedItem.id, // Keep the same ID for the parent
            name: updatedItem.name,
            quantity: updatedItem.quantity,
            reference: {
              type: 'group',
              children: [originalAsChild],
            },
          })
        }

        for (const newChild of itemsToAdd) {
          // Regenerate ID to avoid conflicts
          const childWithNewId = {
            ...newChild,
            id: regenerateId(newChild).id,
          }

          // Validate hierarchy to prevent circular references
          const tempItem = addChildToItem(updatedItem, childWithNewId)
          if (!validateItemHierarchy(tempItem)) {
            logging.warn(
              `Skipping item ${childWithNewId.name} - would create circular reference`,
            )
            continue
          }

          updatedItem = tempItem
        }

        props.setItem(updatedItem)
      },
    })

  const updateChildQuantity = (childId: number, newQuantity: number) => {
    logging.debug('[GroupChildrenEditor] updateChildQuantity', {
      childId,
      newQuantity,
    })

    const updatedItem = updateChildInItem(props.item(), childId, {
      quantity: newQuantity,
    })

    props.setItem(updatedItem)
  }

  const applyMultiplierToAll = (multiplier: number) => {
    logging.debug('[GroupChildrenEditor] applyMultiplierToAll', { multiplier })

    let updatedItem = props.item()

    for (const child of children()) {
      const newQuantity = child.quantity * multiplier
      updatedItem = updateChildInItem(updatedItem, child.id, {
        quantity: newQuantity,
      })
    }

    props.setItem(updatedItem)
  }

  /**
   * Converts the current group to a recipe
   */
  const handleConvertToRecipe = async () => {
    const item = props.item()

    // Only groups can be converted to recipes
    if (!isGroupItem(item) || children().length === 0) {
      showError('Apenas grupos com itens podem ser convertidos em receitas')
      return
    }

    try {
      // Create new unified recipe directly from UnifiedItem children
      const newUnifiedRecipe = createNewRecipe({
        name:
          item.name.length > 0
            ? `${item.name} (Receita)`
            : 'Nova receita (a partir de um grupo)',
        items: children(), // Use UnifiedItems directly
        owner: currentUserId(),
      })

      const insertedRecipe = await saveRecipe(newUnifiedRecipe)

      if (!insertedRecipe) {
        showError('Falha ao criar receita a partir do grupo')
        return
      }

      // Transform the group into a recipe item
      const recipeUnifiedItem = createUnifiedItem({
        id: item.id, // Keep the same ID
        name: insertedRecipe.name,
        quantity: item.quantity,
        reference: {
          type: 'recipe',
          id: insertedRecipe.id,
          children: children(), // Keep the children for display
        },
      })

      props.setItem(recipeUnifiedItem)
    } catch (err) {
      logging.error('GroupChildrenEditor handleConvertToRecipe error:', err)
      showError(err, undefined, 'Falha ao criar receita a partir do grupo')
    }
  }

  return (
    <>
      <div class="flex items-center justify-between mt-4">
        <p class="text-gray-400">
          Itens no Grupo ({children().length}{' '}
          {children().length === 1 ? 'item' : 'itens'})
        </p>

        {/* Clipboard Actions */}
        <ClipboardActionButtons
          canCopy={children().length > 0}
          canPaste={hasValidPastableOnClipboard()}
          canClear={false} // We don't need clear functionality here
          onCopy={handleCopy}
          onPaste={handlePaste}
          onClear={() => {}} // Empty function since canClear is false
        />
      </div>

      <div class="mt-3 space-y-2">
        <For each={children()}>
          {(child) => (
            <GroupChildEditor
              child={child}
              onQuantityChange={(newQuantity) =>
                updateChildQuantity(child.id, newQuantity)
              }
              onEditChild={props.onEditChild}
              onCopyChild={(childToCopy) => {
                // Copy the specific child item to clipboard
                clipboard.write(JSON.stringify(childToCopy))
              }}
              onDeleteChild={(childToDelete) => {
                // Remove the child from the group
                const updatedItem = removeChildFromItem(
                  props.item(),
                  childToDelete.id,
                )
                props.setItem(updatedItem)
              }}
            />
          )}
        </For>
      </div>

      <Show when={children().length === 0}>
        <div class="mt-3 p-4 rounded-lg border border-gray-700 bg-gray-700 text-center text-gray-500">
          Grupo vazio
        </div>
      </Show>

      <Show when={children().length > 1}>
        <div class="mt-4">
          <p class="text-gray-400 text-sm mb-2">Ações do Grupo</p>
          <div class="rounded-lg border border-gray-700 bg-gray-700 p-3">
            <div class="flex gap-1">
              <For each={[0.5, 1, 1.5, 2]}>
                {(multiplier) => (
                  <button
                    class="btn btn-sm btn-primary flex-1"
                    onClick={() => applyMultiplierToAll(multiplier)}
                  >
                    ×{multiplier}
                  </button>
                )}
              </For>
            </div>
            <p class="text-xs text-gray-400 mt-2 text-center">
              Aplicar a todos os itens
            </p>
          </div>
        </div>
      </Show>

      {/* Add new item button */}
      <Show when={props.showAddButton === true && props.onAddNewItem}>
        <div class="mt-4">
          <button
            class="btn btn-sm bg-green-600 hover:bg-green-700 text-white w-full flex items-center justify-center gap-2"
            onClick={() => props.onAddNewItem?.()}
            title="Adicionar novo item ao grupo"
          >
            ➕ Adicionar Item
          </button>
        </div>
      </Show>

      {/* Convert to Recipe button - only visible when there are multiple children */}
      <Show when={children().length > 1 && !isRecipeItem(props.item())}>
        <div class="mt-4">
          <button
            class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white w-full flex items-center justify-center gap-2"
            onClick={() => void handleConvertToRecipe()}
            title="Converter grupo em receita"
          >
            <ConvertToRecipeIcon />
            Converter em Receita
          </button>
        </div>
      </Show>

      {/* Unlink Recipe button - only visible when the item is a recipe */}
      <Show when={isRecipeItem(props.item())}>
        <div class="mt-4">
          <button
            class="btn btn-sm bg-red-600 hover:bg-red-700 text-white w-full flex items-center justify-center gap-2"
            onClick={() => {
              const updatedItem = createUnifiedItem({
                id: props.item().id,
                name: props.item().name,
                quantity: props.item().quantity,
                reference: {
                  type: 'group',
                  children: children(),
                },
              })
              props.setItem(updatedItem)
            }}
            title="Desvincular receita do grupo"
          >
            ❌ Desvincular Receita
          </button>
        </div>
      </Show>
    </>
  )
}

type GroupChildEditorProps = {
  child: UnifiedItem
  onQuantityChange: (newQuantity: number) => void
  onEditChild?: (child: UnifiedItem) => void
  onCopyChild?: (child: UnifiedItem) => void
  onDeleteChild?: (child: UnifiedItem) => void
}

function GroupChildEditor(props: GroupChildEditorProps) {
  const clipboard = useClipboard()

  const handleEditChild = () => {
    if (props.onEditChild) {
      props.onEditChild(props.child)
    }
  }

  const handleCopyChild = () => {
    if (props.onCopyChild) {
      props.onCopyChild(props.child)
    } else {
      // Fallback: copy to clipboard directly
      clipboard.write(JSON.stringify(props.child))
    }
  }

  const handleDeleteChild = () => {
    if (props.onDeleteChild) {
      props.onDeleteChild(props.child)
    }
  }

  return (
    <UnifiedItemView
      item={() => props.child}
      handlers={{
        onEdit: handleEditChild,
        onCopy: handleCopyChild,
        onDelete: handleDeleteChild,
      }}
    />
  )
}
