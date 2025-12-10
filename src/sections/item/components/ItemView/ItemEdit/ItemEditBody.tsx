import { type Accessor, createMemo, type Setter, Show } from 'solid-js'

import { useCases } from '~/di/useCases'
import {
  isItemNameValid,
  MAX_ITEM_NAME_LENGTH,
  truncateItemName,
} from '~/modules/diet/item/domain/itemValidation'
import {
  asFoodItem,
  isGroupItem,
  isParentItem,
  type Item,
  type ParentItem,
} from '~/modules/diet/item/schema/itemSchema'
import { createMacroOverflow } from '~/modules/diet/macro-nutrients/application/macroOverflow'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { type UseFieldReturn } from '~/sections/common/hooks/useField'
import { ItemView } from '~/sections/item/components/ItemView'
import { ItemChildrenEditor } from '~/sections/item/components/ItemView/ItemEdit/ItemChildrenEditor'
import { ItemQuantityControls } from '~/sections/item/components/ItemView/ItemEdit/ItemQuantityControls'
import { ItemQuantityShortcuts } from '~/sections/item/components/ItemView/ItemEdit/ItemQuantityShortcuts'
import { ItemFavorite } from '~/sections/item/components/UnifiedItemFavorite'
import { logging } from '~/shared/utils/logging'

// Create macro overflow instance lazily to avoid circular initialization
// issues during SSR/prerender. Use a memo so the factory is reused.
const getMacroOverflowUseCases = () => {
  const memo = createMemo<ReturnType<typeof createMacroOverflow>>(() =>
    createMacroOverflow({
      dayUseCases: useCases.dayUseCases(),
      macroTargetUseCases,
    }),
  )

  return memo
}

export type ItemEditBodyProps = {
  canApply: boolean
  itemDraft: Accessor<Item>
  parentifiedItemDraft: Accessor<ParentItem>
  setItemDraft: Setter<Item>
  macroOverflow: () => {
    enable: boolean
    originalItem?: Item | undefined
  }
  quantityField: UseFieldReturn<number>
  onEditChild?: (child: Item) => void
  viewMode?: 'normal' | 'group'
  clipboardActions?: {
    onCopy: () => void
    onPaste: () => void
  }
  onAddNewItem?: () => void
  showAddItemButton?: boolean
}

export function ItemEditBody(props: ItemEditBodyProps) {
  const handleQuantitySelect = (quantity: number) => {
    logging.debug('[ItemEditBody] shortcut quantity', { quantity })
    props.quantityField.setRawValue(quantity.toString())
  }

  const handleNameChange = (newName: string) => {
    logging.debug('[ItemEditBody] name change', { newName })
    // Enforce max length using shared utility
    const trimmedName = truncateItemName(newName)
    props.setItemDraft({
      ...props.itemDraft(),
      name: trimmedName,
    })
  }

  return (
    <>
      {/* Name input for GroupItem and RecipeItem */}
      <Show when={isParentItem(props.itemDraft())}>
        <div class="mb-4">
          <label for="item-name-input" class="block text-sm text-gray-400 mb-1">
            Nome do item
          </label>
          <input
            id="item-name-input"
            class={`input w-full bg-gray-800 border-gray-600 text-white ${
              !isItemNameValid(props.itemDraft().name) ? 'border-red-500' : ''
            }`}
            type="text"
            value={props.itemDraft().name}
            onInput={(e) => handleNameChange(e.currentTarget.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Digite o nome do item"
            maxLength={MAX_ITEM_NAME_LENGTH}
          />
          <Show when={!isItemNameValid(props.itemDraft().name)}>
            <p class="text-red-500 text-xs mt-1">O nome não pode estar vazio</p>
          </Show>
        </div>
      </Show>

      <ItemView
        mode="edit"
        handlers={{
          onCopy: props.clipboardActions?.onCopy,
        }}
        item={props.itemDraft}
        macroOverflow={props.macroOverflow}
        class="mt-4"
        primaryActions={
          <Show when={asFoodItem(props.itemDraft())} fallback={null}>
            {(foodItem) => <ItemFavorite foodId={foodItem().reference.id} />}
          </Show>
        }
      />

      {/* For foods and recipes (normal mode): normal quantity controls */}
      <Show
        when={
          !isGroupItem(props.itemDraft()) &&
          props.viewMode !== 'group' &&
          useCases.dayUseCases().currentDayDiet()
        }
      >
        {(currentDayDiet) => (
          <>
            <ItemQuantityControls
              itemDraft={props.itemDraft}
              setItemDraft={props.setItemDraft}
              canApply={props.canApply}
              getAvailableMacros={() =>
                getMacroOverflowUseCases()().getAvailableMacros({
                  dayDiet: currentDayDiet(),
                  originalItem: props.macroOverflow().originalItem,
                })
              }
              quantityField={props.quantityField}
            />

            <ItemQuantityShortcuts onQuantitySelect={handleQuantitySelect} />
          </>
        )}
      </Show>

      {/* For groups or recipes in group mode: children editor */}
      <Show when={isGroupItem(props.itemDraft()) || props.viewMode === 'group'}>
        <ItemChildrenEditor
          itemDraft={props.parentifiedItemDraft}
          setItemDraft={props.setItemDraft}
          onEditChild={props.onEditChild}
          onAddNewItem={props.onAddNewItem}
          showAddButton={props.showAddItemButton}
        />
      </Show>
    </>
  )
}
