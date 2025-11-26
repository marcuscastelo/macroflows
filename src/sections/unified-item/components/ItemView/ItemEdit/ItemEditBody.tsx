import { type Accessor, type Setter, Show } from 'solid-js'

import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import {
  asFoodItem,
  isGroupItem,
  type Item,
  type ParentItem,
} from '~/modules/diet/item/schema/itemSchema'
import { macroOverflowUseCases } from '~/modules/diet/macro-nutrients/application/macroOverflow'
import { type UseFieldReturn } from '~/sections/common/hooks/useField'
import { ItemView } from '~/sections/unified-item/components/ItemView'
import { ItemChildrenEditor } from '~/sections/unified-item/components/ItemView/ItemEdit/ItemChildrenEditor'
import { ItemQuantityControls } from '~/sections/unified-item/components/ItemView/ItemEdit/ItemQuantityControls'
import { ItemQuantityShortcuts } from '~/sections/unified-item/components/ItemView/ItemEdit/ItemQuantityShortcuts'
import { ItemFavorite } from '~/sections/unified-item/components/UnifiedItemFavorite'
import { logging } from '~/shared/utils/logging'

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

  return (
    <>
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
          currentDayDiet()
        }
      >
        {(currentDayDiet) => (
          <>
            <ItemQuantityControls
              itemDraft={props.itemDraft}
              setItemDraft={props.setItemDraft}
              canApply={props.canApply}
              getAvailableMacros={() =>
                macroOverflowUseCases.getAvailableMacros({
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
