import { type Accessor, For, type Setter, Show } from 'solid-js'

import { useCases } from '~/di/useCases'
import {
  type ClipboardPayload,
  clipboardPayloadSchema,
} from '~/modules/clipboard/domain/clipboardEntry'
import { ClipboardPayloadExt } from '~/modules/clipboard/domain/clipboardPayloadExt'
import { ParentItemExt } from '~/modules/diet/item/domain/ext/parentItemExt'
import { validateItemHierarchy } from '~/modules/diet/item/domain/validateItemHierarchy'
import {
  asParentItem,
  createGroupItem,
  createItem,
  isGroupItem,
  isRecipeItem,
  type Item,
  type ParentItem,
} from '~/modules/diet/item/schema/itemSchema'
import { saveRecipe } from '~/modules/diet/recipe/application/usecases/recipeCrud'
import { createNewRecipe } from '~/modules/diet/recipe/domain/recipe'
import { showError } from '~/modules/toast/application/toastManager'
import { ClipboardActionButtons } from '~/sections/common/components/ClipboardActionButtons'
import { ConvertToRecipeIcon } from '~/sections/common/components/icons/ConvertToRecipeIcon'
import { ItemView } from '~/sections/item/components/ItemView'
import { generateId, regenerateId } from '~/shared/utils/idUtils'
import { logging } from '~/shared/utils/logging'

export type ItemChildrenEditorProps = {
  itemDraft: Accessor<ParentItem>
  setItemDraft: Setter<Item>
  onEditChild?: (child: Item) => void
  onAddNewItem?: () => void
  showAddButton?: boolean
}

