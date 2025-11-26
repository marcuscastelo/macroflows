import { type Accessor, type Setter, Show } from 'solid-js'

import { currentDayDiet } from '~/modules/diet/day-diet/application/usecases/dayState'
import { type DayDiet } from '~/modules/diet/day-diet/domain/dayDiet'
import { DayDietExt } from '~/modules/diet/day-diet/domain/dayDietExt'
import { type MacroNutrientsRecord } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { macroTargetUseCases } from '~/modules/diet/macro-target/application/macroTargetUseCases'
import { ItemExt } from '~/modules/diet/unified-item/domain/itemExt'
import {
  asFoodItem,
  isGroupItem,
  type UnifiedItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { type UseFieldReturn } from '~/sections/common/hooks/useField'
import { GroupChildrenEditor } from '~/sections/unified-item/components/GroupChildrenEditor'
import { QuantityControls } from '~/sections/unified-item/components/QuantityControls'
import { QuantityShortcuts } from '~/sections/unified-item/components/QuantityShortcuts'
import { UnifiedItemFavorite } from '~/sections/unified-item/components/UnifiedItemFavorite'
import { UnifiedItemView } from '~/sections/unified-item/components/UnifiedItemView'
import { logging } from '~/shared/utils/logging'

export type UnifiedItemEditBodyProps = {
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

function getAvailableMacros(args: {
  dayDiet: DayDiet
  originalItem?: UnifiedItem | undefined
}): MacroNutrientsRecord {
  logging.debug('getAvailableMacros')
  const dayDiet = args.dayDiet
  const dayMacros = DayDietExt.calcDayMacros(dayDiet)

  const macroTarget = macroTargetUseCases.macroTargetAt(
    new Date(dayDiet.target_day),
  )
  if (!macroTarget) {
    return { carbs: 0, protein: 0, fat: 0 }
  }

  const originalItem = args.originalItem
  const originalMacros = ItemExt.macros(originalItem)
  return {
    carbs: macroTarget.carbs - dayMacros.carbs + originalMacros.carbs,
    protein: macroTarget.protein - dayMacros.protein + originalMacros.protein,
    fat: macroTarget.fat - dayMacros.fat + originalMacros.fat,
  }
}

export function UnifiedItemEditBody(props: UnifiedItemEditBodyProps) {
  const handleQuantitySelect = (quantity: number) => {
    logging.debug('[UnifiedItemEditBody] shortcut quantity', { quantity })
    props.quantityField.setRawValue(quantity.toString())
  }

  return (
    <>
      <UnifiedItemView
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

      {/* Para alimentos e receitas (modo normal): controles de quantidade normal */}
      <Show
        when={
          !isGroupItem(props.item()) &&
          props.viewMode !== 'group' &&
          currentDayDiet()
        }
      >
        {(currentDayDiet) => (
          <>
            <QuantityControls
              item={props.item}
              setItem={props.setItem}
              canApply={props.canApply}
              getAvailableMacros={() =>
                getAvailableMacros({
                  dayDiet: currentDayDiet(),
                  originalItem: props.macroOverflow().originalItem,
                })
              }
              quantityField={props.quantityField}
            />

            <QuantityShortcuts onQuantitySelect={handleQuantitySelect} />
          </>
        )}
      </Show>

      {/* Para grupos ou receitas em modo grupo: editor de filhos */}
      <Show when={isGroupItem(props.item()) || props.viewMode === 'group'}>
        <GroupChildrenEditor
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
