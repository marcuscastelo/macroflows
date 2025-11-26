import { type Accessor, type Setter, Show } from 'solid-js'

import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { macroOverflowUseCases } from '~/modules/diet/macro-nutrients/application/macroOverflow'
import {
  asFoodItem,
  isGroupItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { type UseFieldReturn } from '~/sections/common/hooks/useField'
import { ItemView } from '~/sections/unified-item/components/ItemView'
import { ItemChildrenEditor } from '~/sections/unified-item/components/ItemView/ItemEdit/ItemChildrenEditor'
import { ItemQuantityControls } from '~/sections/unified-item/components/ItemView/ItemEdit/ItemQuantityControls'
import { ItemQuantityShortcuts } from '~/sections/unified-item/components/ItemView/ItemEdit/ItemQuantityShortcuts'
import { UnifiedItemFavorite } from '~/sections/unified-item/components/UnifiedItemFavorite'
import { logging } from '~/shared/utils/logging'

export type ItemEditBodyProps = {
  canApply: boolean
  item: Accessor<UnifiedItem>
  setItem: Setter<UnifiedItem>
  macroOverflow: () => {
    enable: boolean
    originalItem?: UnifiedItem | undefined
  }
  quantityField: UseFieldReturn<number>
  onEditChild?: (child: UnifiedItem) => void
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
    logging.debug('[UnifiedItemEditBody] shortcut quantity', { quantity })
    props.quantityField.setRawValue(quantity.toString())
  }

  return (
    <>
      <ItemView
        mode="edit"
        handlers={{
          onCopy: props.clipboardActions?.onCopy,
        }}
        item={props.item}
        macroOverflow={props.macroOverflow}
        class="mt-4"
        primaryActions={
          <Show when={asFoodItem(props.item())} fallback={null}>
            {(foodItem) => (
              <UnifiedItemFavorite foodId={foodItem().reference.id} />
            )}
          </Show>
        }
      />

      {/* For foods and recipes (normal mode): normal quantity controls */}
      <Show
        when={
          !isGroupItem(props.item()) &&
          props.viewMode !== 'group' &&
          currentDayDiet()
        }
      >
        {(currentDayDiet) => (
          <>
            <ItemQuantityControls
              item={props.item}
              setItem={props.setItem}
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
      <Show when={isGroupItem(props.item()) || props.viewMode === 'group'}>
        <ItemChildrenEditor
          item={props.item}
          setItem={props.setItem}
          onEditChild={props.onEditChild}
          onAddNewItem={props.onAddNewItem}
          showAddButton={props.showAddItemButton}
        />
      </Show>
    </>
  )
}