export function ItemChildrenEditor(props: ItemChildrenEditorProps) {
  const children = () => {
    const item = props.itemDraft()
    return isGroupItem(item) || isRecipeItem(item)
      ? item.reference.children
      : []
  }

  const onPaste = (data: ClipboardPayload) => {
    const itemsToAdd = ClipboardPayloadExt.extractItems(data)

    const itemAsChildOfSingletonGroup = () =>
      createGroupItem({
        id: props.itemDraft().id,
        name: props.itemDraft().name,
        quantity: props.itemDraft().quantity,
        reference: {
          type: 'group',
          children: [
            createItem({
              id: generateId(),
              name: props.itemDraft().name,
              quantity: props.itemDraft().quantity,
              reference: props.itemDraft().reference,
            }),
          ],
        },
      })

    let groupItem =
      asParentItem(props.itemDraft()) ?? itemAsChildOfSingletonGroup()

    for (const newChild of itemsToAdd) {
      // Regenerate ID to avoid conflicts
      const childWithNewId = {
        ...newChild,
        id: regenerateId(newChild).id,
      }

      // Validate hierarchy to prevent circular references
      const tempItem = ParentItemExt.addChildToParentItem(
        groupItem,
        childWithNewId,
      )
      if (!validateItemHierarchy(tempItem)) {
        logging.warn(
          `Skipping item ${childWithNewId.name} - would create circular reference`,
        )
        continue
      }

      groupItem = tempItem
    }

    props.setItemDraft(groupItem)
  }

  const updateChildQuantity = (childId: number, newQuantity: number) => {
    logging.debug('[GroupChildrenEditor] updateChildQuantity', {
      childId,
      newQuantity,
    })

    const updatedItem = ParentItemExt.updateChildInParentItem(
      props.itemDraft(),
      childId,
      {
        quantity: newQuantity,
      },
    )

    props.setItemDraft(updatedItem)
  }

  const applyMultiplierToAll = (multiplier: number) => {
    logging.debug('[GroupChildrenEditor] applyMultiplierToAll', { multiplier })

    let updatedItem: Item = props.itemDraft()

    for (const child of children()) {
      const newQuantity = child.quantity * multiplier
      updatedItem = ParentItemExt.updateChildInParentItem(
        updatedItem,
        child.id,
        {
          quantity: newQuantity,
        },
      )
    }

    props.setItemDraft(updatedItem)
  }

  /**
   * Converts the current group to a recipe
   */
  const handleConvertToRecipe = async () => {
    const item = props.itemDraft()

    // Only groups can be converted to recipes
    if (!isGroupItem(item) || children().length === 0) {
      showError('Apenas grupos com itens podem ser convertidos em receitas')
      return
    }

    try {
      const authUseCases = useCases.authUseCases()
      const userId = authUseCases.currentUserIdOrGuestId()

      // Create new unified recipe directly from Item children
      const newUnifiedRecipe = createNewRecipe({
        name:
          item.name.length > 0
            ? `${item.name} (Receita)`
            : 'Nova receita (a partir de um grupo)',
        items: children(), // Use Items directly
        user_id: userId,
      })

      const insertedRecipe = await saveRecipe(newUnifiedRecipe)

      if (!insertedRecipe) {
        showError('Falha ao criar receita a partir do grupo')
        return
      }

      // Transform the group into a recipe item
      const recipeItem = createItem({
        id: item.id, // Keep the same ID
        name: insertedRecipe.name,
        quantity: item.quantity,
        reference: {
          type: 'recipe',
          id: insertedRecipe.id,
          children: children(), // Keep the children for display
        },
      })

      props.setItemDraft(recipeItem)
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
          canPaste={true}
          canClear={false} // We don't need clear functionality here
          onCopy={() => useCases.clipboardUseCases().copy(props.itemDraft())} // TODO: copy self vs children? (expandable?)
          // Issue URL: https://github.com/marcuscastelo/macroflows/issues/1358
          onPaste={() =>
            useCases
              .clipboardUseCases()
              .confirmPaste(clipboardPayloadSchema, onPaste)
          }
          onClear={() => {}} // Empty function since canClear is false
        />
      </div>

      <div
        class="mt-3 space-y-2"
        tabindex={0}
        onPaste={() =>
          useCases
            .clipboardUseCases()
            .confirmPaste(clipboardPayloadSchema, onPaste)
        }
      >
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
                useCases.clipboardUseCases().copy(childToCopy)
              }}
              onDeleteChild={(childToDelete) => {
                // Remove the child from the group
                const updatedItem = ParentItemExt.removeChildFromParentItem(
                  props.itemDraft(),
                  childToDelete.id,
                )
                props.setItemDraft(updatedItem)
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
                    type="button"
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
            type="button"
            class="btn btn-sm bg-green-600 hover:bg-green-700 text-white w-full flex items-center justify-center gap-2"
            onClick={() => props.onAddNewItem?.()}
            title="Adicionar novo item ao grupo"
          >
            ➕ Adicionar Item
          </button>
        </div>
      </Show>

      {/* Convert to Recipe button - only visible when there are children */}
      <Show when={children().length > 0 && !isRecipeItem(props.itemDraft())}>
        <div class="mt-4">
          <button
            type="button"
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
      <Show when={isRecipeItem(props.itemDraft())}>
        <div class="mt-4">
          <button
            type="button"
            class="btn btn-sm bg-red-600 hover:bg-red-700 text-white w-full flex items-center justify-center gap-2"
            onClick={() => {
              const updatedItem = createItem({
                id: props.itemDraft().id,
                name: props.itemDraft().name,
                quantity: props.itemDraft().quantity,
                reference: {
                  type: 'group',
                  children: children(),
                },
              })
              props.setItemDraft(updatedItem)
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
  child: Item
  onQuantityChange: (newQuantity: number) => void
  onEditChild?: (child: Item) => void
  onCopyChild?: (child: Item) => void
  onDeleteChild?: (child: Item) => void
}

function GroupChildEditor(props: GroupChildEditorProps) {
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
      useCases.clipboardUseCases().copy(props.child)
    }
  }

  const handleDeleteChild = () => {
    if (props.onDeleteChild) {
      props.onDeleteChild(props.child)
    }
  }

  return (
    <ItemView
      item={() => props.child}
      handlers={{
        onEdit: handleEditChild,
        onCopy: handleCopyChild,
        onDelete: handleDeleteChild,
      }}
    />
  )
}
