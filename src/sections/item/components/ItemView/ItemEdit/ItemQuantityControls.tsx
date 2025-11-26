import {
  type Accessor,
  createEffect,
  type Setter,
  Show,
  untrack,
} from 'solid-js'

import { ItemExt } from '~/modules/diet/item/domain/ext/itemExt'
import { RecipeItemExt } from '~/modules/diet/item/domain/ext/recipeItemExt'
import {
  isFoodItem,
  isRecipeItem,
  type Item,
} from '~/modules/diet/item/schema/itemSchema'
import { type MacroNutrientsRecord } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { FloatInput } from '~/sections/common/components/FloatInput'
import { MaxQuantityButton } from '~/sections/common/components/MaxQuantityButton'
import { type UseFieldReturn } from '~/sections/common/hooks/useField'
import { logging } from '~/shared/utils/logging'

export type ItemQuantityControlsProps = {
  itemDraft: Accessor<Item>
  setItemDraft: Setter<Item>
  canApply: boolean
  getAvailableMacros: () => MacroNutrientsRecord
  quantityField: UseFieldReturn<number>
}

export function ItemQuantityControls(props: ItemQuantityControlsProps) {
  createEffect(() => {
    const newQuantity = props.quantityField.value() ?? 0.1
    const currentItem = untrack(props.itemDraft)

    logging.debug(
      '[QuantityControls] Update unified item quantity from field',
      { newQuantity },
    )

    if (isRecipeItem(currentItem)) {
      // For recipe items, scale children proportionally
      try {
        const scaledItem = RecipeItemExt.scaleQuantityAndChildren(
          currentItem,
          newQuantity,
        )
        props.setItemDraft({ ...scaledItem })
      } catch (error) {
        logging.debug('[QuantityControls] Error scaling recipe:', { error })
        // Fallback to simple quantity update if scaling fails
        props.setItemDraft({
          ...currentItem,
          quantity: newQuantity,
        })
      }
    } else {
      // For food items, just update quantity
      props.setItemDraft({
        ...currentItem,
        quantity: newQuantity,
      })
    }
  })

  const increment = () => {
    logging.debug('[QuantityControls] increment')
    props.quantityField.setRawValue(
      ((props.quantityField.value() ?? 0) + 1).toString(),
    )
  }

  const decrement = () => {
    logging.debug('[QuantityControls] decrement')
    props.quantityField.setRawValue(
      Math.max(0, (props.quantityField.value() ?? 0) - 1).toString(),
    )
  }

  const holdRepeatStart = (action: () => void) => {
    logging.debug('[QuantityControls] holdRepeatStart')
    const holdTimeout = setTimeout(() => {
      const holdInterval = setInterval(() => {
        action()
      }, 100)

      const stopHoldRepeat = () => {
        clearInterval(holdInterval)
        document.removeEventListener('mouseup', stopHoldRepeat)
        document.removeEventListener('touchend', stopHoldRepeat)
      }

      document.addEventListener('mouseup', stopHoldRepeat)
      document.addEventListener('touchend', stopHoldRepeat)
    }, 500)

    const stopHoldTimeout = () => {
      clearTimeout(holdTimeout)
      document.removeEventListener('mouseup', stopHoldTimeout)
      document.removeEventListener('touchend', stopHoldTimeout)
    }

    document.addEventListener('mouseup', stopHoldTimeout)
    document.addEventListener('touchend', stopHoldTimeout)
  }

  return (
    <div class="mt-3 flex w-full justify-between gap-1">
      <div
        class="my-1 flex flex-1 justify-around"
        style={{ position: 'relative' }}
      >
        <FloatInput
          field={props.quantityField}
          style={{ width: '100%' }}
          onFieldCommit={(value) => {
            logging.debug('[QuantityControls] FloatInput onFieldCommit', {
              value,
            })
            if (value === undefined) {
              props.quantityField.setRawValue(
                props.itemDraft().quantity.toString(),
              )
            }
          }}
          tabIndex={-1}
          onFocus={(event) => {
            logging.debug('[QuantityControls] FloatInput onFocus')
            event.target.select()
            if (props.quantityField.value() === 0) {
              props.quantityField.setRawValue('')
            }
          }}
          type="number"
          placeholder="Quantidade (gramas)"
          class={`input-bordered input mt-1 border-gray-300 bg-gray-800 ${
            !props.canApply ? 'input-error border-red-500' : ''
          }`}
        />
        <Show
          when={
            isFoodItem(props.itemDraft()) || isRecipeItem(props.itemDraft())
          }
        >
          <MaxQuantityButton
            currentValue={props.quantityField.value() ?? 0}
            macroTargets={props.getAvailableMacros()}
            itemMacros={(() => {
              const item = props.itemDraft()
              if (isFoodItem(item)) {
                return item.reference.macros
              }
              if (isRecipeItem(props.itemDraft())) {
                // For recipes, calculate macros from children (per 100g of prepared recipe)
                const recipeMacros = ItemExt.macros(props.itemDraft())
                const recipeQuantity = props.itemDraft().quantity || 1
                // Convert to per-100g basis for the button
                return {
                  carbs: (recipeMacros.carbs * 100) / recipeQuantity,
                  protein: (recipeMacros.protein * 100) / recipeQuantity,
                  fat: (recipeMacros.fat * 100) / recipeQuantity,
                }
              }
              return { carbs: 0, protein: 0, fat: 0 }
            })()}
            onMaxSelected={(maxValue: number) => {
              logging.debug(
                '[QuantityControls] MaxQuantityButton onMaxSelected',
                { maxValue },
              )
              props.quantityField.setRawValue(maxValue.toFixed(2))
            }}
          />
        </Show>
      </div>
      <div class="my-1 ml-1 flex shrink justify-around gap-1">
        <div
          class="btn-primary btn-xs btn cursor-pointer uppercase h-full w-10 px-6 text-4xl text-red-600"
          onClick={decrement}
          onMouseDown={() => {
            logging.debug('[QuantityControls] decrement mouse down')
            holdRepeatStart(decrement)
          }}
          onTouchStart={() => {
            logging.debug('[QuantityControls] decrement touch start')
            holdRepeatStart(decrement)
          }}
        >
          {' '}
          -{' '}
        </div>
        <div
          class="btn-primary btn-xs btn cursor-pointer uppercase ml-1 h-full w-10 px-6 text-4xl text-green-400"
          onClick={increment}
          onMouseDown={() => {
            logging.debug('[QuantityControls] increment mouse down')
            holdRepeatStart(increment)
          }}
          onTouchStart={() => {
            logging.debug('[QuantityControls] increment touch start')
            holdRepeatStart(increment)
          }}
        >
          {' '}
          +{' '}
        </div>
      </div>
    </div>
  )
}
